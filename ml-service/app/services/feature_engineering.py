"""
Feature Engineering Module for Adaptive Learning ML Service.

Extracts 15 features from student quiz attempts for difficulty prediction.
Based on Hassan et al. (2024) feature engineering approach.
"""

from typing import List, Dict, Tuple, Optional
import numpy as np
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class AttemptRecord:
    """Single attempt record for feature extraction."""
    question_id: int
    difficulty: int
    is_correct: bool
    time_spent_seconds: int


@dataclass
class FeatureVector:
    """Extracted features for ML model."""
    features: np.ndarray
    feature_names: List[str]
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary."""
        return dict(zip(self.feature_names, self.features.tolist()))


class FeatureEngineer:
    """
    Feature extraction from quiz attempt data.
    
    Generates 15 features:
    1. current_difficulty - Current question difficulty level
    2. is_correct - Latest answer correctness (1/0)
    3. time_spent_seconds - Time on current question
    4. attempt_number - Question number in session
    5. recent_accuracy - Accuracy over last 5 questions
    6. recent_avg_time - Average time over last 5 questions
    7. accuracy_trend - Slope of recent accuracy
    8. time_trend - Slope of recent times
    9. streak_correct - Consecutive correct answers
    10. streak_incorrect - Consecutive wrong answers
    11. difficulty_variance - Std dev of recent difficulties
    12. speed_category_fast - Time < 20 sec (binary)
    13. speed_category_medium - 20 <= time < 40 (binary)
    14. speed_category_slow - Time >= 40 (binary)
    15-17. skill_level_* - One-hot encoded skill level
    """
    
    FEATURE_NAMES = [
        "current_difficulty",
        "is_correct",
        "time_spent_seconds",
        "attempt_number",
        "recent_accuracy",
        "recent_avg_time",
        "accuracy_trend",
        "time_trend",
        "streak_correct",
        "streak_incorrect",
        "difficulty_variance",
        "speed_category_fast",
        "speed_category_medium",
        "speed_category_slow",
        "skill_level_beginner",
        "skill_level_intermediate",
        "skill_level_advanced",
    ]
    
    # Time thresholds for speed categories (in seconds)
    FAST_THRESHOLD = 20
    SLOW_THRESHOLD = 40
    
    # Window size for recent calculations
    RECENT_WINDOW = 5
    
    def __init__(self):
        """Initialize feature engineer."""
        self.n_features = len(self.FEATURE_NAMES)
    
    def extract_features(
        self,
        current_difficulty: int,
        recent_attempts: List[AttemptRecord],
        skill_level: str = "Beginner"
    ) -> FeatureVector:
        """
        Extract feature vector from attempt data.
        
        Args:
            current_difficulty: Current question difficulty (1-10)
            recent_attempts: List of recent attempt records
            skill_level: Student skill level (Beginner/Intermediate/Advanced)
        
        Returns:
            FeatureVector with extracted features
        """
        features = np.zeros(self.n_features, dtype=np.float32)
        
        # Feature 1: Current difficulty
        features[0] = float(current_difficulty)
        
        # Handle empty attempts case (first question scenario)
        if not recent_attempts:
            features = self._handle_cold_start(features, current_difficulty, skill_level)
            return FeatureVector(features=features, feature_names=self.FEATURE_NAMES)
        
        # Latest attempt
        latest = recent_attempts[-1]
        
        # Feature 2: Is correct (latest)
        features[1] = 1.0 if latest.is_correct else 0.0
        
        # Feature 3: Time spent (latest)
        features[2] = float(min(latest.time_spent_seconds, 300))  # Cap at 5 min
        
        # Feature 4: Attempt number
        features[3] = float(len(recent_attempts))
        
        # Get recent window for calculations
        recent = recent_attempts[-self.RECENT_WINDOW:] if len(recent_attempts) >= self.RECENT_WINDOW else recent_attempts
        
        # Feature 5: Recent accuracy
        features[4] = self._calculate_accuracy(recent)
        
        # Feature 6: Recent average time
        features[5] = self._calculate_avg_time(recent)
        
        # Feature 7: Accuracy trend
        features[6] = self._calculate_accuracy_trend(recent_attempts)
        
        # Feature 8: Time trend
        features[7] = self._calculate_time_trend(recent_attempts)
        
        # Feature 9-10: Streaks
        correct_streak, incorrect_streak = self._calculate_streaks(recent_attempts)
        features[8] = float(correct_streak)
        features[9] = float(incorrect_streak)
        
        # Feature 11: Difficulty variance
        features[10] = self._calculate_difficulty_variance(recent)
        
        # Feature 12-14: Speed categories (based on latest)
        speed_cats = self._get_speed_category(latest.time_spent_seconds)
        features[11] = speed_cats[0]  # fast
        features[12] = speed_cats[1]  # medium
        features[13] = speed_cats[2]  # slow
        
        # Feature 15-17: Skill level one-hot
        skill_encoded = self._encode_skill_level(skill_level)
        features[14] = skill_encoded[0]  # beginner
        features[15] = skill_encoded[1]  # intermediate
        features[16] = skill_encoded[2]  # advanced
        
        logger.debug(f"Extracted features: {dict(zip(self.FEATURE_NAMES, features))}")
        
        return FeatureVector(features=features, feature_names=self.FEATURE_NAMES)
    
    def _handle_cold_start(
        self,
        features: np.ndarray,
        current_difficulty: int,
        skill_level: str
    ) -> np.ndarray:
        """
        Handle cold start scenario (no previous attempts).
        Uses default values based on skill level.
        """
        # Set reasonable defaults
        features[0] = float(current_difficulty)  # current_difficulty
        features[1] = 0.5  # is_correct (neutral)
        features[2] = 30.0  # time_spent (average)
        features[3] = 1.0  # attempt_number (first)
        features[4] = 0.5  # recent_accuracy (neutral)
        features[5] = 30.0  # recent_avg_time
        features[6] = 0.0  # accuracy_trend (flat)
        features[7] = 0.0  # time_trend (flat)
        features[8] = 0.0  # streak_correct
        features[9] = 0.0  # streak_incorrect
        features[10] = 0.0  # difficulty_variance
        features[11] = 0.0  # speed_fast
        features[12] = 1.0  # speed_medium (default)
        features[13] = 0.0  # speed_slow
        
        # Skill level one-hot
        skill_encoded = self._encode_skill_level(skill_level)
        features[14] = skill_encoded[0]
        features[15] = skill_encoded[1]
        features[16] = skill_encoded[2]
        
        return features
    
    def _calculate_accuracy(self, attempts: List[AttemptRecord]) -> float:
        """Calculate accuracy from attempts."""
        if not attempts:
            return 0.5
        correct = sum(1 for a in attempts if a.is_correct)
        return correct / len(attempts)
    
    def _calculate_avg_time(self, attempts: List[AttemptRecord]) -> float:
        """Calculate average time from attempts."""
        if not attempts:
            return 30.0
        times = [min(a.time_spent_seconds, 300) for a in attempts]
        return np.mean(times)
    
    def _calculate_accuracy_trend(self, attempts: List[AttemptRecord]) -> float:
        """
        Calculate accuracy trend using linear regression slope.
        Positive = improving, Negative = declining.
        """
        if len(attempts) < 3:
            return 0.0
        
        # Calculate rolling accuracy
        window = min(self.RECENT_WINDOW, len(attempts))
        accuracies = []
        
        for i in range(len(attempts) - window + 1, len(attempts) + 1):
            recent = attempts[max(0, i-window):i]
            acc = sum(1 for a in recent if a.is_correct) / len(recent) if recent else 0
            accuracies.append(acc)
        
        if len(accuracies) < 2:
            return 0.0
        
        # Simple slope calculation
        x = np.arange(len(accuracies))
        slope = np.polyfit(x, accuracies, 1)[0] if len(accuracies) > 1 else 0.0
        
        return float(np.clip(slope, -1.0, 1.0))
    
    def _calculate_time_trend(self, attempts: List[AttemptRecord]) -> float:
        """
        Calculate time trend using linear regression slope.
        Negative = getting faster, Positive = getting slower.
        """
        if len(attempts) < 3:
            return 0.0
        
        recent = attempts[-self.RECENT_WINDOW:] if len(attempts) >= self.RECENT_WINDOW else attempts
        times = [min(a.time_spent_seconds, 300) for a in recent]
        
        if len(times) < 2:
            return 0.0
        
        x = np.arange(len(times))
        slope = np.polyfit(x, times, 1)[0] if len(times) > 1 else 0.0
        
        # Normalize slope to [-1, 1] range (assuming max change of 30 sec per question)
        normalized = slope / 30.0
        return float(np.clip(normalized, -1.0, 1.0))
    
    def _calculate_streaks(self, attempts: List[AttemptRecord]) -> Tuple[int, int]:
        """Calculate current correct and incorrect streaks."""
        if not attempts:
            return 0, 0
        
        correct_streak = 0
        incorrect_streak = 0
        
        # Count from end backwards
        for attempt in reversed(attempts):
            if attempt.is_correct:
                if incorrect_streak == 0:
                    correct_streak += 1
                else:
                    break
            else:
                if correct_streak == 0:
                    incorrect_streak += 1
                else:
                    break
        
        return correct_streak, incorrect_streak
    
    def _calculate_difficulty_variance(self, attempts: List[AttemptRecord]) -> float:
        """Calculate standard deviation of recent difficulties."""
        if len(attempts) < 2:
            return 0.0
        
        difficulties = [a.difficulty for a in attempts]
        return float(np.std(difficulties))
    
    def _get_speed_category(self, time_seconds: int) -> Tuple[float, float, float]:
        """
        Get speed category one-hot encoding.
        Returns: (fast, medium, slow)
        """
        if time_seconds < self.FAST_THRESHOLD:
            return (1.0, 0.0, 0.0)
        elif time_seconds < self.SLOW_THRESHOLD:
            return (0.0, 1.0, 0.0)
        else:
            return (0.0, 0.0, 1.0)
    
    def _encode_skill_level(self, skill_level: str) -> Tuple[float, float, float]:
        """
        One-hot encode skill level.
        Returns: (beginner, intermediate, advanced)
        """
        skill_lower = skill_level.lower()
        if "advanced" in skill_lower:
            return (0.0, 0.0, 1.0)
        elif "intermediate" in skill_lower:
            return (0.0, 1.0, 0.0)
        else:  # Default to beginner
            return (1.0, 0.0, 0.0)
    
    def get_feature_names(self) -> List[str]:
        """Return list of feature names."""
        return self.FEATURE_NAMES.copy()
    
    def validate_features(self, features: np.ndarray) -> bool:
        """Validate feature vector."""
        if features.shape[0] != self.n_features:
            logger.error(f"Feature count mismatch: {features.shape[0]} vs {self.n_features}")
            return False
        
        if np.any(np.isnan(features)):
            logger.error("NaN values in features")
            return False
        
        if np.any(np.isinf(features)):
            logger.error("Infinite values in features")
            return False
        
        return True


# Convenience function
def create_attempt_records(attempts_data: List[dict]) -> List[AttemptRecord]:
    """Convert API attempt data to AttemptRecord objects."""
    return [
        AttemptRecord(
            question_id=a.get("question_id", 0),
            difficulty=a.get("difficulty", 5),
            is_correct=a.get("is_correct", False),
            time_spent_seconds=a.get("time_spent_seconds", 30)
        )
        for a in attempts_data
    ]
