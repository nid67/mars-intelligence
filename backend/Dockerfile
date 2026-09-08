# ==============================================================================
# Multi-Stage Dockerfile for MARS Backend
# Python 3.11 with GDAL, GEOS, PROJ and PyTorch CPU
# ==============================================================================
FROM python:3.11-slim as base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies for geospatial libraries (GDAL, GEOS, PROJ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    gdal-bin \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY backend/requirements.txt /app/backend/requirements.txt

# Install PyTorch CPU wheel first to keep image lightweight
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining requirements
RUN pip install -r /app/backend/requirements.txt

# Copy source tree
COPY . /app

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
