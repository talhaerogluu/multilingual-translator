import os, json, hashlib, httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

load_dotenv()

app = FastAPI()

# Kapatmak istersen kaldır; tek origin’de sorun olmaz ama dursun
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

CACHE_FILE = "cache.json"
API_KEY = os.getenv("GOOGLE_API_KEY")

class TranslateRequest(BaseModel):
    text: str
    target: str

def _h(text: str, lang: str) -> str:
    return hashlib.sha256(f"{text}::{lang}".encode()).hexdigest()

def _load():
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save(c):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(c, f, ensure_ascii=False, indent=2)

@app.post("/translate")
async def translate_text(req: TranslateRequest):
    cache = _load()
    key = _h(req.text, req.target)
    if key in cache:
        return {"translated_text": cache[key]}

    url = "https://translation.googleapis.com/language/translate/v2"
    params = {"key": API_KEY}
    payload = {"q": req.text, "target": req.target, "format": "text"}

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(url, params=params, json=payload)
        r.raise_for_status()
        data = r.json()
    translated = data["data"]["translations"][0]["translatedText"]

    cache[key] = translated
    _save(cache)
    return {"translated_text": translated}

# ---- statik servis (tek origin) ----
app.mount("/public", StaticFiles(directory="public"), name="public")
app.mount("/modules", StaticFiles(directory="modules"), name="modules")

@app.get("/")
async def root():
    return FileResponse("index.html")

app.mount("/", StaticFiles(directory=".", html=True), name="static")

# main.py (son blok)
if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),   # Render PORT'u geçer
        reload=os.getenv("RELOAD", "0") == "1"
    )