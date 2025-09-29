import { dispatchTranslations } from "./modules/translateDispatcher.js";
import { detectLanguageByIP } from "./modules/geoDetect.js";
import { showLanguageNotice } from "./modules/notice.js";
import { showTranslationStatus, hideTranslationStatus } from "./modules/translateStatus.js";

// --- Tek seferlik bootstrap
if (window.__trBooted) throw new Error("Translate bootstrap already initialized");
window.__trBooted = true;

console.log("[TR] MAIN starting...");
console.log("MAIN_VERSION v16", performance.now());

// Worker'ı versiyon query ile yükle (cache kır)
if (!window.__trWorker) {
  window.__trWorker = new Worker("./modules/translate.worker.js?v=16", { type: "module" });
}
const worker = window.__trWorker;

// Global durum
window.__trCache    = window.__trCache    || new Map();  // `${textNorm}::${lang}` -> translated
window.__trInFlight = window.__trInFlight || new Set();  // `${elId}::${lang}`
window.__trRunId    = 0;                                  // artan run kimliği
window.__trRunLang  = null;                               // aktif dil
window.__trBusy     = false;                              // kilit

// Pending sayaçları
const pending = { priority: 0, lazy: 0 };

// Basit normalizasyon
function normalizeText(t) { return (t || "").trim().replace(/\s+/g, " "); }

// --- küçük, ucuz client-side kalıcı cache (geri dönüşleri hızlandırır)
function lsGet(key){ try { return localStorage.getItem(key); } catch { return null; } }
function lsSet(key,val){ try { localStorage.setItem(key,val); } catch {} }
function k(original, lang){ return `tr_v1::${normalizeText(original)}::${lang}`; }

// Kaç öğe çevrilecek?
function computePending(lang) {
  const pri = Array.from(document.querySelectorAll("[data-translate='true']:not([lazy-translate])"))
    .filter(el => !el.dataset[lang]).length;
  const lazy = Array.from(document.querySelectorAll("[lazy-translate='true']"))
    .filter(el => !el.dataset[lang]).length;
  pending.priority = pri;
  pending.lazy = lazy;
  console.log("[TR] computePending", { lang, pending: { ...pending }});
}

// DOM'a yaz + cache
function setTranslated(el, lang, original, translated) {
  el.textContent = translated;
  el.style.opacity = "1";
  el.dataset[lang] = translated;

  const gKey = `${normalizeText(original)}::${lang}`;
  window.__trCache.set(gKey, translated);
  lsSet(k(original, lang), translated);

  window.__trInFlight.delete(`${el.id}::${lang}`);
  // çok uzun log şişirmesin
  console.log("[TR] APPLY", { elId: el.id, lang, from: original.slice(0,40), to: (translated||"").slice(0,40) });
}

// Watchdog: worker'dan ses çıkmazsa kilidi kaldır
let watchdogTimer = null;
function startWatchdog(runId, lang) {
  clearWatchdog();
  watchdogTimer = setTimeout(() => {
    console.warn("[TR] WATCHDOG timeout → unlock", { runId, lang });
    window.__trBusy = false;
    window.__trRunId = 0;
    window.__trRunLang = null;
    hideTranslationStatus();
  }, 7000); // 7 sn sessizlikte kilidi kaldır
}
function clearWatchdog(){ if (watchdogTimer) clearTimeout(watchdogTimer); watchdogTimer = null; }

// Debounce
let debounceTimer = null;
function debouncedDispatch(lang, source="unknown") {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => doDispatch(lang, source), 60);
}

// Asıl dispatch
function doDispatch(lang, source="unknown") {
  if (window.__trBusy) {
    console.log("skip: busy", { lang, source });
    return;
  }

  // 0) ilk olarak DOM ve localStorage cache varsa ANINDA uygula (network bekleme)
  document.querySelectorAll("[data-translate='true'], [lazy-translate='true']").forEach((el) => {
    const original = normalizeText(el.dataset.tr || el.textContent);
    if (!el.dataset.tr) el.dataset.tr = original;
    const domCached = el.dataset[lang];
    const lsCached  = lsGet(k(original, lang));
    const gCached   = window.__trCache.get(`${original}::${lang}`);
    const val = domCached || gCached || lsCached;
    if (val) { el.textContent = val; el.style.opacity = "1"; }
  });

  // 1) gerçekten çevrilmesi gereken var mı?
  computePending(lang);
  if ((pending.priority + pending.lazy) === 0) {
    console.log("[TR] nothing to do", { lang, source });
    return;
  }

  // 2) Yeni run
  const prevRun = window.__trRunId;
  const runId = prevRun + 1;
  window.__trRunId = runId;
  window.__trRunLang = lang;
  window.__trBusy = true;

  // Eski run'ı iptal et
  if (prevRun > 0) worker.postMessage({ type: "cancel-run", runId: prevRun });

  showTranslationStatus();
  console.log("[TR] RUN START", { runId, lang });

  // 3) Watchdog'u başlat
  startWatchdog(runId, lang);

  // 4) Dispatch
  dispatchTranslations(lang, worker, runId);
}

// Worker eventleri
worker.addEventListener("message", (e) => {
  const msg = e.data;
  console.log("[TR] MSG", { type: msg.type, elId: msg.elId, msgRunId: msg.runId, activeRun: window.__trRunId, msgLang: msg.target });

  // Bu mesaj aktif run'a ve aktif dile mi ait?
  if (msg.runId !== window.__trRunId) return;
  if (msg.target !== window.__trRunLang) return;

  if (msg.type === "error") {
    // hata durumunda kilidi bırak ve bildirimi kapat
    window.__trBusy = false;
    window.__trRunId = 0;
    window.__trRunLang = null;
    pending.priority = 0;
    pending.lazy = 0;
    hideTranslationStatus();
    clearWatchdog();
    console.warn("[TR] RUN ERROR, unlocked");
    return;
  }

  clearWatchdog(); // canlıyız → resetle
  startWatchdog(msg.runId, msg.target);

  const el = document.getElementById(msg.elId);
  if (el && (msg.type === "priority-result" || msg.type === "lazy-result")) {
    const original = el.dataset.tr || el.textContent;
    setTranslated(el, msg.target, original, msg.translated);
  }

  if (msg.type === "priority-result" && pending.priority > 0) pending.priority -= 1;
  if (msg.type === "lazy-result"     && pending.lazy     > 0) pending.lazy     -= 1;

  if (pending.priority === 0 && pending.lazy === 0) {
    console.log("[TR] RUN END", { runId: window.__trRunId, lang: window.__trRunLang });
    window.__trBusy = false;
    window.__trRunLang = null;
    window.__trRunId = 0;
    hideTranslationStatus();
    clearWatchdog();
  }
});

// --- Dil dropdown
async function populateLanguageDropdown() {
  const select = document.getElementById("languageSelect");

  const fallback = {
    tr: { name: "Türkçe",   emoji: "🇹🇷" },
    en: { name: "English",  emoji: "🇬🇧" },
    es: { name: "Español",  emoji: "🇪🇸" },
    de: { name: "Deutsch",  emoji: "🇩🇪" },
    fr: { name: "Français", emoji: "🇫🇷" },
    ar: { name: "العربية",  emoji: "🇸🇦" },
    it: { name: "Italiano", emoji: "🇮🇹" },
    vi: { name: "Tiếng Việt", emoji: "🇻🇳" },
  };

  let data = fallback;
  try {
    const res = await fetch("./public/languages.json", { cache: "no-store" });
    if (res.ok) data = await res.json();
  } catch {}
  select.innerHTML = "";
  for (const [code, { name, emoji }] of Object.entries(data)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = `${emoji || "🌐"} ${name}`;
    select.appendChild(opt);
  }
  return Object.keys(data);
}

const select = document.getElementById("languageSelect");
select.addEventListener("change", () => {
  const selected = select.value;
  localStorage.setItem("preferredLang", selected);
  const notice = document.getElementById("lang-notice");
  if (notice) notice.remove();
  debouncedDispatch(selected, "select-change");
});

// Bootstrap
window.addEventListener("DOMContentLoaded", async () => {
  const dropdownLangs = await populateLanguageDropdown();
  const backFlag = sessionStorage.getItem("backToOriginal");

  let langToUse;
  let shouldShowNotice = false;

  if (!backFlag && !localStorage.getItem("preferredLang")) {
    let detected = await detectLanguageByIP();
    if (!dropdownLangs.includes(detected)) detected = "en";
    langToUse = detected;
    shouldShowNotice = true;
  } else {
    langToUse = localStorage.getItem("preferredLang") || "tr";
  }

  select.value = langToUse;
  debouncedDispatch(langToUse, "dom-ready");

  if (shouldShowNotice) showLanguageNotice(langToUse);
  sessionStorage.removeItem("backToOriginal");
});