# ---- Dockerfile ----
    FROM python:3.11-slim

    WORKDIR /app
    
    # (Opsiyonel) Sistem bağımlılıkları
    # RUN apt-get update && apt-get install -y --no-install-recommends \
    #     build-essential && rm -rf /var/lib/apt/lists/*
    
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    
    COPY . .
    
    # Loglar anında gelsin
    ENV PYTHONUNBUFFERED=1
    
    # Varsayılan port gösterelim (Render yine override edecek)
    EXPOSE 8000
    
    # Burada ${PORT:-8000} kullandığımız için
    # Render’ın verdiği PORT varsa onu, yoksa 8000’i alır
    CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]