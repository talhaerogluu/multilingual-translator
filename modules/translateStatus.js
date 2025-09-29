export function showTranslationStatus() {
    if (document.getElementById("translate-status")) return; // Zaten varsa tekrar ekleme
  
    const card = document.createElement("div");
    card.id = "translate-status";
  
    // 💬 Basit görünüm (CSS'siz versiyon)
    card.style = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #fff;
      padding: 12px 16px;
      border: 1px solid #ccc;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      font-family: sans-serif;
      font-size: 14px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
  
    card.innerHTML = `
      <span style="
        width: 14px;
        height: 14px;
        border: 2px solid #ccc;
        border-top-color: #333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
      "></span>
      <span>Çeviri yapılıyor...</span>
    `;
  
    document.body.appendChild(card);
  
    // 🌀 Animasyon için keyframe JS üzerinden tanımlandı
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  export function hideTranslationStatus() {
    const card = document.getElementById("translate-status");
    if (card) card.remove();
  }