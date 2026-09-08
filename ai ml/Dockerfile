FROM python:3.12-slim

WORKDIR /app

# Copy dependency definitions first so Docker can reuse its cache.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV AI_HOST=0.0.0.0
ENV AI_PORT=8000

EXPOSE 8000

CMD ["python", "api.py"]
