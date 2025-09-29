# 1. Temel Python image
    FROM python:3.11-slim

    # 2. Çalışma dizini
    WORKDIR /app
    
    # 3. Sistem bağımlılıkları (opsiyonel)
    RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        && rm -rf /var/lib/apt/lists/*
    
    # 4. Python bağımlılıkları
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    
    # 5. Uygulama dosyaları
    COPY . .
    
    # 6. Ortam değişkenleri
    ENV PORT=8000
    
    # 7. Uvicorn ile FastAPI başlat
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]