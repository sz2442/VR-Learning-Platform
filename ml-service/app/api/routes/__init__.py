"""API route modules."""

from .predict import router as predict_router
from .analyze import router as analyze_router
from .health import router as health_router

__all__ = ["predict_router", "analyze_router", "health_router"]
