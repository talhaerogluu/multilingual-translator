export async function showLanguageNotice(langCode) {
  // ✅ Dosya adı düzeltildi
  const res = await fetch("./public/languages.json");
  const languageData = await res.json();

  const languageInfo = languageData[langCode] || {
    name: (langCode || "en").toUpperCase(),
    emoji: "🌐"
  };

  const template = "This page was automatically translated to <strong>{lang}</strong>.";
  const message = template.replace("{lang}", `${languageInfo.emoji} ${languageInfo.name}`);

  const notice = document.createElement("div");
  notice.id = "lang-notice";
  notice.style = `
    background: #f5f5f5;
    padding: 12px;
    text-align: center;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 9999;
    font-family: sans-serif;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  `;

  notice.innerHTML = `
    ${message}
    <button id="resetLangBtn" style="margin-left: 10px; padding: 5px 10px;">🔁 Back to original</button>
  `;

  document.body.appendChild(notice);

  document.getElementById("resetLangBtn").addEventListener("click", () => {
    localStorage.removeItem("preferredLang");
    sessionStorage.setItem("backToOriginal", "true");
    location.reload();
  });
}