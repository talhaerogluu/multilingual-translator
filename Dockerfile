# ---- Dockerfile ----
    FROM python:3.11-slim

    WORKDIR /app
    
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    
    COPY . .
    
    ENV PYTHONUNBUFFERED=1
    # Render kendi $PORT değişkenini sağlıyor, biz direkt kullanıyoruz
    CMD uvicorn main:app --host 0.0.0.0 --port $PORT