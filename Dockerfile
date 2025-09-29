# ---- Dockerfile ----
    FROM python:3.11-slim

    WORKDIR /app
    
    # (Opsiyonel) Sistem bağımlılıkları gerekiyorsa aç
    # RUN apt-get update && apt-get install -y --no-install-recommends \
    #     build-essential && rm -rf /var/lib/apt/lists/*
    
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    
    COPY . .
    
    # Logların anında gelmesi için
    ENV PYTHONUNBUFFERED=1
    
    # Deklaratif (zorunlu değil)
    EXPOSE 8000
    
    # ÖNEMLİ: $PORT env değişkenini shell expand etsin
    CMD ["bash", "-lc", "uvicorn main:app --host 0.0.0.0 --port $PORT"]