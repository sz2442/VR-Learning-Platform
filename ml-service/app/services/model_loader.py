"""
Model Loading and Management Module.

Handles loading, caching, and version management of ML models.
"""

import os
import logging
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime

logger = logging.getLogger(__name__)


class ModelLoadError(Exception):
    """Raised when model loading fails."""
    pass


class ModelManager:
    """
    Manages ML model loading and inference.
    
    Supports:
    - Model loading from disk
    - Model versioning
    - Feature importance extraction
    - Confidence calculation
    """
    
    def __init__(self, model_path: str = "./models/random_forest_v1.joblib"):
        """
        Initialize model manager.
        
        Args:
            model_path: Path to the trained model file
        """
        self.model_path = Path(model_path)
        self.model: Optional[RandomForestClassifier] = None
        self.model_version: str = "unknown"
        self.model_metadata: Dict[str, Any] = {}
        self.feature_names: Optional[list] = None
        self.loaded_at: Optional[datetime] = None
        self._is_loaded = False
    
    def load_model(self, force_reload: bool = False) -> bool:
        """
        Load model from disk.
        
        Args:
            force_reload: Force reload even if already loaded
            
        Returns:
            True if model loaded successfully
            
        Raises:
            ModelLoadError: If model loading fails
        """
        if self._is_loaded and not force_reload:
            logger.debug("Model already loaded, skipping")
            return True
        
        if not self.model_path.exists():
            logger.warning(f"Model file not found: {self.model_path}")
            return False
        
        try:
            logger.info(f"Loading model from {self.model_path}")
            
            # Load model bundle (model + metadata)
            bundle = joblib.load(self.model_path)
            
            if isinstance(bundle, dict):
                self.model = bundle.get("model")
                self.model_version = bundle.get("version", "rf_v1.0")
                self.model_metadata = bundle.get("metadata", {})
                self.feature_names = bundle.get("feature_names", [])
            else:
                # Legacy format: just the model
                self.model = bundle
                self.model_version = "rf_v1.0"
                self.model_metadata = {}
                self.feature_names = None
            
            self._is_loaded = True
            self.loaded_at = datetime.utcnow()
            
            logger.info(f"Model loaded successfully: version={self.model_version}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self._is_loaded = False
            raise ModelLoadError(f"Failed to load model: {e}") from e
    
    def predict(self, features: np.ndarray) -> Tuple[int, float]:
        """
        Make prediction with confidence.
        
        Args:
            features: Feature vector (1D or 2D array)
            
        Returns:
            Tuple of (predicted_difficulty, confidence)
        """
        if not self._is_loaded or self.model is None:
            raise ModelLoadError("Model not loaded. Call load_model() first.")
        
        # Ensure 2D array
        if features.ndim == 1:
            features = features.reshape(1, -1)
        
        # Get prediction
        prediction = self.model.predict(features)[0]
        
        # Get probability for confidence
        probabilities = self.model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))
        
        # Ensure prediction is in valid range [1, 10]
        predicted_difficulty = int(np.clip(prediction, 1, 10))
        
        return predicted_difficulty, confidence
    
    def get_feature_importance(self, top_n: int = 5) -> list:
        """
        Get top feature importances.
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            List of dicts with feature name and importance
        """
        if not self._is_loaded or self.model is None:
            return []
        
        importances = self.model.feature_importances_
        
        # Get feature names
        if self.feature_names:
            names = self.feature_names
        else:
            names = [f"feature_{i}" for i in range(len(importances))]
        
        # Sort by importance
        indices = np.argsort(importances)[::-1][:top_n]
        
        return [
            {"feature": names[i], "importance": round(float(importances[i]), 4)}
            for i in indices
        ]
    
    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._is_loaded and self.model is not None
    
    def get_info(self) -> Dict[str, Any]:
        """Get model information."""
        info = {
            "loaded": self._is_loaded,
            "version": self.model_version,
            "path": str(self.model_path),
        }
        
        if self._is_loaded and self.model is not None:
            info["n_estimators"] = self.model.n_estimators
            info["n_features"] = self.model.n_features_in_
            info["n_classes"] = len(self.model.classes_)
            info["classes"] = self.model.classes_.tolist()
            
        if self.loaded_at:
            info["loaded_at"] = self.loaded_at.isoformat()
            
        info["metadata"] = self.model_metadata
        
        return info


# Global model manager instance
_model_manager: Optional[ModelManager] = None


def get_model_manager(model_path: str = "./models/random_forest_v1.joblib") -> ModelManager:
    """Get or create global model manager instance."""
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager(model_path)
    return _model_manager


def reset_model_manager():
    """Reset global model manager (for testing)."""
    global _model_manager
    _model_manager = None
