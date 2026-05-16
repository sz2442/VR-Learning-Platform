"""
Prediction Service Module.

Orchestrates feature engineering and model inference for difficulty prediction.
"""

import time
import json
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from app.services.feature_engineering import (
    FeatureEngineer,
    AttemptRecord,
    create_attempt_records,
)
from app.services.model_loader import ModelManager, get_model_manager

logger = logging.getLogger(__name__)


@dataclass
class PredictionResult:
    """Result of difficulty prediction."""
    predicted_difficulty: int
    confidence: float
    source: str
    feature_importances: List[Dict[str, Any]]
    model_version: str
    inference_time_ms: float
    features_used: Dict[str, float]


class DifficultyPredictor:
    """
    Main prediction service for adaptive learning.
    
    Combines feature engineering and model inference to predict
    optimal next question difficulty.
    """
    
    # Fallback rules when model is unavailable
    FALLBACK_THRESHOLD_HIGH = 0.8
    FALLBACK_THRESHOLD_LOW = 0.4
    
    def __init__(self, model_manager: Optional[ModelManager] = None):
        """
        Initialize predictor.
        
        Args:
            model_manager: Optional custom model manager
        """
        self.feature_engineer = FeatureEngineer()
        self.model_manager = model_manager or get_model_manager()
    
    def predict(
        self,
        session_id: int,
        current_difficulty: int,
        recent_attempts: List[Dict[str, Any]],
        skill_level: str = "Beginner"
    ) -> PredictionResult:
        """
        Predict optimal next difficulty.
        
        Args:
            session_id: Quiz session ID
            current_difficulty: Current difficulty level (1-10)
            recent_attempts: List of recent attempt dictionaries
            skill_level: Student skill level
            
        Returns:
            PredictionResult with prediction and metadata
        """
        start_time = time.time()

        logger.info(json.dumps({
            "event": "prediction_request",
            "session_id": session_id,
            "current_difficulty": current_difficulty,
            "attempt_count": len(recent_attempts),
            "skill_level": skill_level,
        }))

        attempt_records = create_attempt_records(recent_attempts)
        feature_vector = self.feature_engineer.extract_features(
            current_difficulty=current_difficulty,
            recent_attempts=attempt_records,
            skill_level=skill_level
        )
        
        # Validate features
        if not self.feature_engineer.validate_features(feature_vector.features):
            logger.warning("Feature validation failed, using fallback")
            return self._fallback_prediction(
                current_difficulty, attempt_records, skill_level, start_time
            )
        
        # Check if model is available
        if not self.model_manager.is_loaded:
            try:
                self.model_manager.load_model()
            except Exception as e:
                logger.warning(f"Model not available: {e}, using fallback")
                return self._fallback_prediction(
                    current_difficulty, attempt_records, skill_level, start_time
                )
        
        try:
            predicted_diff, confidence = self.model_manager.predict(feature_vector.features)
            importances = self.model_manager.get_feature_importance(top_n=5)
            inference_time = (time.time() - start_time) * 1000
            
            logger.info(json.dumps({
                "event": "prediction_result",
                "session_id": session_id,
                "predicted_difficulty": predicted_diff,
                "confidence": round(confidence, 3),
                "source": "ml_model",
                "inference_time_ms": round(inference_time, 1),
            }))

            return PredictionResult(
                predicted_difficulty=predicted_diff,
                confidence=confidence,
                source="ml_model",
                feature_importances=importances,
                model_version=self.model_manager.model_version,
                inference_time_ms=inference_time,
                features_used=feature_vector.to_dict()
            )

        except Exception as e:
            logger.error(f"Model prediction failed: {e}")
            return self._fallback_prediction(
                current_difficulty, attempt_records, skill_level, start_time
            )

    def _fallback_prediction(
        self,
        current_difficulty: int,
        attempts: List[AttemptRecord],
        skill_level: str,
        start_time: float
    ) -> PredictionResult:
        """
        Rule-based fallback when ML model is unavailable.

        Uses simple heuristics based on recent accuracy.
        """
        if not attempts:
            predicted_diff = current_difficulty
            confidence = 0.5
        else:
            recent = attempts[-5:]
            accuracy = sum(1 for a in recent if a.is_correct) / len(recent)

            # Apply rules
            if accuracy >= self.FALLBACK_THRESHOLD_HIGH:
                predicted_diff = min(current_difficulty + 1, 10)
                confidence = 0.7
            elif accuracy < self.FALLBACK_THRESHOLD_LOW:
                predicted_diff = max(current_difficulty - 1, 1)
                confidence = 0.7
            else:
                predicted_diff = current_difficulty
                confidence = 0.6

        inference_time = (time.time() - start_time) * 1000

        logger.info(json.dumps({
            "event": "prediction_result",
            "source": "rule_based_fallback",
            "predicted_difficulty": predicted_diff,
            "confidence": confidence,
            "inference_time_ms": round(inference_time, 1),
        }))

        return PredictionResult(
            predicted_difficulty=predicted_diff,
            confidence=confidence,
            source="rule_based_fallback",
            feature_importances=[
                {"feature": "recent_accuracy", "importance": 1.0}
            ],
            model_version="fallback_v1.0",
            inference_time_ms=inference_time,
            features_used={}
        )

    def analyze_student(
        self,
        user_id: int,
        all_attempts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze student performance across all attempts.

        Args:
            user_id: Student user ID
            all_attempts: List of all student attempts

        Returns:
            Analysis dictionary with metrics and recommendations
        """
        if not all_attempts:
            return {
                "user_id": user_id,
                "overall_metrics": {
                    "avg_accuracy": 0.0,
                    "current_level": 5,
                    "sessions_completed": 0,
                    "total_questions_answered": 0,
                    "avg_time_per_question": 0.0
                },
                "predicted_optimal_difficulty": 5,
                "learning_trend": "stable",
                "recommendations": ["Start your first quiz session!"]
            }

        attempt_records = create_attempt_records(all_attempts)

        # Calculate metrics
        total_correct = sum(1 for a in attempt_records if a.is_correct)
        total_count = len(attempt_records)
        avg_accuracy = total_correct / total_count if total_count > 0 else 0

        avg_time = sum(a.time_spent_seconds for a in attempt_records) / total_count

        # Get latest difficulty
        current_level = attempt_records[-1].difficulty if attempt_records else 5

        # Determine learning trend
        if len(attempt_records) >= 10:
            first_half = attempt_records[:len(attempt_records)//2]
            second_half = attempt_records[len(attempt_records)//2:]

            first_acc = sum(1 for a in first_half if a.is_correct) / len(first_half)
            second_acc = sum(1 for a in second_half if a.is_correct) / len(second_half)

            if second_acc > first_acc + 0.1:
                trend = "improving"
            elif second_acc < first_acc - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"

        # Generate recommendations
        recommendations = self._generate_recommendations(
            avg_accuracy, avg_time, trend, current_level
        )

        # Predict optimal difficulty
        optimal_diff = self._calculate_optimal_difficulty(
            avg_accuracy, current_level, trend
        )

        return {
            "user_id": user_id,
            "overall_metrics": {
                "avg_accuracy": round(avg_accuracy, 3),
                "current_level": current_level,
                "sessions_completed": 1,  # Would need session tracking
                "total_questions_answered": total_count,
                "avg_time_per_question": round(avg_time, 1)
            },
            "predicted_optimal_difficulty": optimal_diff,
            "learning_trend": trend,
            "recommendations": recommendations
        }

    def _generate_recommendations(
        self,
        accuracy: float,
        avg_time: float,
        trend: str,
        current_level: int
    ) -> List[str]:
        """Generate personalized recommendations."""
        recommendations = []

        if accuracy < 0.5:
            recommendations.append(
                "Consider reviewing foundational concepts before advancing."
            )
        elif accuracy > 0.85:
            recommendations.append(
                "Great job! You're ready for more challenging questions."
            )

        if avg_time > 60:
            recommendations.append(
                "Try to improve speed without sacrificing accuracy."
            )
        elif avg_time < 15:
            recommendations.append(
                "Take your time to ensure accuracy on difficult questions."
            )

        if trend == "declining":
            recommendations.append(
                "Your performance has decreased recently. Consider taking a break or reviewing material."
            )
        elif trend == "improving":
            recommendations.append(
                "You're making excellent progress! Keep up the good work."
            )

        if current_level >= 8:
            recommendations.append(
                "You're performing at an advanced level. Challenge yourself with expert-level content."
            )

        if not recommendations:
            recommendations.append(
                "Continue practicing to maintain and improve your skills."
            )

        return recommendations

    def _calculate_optimal_difficulty(
        self,
        accuracy: float,
        current_level: int,
        trend: str
    ) -> int:
        """Calculate optimal starting difficulty for next session."""
        optimal = current_level

        if accuracy >= 0.8:
            optimal = min(current_level + 1, 10)
        elif accuracy < 0.5:
            optimal = max(current_level - 1, 1)

        # Adjust for trend
        if trend == "improving":
            optimal = min(optimal + 1, 10)
        elif trend == "declining":
            optimal = max(optimal - 1, 1)

        return optimal


# Singleton instance
_predictor: Optional[DifficultyPredictor] = None


def get_predictor() -> DifficultyPredictor:
    """Get or create singleton predictor instance."""
    global _predictor
    if _predictor is None:
        _predictor = DifficultyPredictor()
    return _predictor
