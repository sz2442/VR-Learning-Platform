"""
Tests for feature engineering module.
"""

import pytest
import numpy as np

from app.services.feature_engineering import (
    FeatureEngineer,
    AttemptRecord,
    FeatureVector,
    create_attempt_records,
)


@pytest.fixture
def feature_engineer():
    """Create feature engineer instance."""
    return FeatureEngineer()


@pytest.fixture
def sample_attempts():
    """Create sample attempt records."""
    return [
        AttemptRecord(question_id=1, difficulty=5, is_correct=True, time_spent_seconds=20),
        AttemptRecord(question_id=2, difficulty=5, is_correct=True, time_spent_seconds=25),
        AttemptRecord(question_id=3, difficulty=5, is_correct=False, time_spent_seconds=35),
        AttemptRecord(question_id=4, difficulty=6, is_correct=True, time_spent_seconds=30),
        AttemptRecord(question_id=5, difficulty=6, is_correct=True, time_spent_seconds=22),
    ]


class TestFeatureEngineer:
    """Tests for FeatureEngineer class."""
    
    def test_feature_count(self, feature_engineer):
        """Test correct number of features."""
        assert feature_engineer.n_features == 17
        assert len(feature_engineer.FEATURE_NAMES) == 17
    
    def test_extract_features_empty_attempts(self, feature_engineer):
        """Test feature extraction with no attempts (cold start)."""
        result = feature_engineer.extract_features(
            current_difficulty=5,
            recent_attempts=[],
            skill_level="Beginner"
        )
        
        assert isinstance(result, FeatureVector)
        assert result.features.shape[0] == 17
        assert not np.any(np.isnan(result.features))
        
        # Check cold start defaults
        assert result.features[0] == 5.0  # current_difficulty
        assert result.features[4] == 0.5  # recent_accuracy (neutral)
    
    def test_extract_features_with_attempts(self, feature_engineer, sample_attempts):
        """Test feature extraction with sample attempts."""
        result = feature_engineer.extract_features(
            current_difficulty=6,
            recent_attempts=sample_attempts,
            skill_level="Intermediate"
        )
        
        assert isinstance(result, FeatureVector)
        assert result.features.shape[0] == 17
        
        # Verify specific features
        features_dict = result.to_dict()
        
        assert features_dict["current_difficulty"] == 6.0
        assert features_dict["is_correct"] == 1.0  # last attempt was correct
        assert features_dict["time_spent_seconds"] == 22.0  # last attempt time
        assert features_dict["attempt_number"] == 5.0
        
        # Recent accuracy: 4/5 = 0.8
        assert features_dict["recent_accuracy"] == pytest.approx(0.8, abs=0.01)
    
    def test_accuracy_calculation(self, feature_engineer):
        """Test accuracy calculation."""
        attempts = [
            AttemptRecord(1, 5, True, 20),
            AttemptRecord(2, 5, True, 20),
            AttemptRecord(3, 5, False, 20),
            AttemptRecord(4, 5, True, 20),
        ]
        
        accuracy = feature_engineer._calculate_accuracy(attempts)
        assert accuracy == pytest.approx(0.75, abs=0.01)
    
    def test_streaks(self, feature_engineer):
        """Test streak calculation."""
        # Correct streak
        attempts1 = [
            AttemptRecord(1, 5, False, 20),
            AttemptRecord(2, 5, True, 20),
            AttemptRecord(3, 5, True, 20),
            AttemptRecord(4, 5, True, 20),
        ]
        correct, incorrect = feature_engineer._calculate_streaks(attempts1)
        assert correct == 3
        assert incorrect == 0
        
        # Incorrect streak
        attempts2 = [
            AttemptRecord(1, 5, True, 20),
            AttemptRecord(2, 5, False, 20),
            AttemptRecord(3, 5, False, 20),
        ]
        correct, incorrect = feature_engineer._calculate_streaks(attempts2)
        assert correct == 0
        assert incorrect == 2
    
    def test_speed_categories(self, feature_engineer):
        """Test speed category encoding."""
        fast = feature_engineer._get_speed_category(15)
        assert fast == (1.0, 0.0, 0.0)
        
        medium = feature_engineer._get_speed_category(30)
        assert medium == (0.0, 1.0, 0.0)
        
        slow = feature_engineer._get_speed_category(50)
        assert slow == (0.0, 0.0, 1.0)
    
    def test_skill_level_encoding(self, feature_engineer):
        """Test skill level one-hot encoding."""
        beginner = feature_engineer._encode_skill_level("Beginner")
        assert beginner == (1.0, 0.0, 0.0)
        
        intermediate = feature_engineer._encode_skill_level("Intermediate")
        assert intermediate == (0.0, 1.0, 0.0)
        
        advanced = feature_engineer._encode_skill_level("Advanced")
        assert advanced == (0.0, 0.0, 1.0)
        
        # Default to beginner for unknown
        unknown = feature_engineer._encode_skill_level("Unknown")
        assert unknown == (1.0, 0.0, 0.0)
    
    def test_feature_validation(self, feature_engineer, sample_attempts):
        """Test feature vector validation."""
        result = feature_engineer.extract_features(
            current_difficulty=5,
            recent_attempts=sample_attempts,
            skill_level="Beginner"
        )
        
        assert feature_engineer.validate_features(result.features)
        
        # Invalid features should fail
        invalid = np.array([1.0, 2.0])  # Wrong size
        assert not feature_engineer.validate_features(invalid)
        
        # NaN should fail
        with_nan = np.zeros(17)
        with_nan[0] = np.nan
        assert not feature_engineer.validate_features(with_nan)
    
    def test_time_capping(self, feature_engineer):
        """Test that extreme times are capped."""
        attempts = [
            AttemptRecord(1, 5, True, 1000),  # Very long time
        ]
        
        result = feature_engineer.extract_features(
            current_difficulty=5,
            recent_attempts=attempts,
            skill_level="Beginner"
        )
        
        features_dict = result.to_dict()
        # Should be capped at 300 seconds
        assert features_dict["time_spent_seconds"] <= 300


class TestCreateAttemptRecords:
    """Tests for attempt record creation helper."""
    
    def test_create_from_dicts(self):
        """Test creating records from dictionaries."""
        data = [
            {"question_id": 1, "difficulty": 5, "is_correct": True, "time_spent_seconds": 20},
            {"question_id": 2, "difficulty": 6, "is_correct": False, "time_spent_seconds": 30},
        ]
        
        records = create_attempt_records(data)
        
        assert len(records) == 2
        assert records[0].question_id == 1
        assert records[0].is_correct is True
        assert records[1].difficulty == 6
        assert records[1].time_spent_seconds == 30
    
    def test_create_empty_list(self):
        """Test creating from empty list."""
        records = create_attempt_records([])
        assert records == []
    
    def test_missing_fields_use_defaults(self):
        """Test that missing fields use defaults."""
        data = [
            {"is_correct": True}  # Missing other fields
        ]
        
        records = create_attempt_records(data)
        
        assert records[0].question_id == 0
        assert records[0].difficulty == 5
        assert records[0].time_spent_seconds == 30
