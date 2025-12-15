# VR Meta University ML Service Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Training Stage (optional)
# ============================================
FROM python:3.11-slim as trainer

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy training code
COPY training/ ./training/
COPY app/ ./app/

# Train model (generates ./models/random_forest_v1.joblib)
RUN mkdir -p models && \
    python -m training.train --samples 5000 --output ./models/random_forest_v1.joblib

# ============================================
# Stage 2: Production Stage
# ============================================
FROM python:3.11-slim as production

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY training/ ./training/

# Copy trained model from trainer stage
COPY --from=trainer /app/models/ ./models/

# Create necessary directories
RUN mkdir -p ./models ./logs && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Environment variables
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ML_SERVICE_HOST=0.0.0.0 \
    ML_SERVICE_PORT=8000 \
    MODEL_PATH=./models/random_forest_v1.joblib \
    LOG_LEVEL=INFO

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
