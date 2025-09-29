# 🌍 Multilingual HTML Translator (FastAPI + Web Worker + Google Translate API)

Bu proje, statik HTML sayfalarındaki belirli alanların farklı dillere çevrilmesini sağlar.  
Hem kısa hem de uzun metinleri destekler. Uzun metinlerde Web Worker kullanarak performans artırır.  

---

## 🚀 Özellikler

- `data-translate="true"` → Hızlı çevrilecek alanlar (kısa metinler)  
- `lazy-translate="true"` → Uzun metinler için parçalı ve paralel çeviri  
- 🌐 Otomatik IP tabanlı dil algılama  
- 📦 Çeviri cache sistemi (JSON dosyası)  
- 🔁 `localStorage` ve `sessionStorage` ile dil tercihlerini hatırlama  
- 🎯 Google Translate API V2 (default), **V3 destekli**  
- ⚡ Web Worker ile paralel çeviri işlemleri  
- 🔔 Kullanıcıya çeviri yapılıyor bildirimi (`translateStatus.js`)  
- ✅ Tüm çeviriler RAM'de sıraya alınır, doğru sıralamayla DOM'a yazılır  

---

## 🧱 Proje Yapısı

```
multilingual-html/
│
├── public/
│   └── languages.json            # Dillerin kodu, adı, emoji flag bilgisi
│
├── modules/
│   ├── chunkUtils.js             # Metni parçalara bölme ve concurrency ayarlama
│   ├── translate.worker.js       # Web Worker (arka planda çeviri yapan yapı)
│   ├── translateDispatcher.js    # DOM’daki çevrilecek alanları bulur ve Worker’a yollar
│   ├── translateStatus.js        # “Çeviri yapılıyor…” bildirimi
│   ├── notice.js                 # Otomatik dil seçimi sonrası uyarı kutusu
│   └── geoDetect.js              # IP’den ülke bazlı dil tahmini
│
├── main.js                       # Sayfanın yüklenmesini ve dil değişimini yönetir
├── index.html                    # Test/demo HTML sayfası
├── .env                          # Google API key burada tutulur
├── cache.json                    # Çeviri önbelleği (hash bazlı)
└── main.py                       # FastAPI backend (çeviri & cache)
```

---

## ⚙️ Kurulum

1. Python bağımlılıklarını yükle:
   pip install fastapi uvicorn python-dotenv httpx

2.	.env dosyası oluştur:
    GOOGLE_API_KEY=your_real_google_api_key_here

3.	FastAPI sunucusunu başlat:
    uvicorn main:app --reload

4.	index.html dosyasını Live Server ile çalıştır (VS Code’da sağ tık → “Open with Live Server”)

---

👨‍💻 Geliştirici:Talha Eroğlu