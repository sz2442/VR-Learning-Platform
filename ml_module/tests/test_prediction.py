"""
Tests for prediction service.
"""

import pytest
import numpy as np
from pathlib import Path
import tempfile

from app.services.predictor import DifficultyPredictor, PredictionResult, get_predictor
from app.services.model_loader import ModelManager, get_model_manager, reset_model_manager
from app.services.feature_engineering import AttemptRecord


@pytest.fixture(autouse=True)
def reset_singleton():
    """Reset singleton instances before each test."""
    reset_model_manager()
    yield


@pytest.fixture
def predictor():
    """Create predictor instance."""
    return DifficultyPredictor()


@pytest.fixture
def sample_attempts_data():
    """Sample attempt data as dictionaries."""
    return [
        {"question_id": 1, "difficulty": 5, "is_correct": True, "time_spent_seconds": 20},
        {"question_id": 2, "difficulty": 5, "is_correct": True, "time_spent_seconds": 25},
        {"question_id": 3, "difficulty": 5, "is_correct": False, "time_spent_seconds": 35},
        {"question_id": 4, "difficulty": 6, "is_correct": True, "time_spent_seconds": 30},
        {"question_id": 5, "difficulty": 6, "is_correct": True, "time_spent_seconds": 22},
    ]


class TestDifficultyPredictor:
    """Tests for DifficultyPredictor class."""
    
    def test_predict_returns_result(self, predictor, sample_attempts_data):
        """Test prediction returns valid result."""
        result = predictor.predict(
            session_id=1,
            current_difficulty=6,
            recent_attempts=sample_attempts_data,
            skill_level="Intermediate"
        )
        
        assert isinstance(result, PredictionResult)
        assert 1 <= result.predicted_difficulty <= 10
        assert 0 <= result.confidence <= 1
        assert result.inference_time_ms >= 0
    
    def test_predict_empty_attempts(self, predictor):
        """Test prediction with no attempts."""
        result = predictor.predict(
            session_id=1,
            current_difficulty=5,
            recent_attempts=[],
            skill_level="Beginner"
        )
        
        assert isinstance(result, PredictionResult)
        assert 1 <= result.predicted_difficulty <= 10
    
    def test_predict_high_accuracy_increases_difficulty(self, predictor):
        """Test that high accuracy leads to higher difficulty."""
        # All correct
        attempts = [
            {"question_id": i, "difficulty": 5, "is_correct": True, "time_spent_seconds": 20}
            for i in range(5)
        ]
        
        result = predictor.predict(
            session_id=1,
            current_difficulty=5,
            recent_attempts=attempts,
            skill_level="Intermediate"
        )
        
        # Should suggest higher or equal difficulty
        assert result.predicted_difficulty >= 5
    
    def test_predict_low_accuracy_decreases_difficulty(self, predictor):
        """Test that low accuracy leads to lower difficulty."""
        # All incorrect
        attempts = [
            {"question_id": i, "difficulty": 5, "is_correct": False, "time_spent_seconds": 45}
            for i in range(5)
        ]
        
        result = predictor.predict(
            session_id=1,
            current_difficulty=5,
            recent_attempts=attempts,
            skill_level="Intermediate"
        )
        
        # Should suggest lower or equal difficulty
        assert result.predicted_difficulty <= 5
    
    def test_fallback_prediction(self, predictor):
        """Test fallback prediction when model unavailable."""
        # Force fallback by using invalid model path
        predictor.model_manager = ModelManager("./nonexistent_model.joblib")
        
        result = predictor._fallback_prediction(
            current_difficulty=5,
            attempts=[AttemptRecord(1, 5, True, 20) for _ in range(5)],
            skill_level="Beginner",
            start_time=0
        )
        
        assert isinstance(result, PredictionResult)
        assert result.model_version == "fallback_v1.0"
    
    def test_analyze_student_empty(self, predictor):
        """Test student analysis with no data."""
        analysis = predictor.analyze_student(user_id=1, all_attempts=[])
        
        assert analysis["user_id"] == 1
        assert analysis["overall_metrics"]["avg_accuracy"] == 0.0
        assert analysis["learning_trend"] == "stable"
        assert len(analysis["recommendations"]) > 0
    
    def test_analyze_student_with_data(self, predictor, sample_attempts_data):
        """Test student analysis with attempt data."""
        analysis = predictor.analyze_student(user_id=1, all_attempts=sample_attempts_data)
        
        assert analysis["user_id"] == 1
        assert 0 <= analysis["overall_metrics"]["avg_accuracy"] <= 1
        assert 1 <= analysis["predicted_optimal_difficulty"] <= 10
        assert analysis["learning_trend"] in ["improving", "stable", "declining"]


class TestModelManager:
    """Tests for ModelManager class."""
    
    def test_model_not_loaded_initially(self):
        """Test model is not loaded by default."""
        manager = ModelManager("./nonexistent.joblib")
        assert not manager.is_loaded
    
    def test_load_nonexistent_model(self):
        """Test loading nonexistent model returns False."""
        manager = ModelManager("./nonexistent.joblib")
        result = manager.load_model()
        assert result is False
    
    def test_get_info_not_loaded(self):
        """Test model info when not loaded."""
        manager = ModelManager("./nonexistent.joblib")
        info = manager.get_info()
        
        assert info["loaded"] is False
        assert "path" in info


class TestPredictorSingleton:
    """Tests for predictor singleton pattern."""
    
    def test_get_predictor_returns_same_instance(self):
        """Test singleton returns same instance."""
        predictor1 = get_predictor()
        predictor2 = get_predictor()
        
        assert predictor1 is predictor2


class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""
    
    def test_extreme_difficulty_values(self, predictor):
        """Test with extreme difficulty values."""
        # Minimum difficulty
        result1 = predictor.predict(
            session_id=1,
            current_difficulty=1,
            recent_attempts=[],
            skill_level="Beginner"
        )
        assert result1.predicted_difficulty >= 1
        
        # Maximum difficulty
        result2 = predictor.predict(
            session_id=1,
            current_difficulty=10,
            recent_attempts=[],
            skill_level="Advanced"
        )
        assert result2.predicted_difficulty <= 10
    
    def test_long_attempt_history(self, predictor):
        """Test with long attempt history."""
        attempts = [
            {"question_id": i, "difficulty": 5 + (i % 3), "is_correct": i % 2 == 0, "time_spent_seconds": 20 + i}
            for i in range(50)
        ]
        
        result = predictor.predict(
            session_id=1,
            current_difficulty=6,
            recent_attempts=attempts,
            skill_level="Intermediate"
        )
        
        assert isinstance(result, PredictionResult)
        assert 1 <= result.predicted_difficulty <= 10
    
    def test_all_skill_levels(self, predictor):
        """Test prediction works for all skill levels."""
        for skill_level in ["Beginner", "Intermediate", "Advanced"]:
            result = predictor.predict(
                session_id=1,
                current_difficulty=5,
                recent_attempts=[],
                skill_level=skill_level
            )
            
            assert isinstance(result, PredictionResult)
