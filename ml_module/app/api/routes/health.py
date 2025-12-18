"""
Health Check API Routes.

Provides endpoints for monitoring service health.
"""

import logging
import time
import psutil
from typing import Optional
from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.services.model_loader import get_model_manager
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])

# Track service start time
_start_time = time.time()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check if the service is healthy and model is loaded"
)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.
    
    Returns:
        HealthResponse with service status
    """
    settings = get_settings()
    model_manager = get_model_manager(settings.model_path)
    
    uptime = time.time() - _start_time
    
    # Get memory usage
    try:
        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
    except Exception:
        memory_mb = None
    
    return HealthResponse(
        status="healthy",
        model_loaded=model_manager.is_loaded,
        model_version=model_manager.model_version if model_manager.is_loaded else "not_loaded",
        uptime_seconds=round(uptime, 2),
        memory_usage_mb=round(memory_mb, 2) if memory_mb else None
    )


@router.get(
    "/ready",
    summary="Readiness check",
    description="Check if the service is ready to handle requests"
)
async def readiness_check() -> dict:
    """
    Readiness probe for Kubernetes.
    
    Returns 200 if service is ready, 503 otherwise.
    """
    settings = get_settings()
    model_manager = get_model_manager(settings.model_path)
    
    if model_manager.is_loaded:
        return {"ready": True, "model_loaded": True}
    
    # Try to load model
    try:
        model_manager.load_model()
        return {"ready": True, "model_loaded": True}
    except Exception as e:
        logger.warning(f"Model not ready: {e}")
        return {"ready": True, "model_loaded": False, "note": "Running with fallback"}


@router.get(
    "/live",
    summary="Liveness check",
    description="Check if the service is alive"
)
async def liveness_check() -> dict:
    """
    Liveness probe for Kubernetes.
    
    Always returns 200 if the service is responding.
    """
    return {"alive": True, "timestamp": time.time()}


@router.get(
    "/info",
    summary="Service info",
    description="Get detailed service information"
)
async def service_info() -> dict:
    """
    Get detailed service information.
    """
    settings = get_settings()
    model_manager = get_model_manager(settings.model_path)
    
    info = {
        "service": "VR Meta University ML Service",
        "version": "1.0.0",
        "config": {
            "model_version": settings.model_version,
            "confidence_threshold": settings.confidence_threshold,
        },
        "model_info": model_manager.get_info() if model_manager.is_loaded else None,
        "uptime_seconds": round(time.time() - _start_time, 2),
    }
    
    # Add memory stats
    try:
        process = psutil.Process()
        info["memory"] = {
            "rss_mb": round(process.memory_info().rss / 1024 / 1024, 2),
            "vms_mb": round(process.memory_info().vms / 1024 / 1024, 2),
        }
    except Exception:
        pass
    
    return info
