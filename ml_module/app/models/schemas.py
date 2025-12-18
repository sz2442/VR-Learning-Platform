"""
Pydantic models for API request/response validation.
Ensures type safety and automatic documentation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class SkillLevel(str, Enum):
    """Student skill level categories."""
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class AttemptData(BaseModel):
    """Single quiz attempt data."""
    question_id: int = Field(..., ge=1, description="Question ID")
    difficulty: int = Field(..., ge=1, le=10, description="Question difficulty (1-10)")
    is_correct: bool = Field(..., description="Whether answer was correct")
    time_spent_seconds: int = Field(..., ge=0, le=3600, description="Time spent in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "question_id": 45,
                "difficulty": 5,
                "is_correct": True,
                "time_spent_seconds": 25
            }
        }


class UserContext(BaseModel):
    """User context for prediction."""
    skill_level: SkillLevel = Field(default=SkillLevel.BEGINNER, description="Student skill level")
    user_id: Optional[int] = Field(default=None, description="User ID (optional)")


class PredictionRequest(BaseModel):
    """Request body for difficulty prediction."""
    session_id: int = Field(..., ge=1, description="Quiz session ID")
    current_difficulty: int = Field(..., ge=1, le=10, description="Current difficulty level")
    recent_attempts: List[AttemptData] = Field(
        default_factory=list,
        max_length=50,
        description="Recent quiz attempts"
    )
    user_context: UserContext = Field(default_factory=UserContext, description="User context")
    
    @field_validator('recent_attempts')
    @classmethod
    def validate_attempts(cls, v: List[AttemptData]) -> List[AttemptData]:
        """Ensure attempts are provided or handle empty case."""
        return v if v else []
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": 123,
                "current_difficulty": 5,
                "recent_attempts": [
                    {"question_id": 45, "difficulty": 5, "is_correct": True, "time_spent_seconds": 25},
                    {"question_id": 46, "difficulty": 5, "is_correct": True, "time_spent_seconds": 18}
                ],
                "user_context": {"skill_level": "Intermediate"}
            }
        }


class FeatureImportance(BaseModel):
    """Single feature importance."""
    feature: str
    importance: float = Field(..., ge=0, le=1)


class ReasoningInfo(BaseModel):
    """Model reasoning explanation."""
    top_features: List[FeatureImportance] = Field(
        default_factory=list,
        max_length=10
    )


class PredictionResponse(BaseModel):
    """Response for difficulty prediction."""
    predicted_difficulty: int = Field(..., ge=1, le=10, description="Predicted optimal difficulty")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")
    reasoning: ReasoningInfo = Field(default_factory=ReasoningInfo)
    model_version: str = Field(..., description="Model version used")
    inference_time_ms: float = Field(..., ge=0, description="Inference time in milliseconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "predicted_difficulty": 6,
                "confidence": 0.87,
                "reasoning": {
                    "top_features": [
                        {"feature": "recent_accuracy", "importance": 0.32},
                        {"feature": "avg_time", "importance": 0.21}
                    ]
                },
                "model_version": "rf_v1.0",
                "inference_time_ms": 12.5
            }
        }


class OverallMetrics(BaseModel):
    """Student overall metrics."""
    avg_accuracy: float = Field(..., ge=0, le=1)
    current_level: int = Field(..., ge=1, le=10)
    sessions_completed: int = Field(..., ge=0)
    total_questions_answered: int = Field(..., ge=0)
    avg_time_per_question: float = Field(..., ge=0)


class StudentAnalysisResponse(BaseModel):
    """Response for student analysis."""
    user_id: int
    overall_metrics: OverallMetrics
    predicted_optimal_difficulty: int = Field(..., ge=1, le=10)
    learning_trend: str = Field(..., description="improving/stable/declining")
    recommendations: List[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_version: str
    uptime_seconds: float
    memory_usage_mb: Optional[float] = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    status_code: int
