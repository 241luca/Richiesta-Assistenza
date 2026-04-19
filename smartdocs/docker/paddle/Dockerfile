FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PaddleOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PaddleOCR
RUN pip install --no-cache-dir paddlepaddle paddleocr flask

# Expose port
EXPOSE 8002

# Copy service script
COPY paddle_service.py /app/

# Run service
CMD ["python", "paddle_service.py"]
