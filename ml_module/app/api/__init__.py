"""API module."""

from .routes import predict_router, analyze_router, health_router
from .dependencies import (
    get_settings_dep,
    get_model_manager_dep,
    get_predictor_dep,
    get_db_manager_dep,
    require_model_loaded,
)

__all__ = [
    "predict_router",
    "analyze_router", 
    "health_router",
    "get_settings_dep",
    "get_model_manager_dep",
    "get_predictor_dep",
    "get_db_manager_dep",
    "require_model_loaded",
]
