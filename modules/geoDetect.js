const countryToLang = {
    tr: "tr",
    us: "en",
    gb: "en",
    fr: "fr",
    ar: "ar",
    de: "de",
  };
  
  export async function detectLanguageByIP() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const countryCode = data.country_code.toLowerCase();
      return countryToLang[countryCode] || "en"; // fallback: en
    } catch (err) {
      console.error("Konum algılama başarısız:", err);
      return "en";
    }
  }