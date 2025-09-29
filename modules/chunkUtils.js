// 📄 Metni parçalara ayır (varsayılan 4800 karakter)
export function splitIntoChunks(text, maxLen = 4800) {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxLen) {
      chunks.push({
        index: chunks.length,
        text: text.slice(i, i + maxLen)
      });
    }
    return chunks;
  }
  
  // 🧠 Donanım bilgisi: çekirdek sayısı
  export function getHardwareConcurrency() {
    return navigator.hardwareConcurrency || 4; // fallback: 4
  }
  
  // 🔄 Akıllı eşzamanlılık (örnek: 2 çekirdek → 4 istek)
  export function getOptimalConcurrency() {
    const cores = getHardwareConcurrency();
    return Math.min(20, cores * 2); // en fazla 20 fetch
  }