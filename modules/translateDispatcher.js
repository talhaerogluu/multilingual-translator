import { splitIntoChunks, getOptimalConcurrency } from "./chunkUtils.js";

function normalizeText(t) { return (t || "").trim().replace(/\s+/g, " "); }

export function dispatchTranslations(lang, worker, runId) {
  window.__trCache    = window.__trCache    || new Map();
  window.__trInFlight = window.__trInFlight || new Set();

  // 1) Kısa metinler
  document.querySelectorAll("[data-translate='true']:not([lazy-translate])").forEach((el, i) => {
    if (!el.id) el.id = `el-${Date.now()}-${i}`;

    const original = normalizeText(el.dataset.tr || el.textContent);
    if (!el.dataset.tr) el.dataset.tr = original;

    // DOM cache
    if (el.dataset[lang]) {
      el.textContent = el.dataset[lang];
      el.style.opacity = "1";
      return;
    }
    // Global cache
    const gKey = `${el.dataset.tr}::${lang}`;
    if (window.__trCache.has(gKey)) {
      const translated = window.__trCache.get(gKey);
      el.dataset[lang] = translated;
      el.textContent = translated;
      el.style.opacity = "1";
      return;
    }
    // In-flight
    const inflightKey = `${runId}:${el.id}::${lang}`;
    if (window.__trInFlight.has(inflightKey)) return;
    window.__trInFlight.add(inflightKey);

    el.style.opacity = "0.3";
    worker.postMessage({
      type: "priority",
      elId: el.id,
      text: el.dataset.tr, // daima dataset.tr
      target: lang,
      runId
    });
  });

  // 2) Uzun metinler
  document.querySelectorAll("[lazy-translate='true']").forEach((el, i) => {
    if (!el.id) el.id = `lazy-el-${Date.now()}-${i}`;

    const original = normalizeText(el.dataset.tr || el.textContent);
    if (!el.dataset.tr) el.dataset.tr = original;

    // DOM cache
    if (el.dataset[lang]) {
      el.textContent = el.dataset[lang];
      el.style.opacity = "1";
      return;
    }
    // Global cache
    const gKey = `${el.dataset.tr}::${lang}`;
    if (window.__trCache.has(gKey)) {
      const translated = window.__trCache.get(gKey);
      el.dataset[lang] = translated;
      el.textContent = translated;
      el.style.opacity = "1";
      return;
    }
    // In-flight
    const inflightKey = `${runId}:${el.id}::${lang}`;
    if (window.__trInFlight.has(inflightKey)) return;
    window.__trInFlight.add(inflightKey);

    const chunks = splitIntoChunks(el.dataset.tr);
    const concurrency = getOptimalConcurrency();

    el.style.opacity = "0.3";
    worker.postMessage({
      type: "lazy",
      elId: el.id,
      chunks,
      target: lang,
      concurrency,
      runId
    });
  });
}