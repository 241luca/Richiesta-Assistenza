FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Marker (latest version, CPU-only) and Flask
ENV PIP_DEFAULT_TIMEOUT=300
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir marker-pdf flask

# Expose port
EXPOSE 8001

# Copy service script
COPY marker_service.py /app/

# Run service
CMD ["python", "marker_service.py"]
