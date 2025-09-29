console.log("WORKER_VERSION v16");

// run bazlı iptal kontrolü
const inflight = new Map();

async function postJSON(url, body, controller) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller?.signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function fetchTranslation(text, target, key) {
  const ac = new AbortController();
  inflight.set(key, ac);
  try {
    const data = await postJSON(`/translate`, { text, target }, ac);
    return data.translated_text;
  } finally {
    inflight.delete(key);
  }
}

self.onmessage = async (e) => {
  const msg = e.data;

  if (msg.type === "cancel-run") {
    const { runId } = msg;
    for (const [key, ac] of inflight) {
      if (key.startsWith(`${runId}:`)) {
        try { ac.abort(); } catch {}
        inflight.delete(key);
      }
    }
    return;
  }

  if (msg.type === "priority") {
    const { elId, text, target, runId } = msg;
    const key = `${runId}:${elId}:pri`;
    try {
      const translated = await fetchTranslation(text, target, key);
      self.postMessage({ type: "priority-result", elId, translated, target, runId });
    } catch (err) {
      if (String(err).includes("AbortError")) return;
      self.postMessage({ type: "error", elId, target, runId });
    }
  }

  if (msg.type === "lazy") {
    const { chunks, target, elId, concurrency = 4, runId } = msg;
    try {
      const results = new Array(chunks.length);
      let index = 0;

      while (index < chunks.length) {
        const batch = chunks.slice(index, index + concurrency);
        const settled = await Promise.allSettled(
          batch.map(({ index: idx, text }) =>
            fetchTranslation(text, target, `${runId}:${elId}:lazy:${idx}`)
              .then(translated => ({ idx, translated }))
          )
        );
        for (const s of settled) {
          if (s.status === "fulfilled") results[s.value.idx] = s.value.translated;
        }
        index += concurrency;
      }

      const finalText = results.map(t => t ?? "").join("");
      self.postMessage({ type: "lazy-result", elId, translated: finalText, target, runId });
    } catch (err) {
      if (String(err).includes("AbortError")) return;
      self.postMessage({ type: "error", elId, target, runId });
    }
  }
};