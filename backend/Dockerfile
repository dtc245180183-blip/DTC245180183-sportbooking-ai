# Backend Dockerfile for FastAPI
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing bytecode (.pyc) and ensure unbuffered output for logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip to latest version
RUN pip install --no-cache-dir --upgrade pip

# Install Python dependencies with extended timeout
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=100 -r requirements.txt

# Copy backend source code and initial database
COPY . .

# Expose backend API port
EXPOSE 8000

# Run FastAPI via Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
