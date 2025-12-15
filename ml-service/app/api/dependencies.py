"""
Shared API dependencies.

Provides dependency injection for FastAPI routes.
"""

from typing import Generator
from fastapi import Depends, HTTPException, status

from app.services.predictor import DifficultyPredictor, get_predictor
from app.services.model_loader import ModelManager, get_model_manager
from app.utils.database import DatabaseManager, get_db_manager
from app.config import Settings, get_settings


def get_settings_dep() -> Settings:
    """Get application settings dependency."""
    return get_settings()


def get_model_manager_dep(
    settings: Settings = Depends(get_settings_dep)
) -> ModelManager:
    """Get model manager dependency."""
    manager = get_model_manager(settings.model_path)
    return manager


def get_predictor_dep(
    model_manager: ModelManager = Depends(get_model_manager_dep)
) -> DifficultyPredictor:
    """Get predictor dependency."""
    return get_predictor()


def get_db_manager_dep() -> DatabaseManager:
    """Get database manager dependency."""
    return get_db_manager()


async def require_model_loaded(
    model_manager: ModelManager = Depends(get_model_manager_dep)
) -> ModelManager:
    """Require that model is loaded."""
    if not model_manager.is_loaded:
        try:
            model_manager.load_model()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Model not available: {e}"
            )
    return model_manager
