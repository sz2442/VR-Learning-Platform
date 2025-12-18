"""
Student Analysis API Routes.

Provides endpoints for analyzing student performance.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query

from app.models.schemas import (
    StudentAnalysisResponse,
    OverallMetrics,
    ErrorResponse,
)
from app.services.predictor import get_predictor
from app.utils.database import get_db_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.get(
    "/student/{user_id}",
    response_model=StudentAnalysisResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Analysis failed"},
    },
    summary="Analyze student performance",
    description="""
    Get comprehensive analysis of a student's learning performance.
    
    Includes:
    - Overall accuracy and current level
    - Learning trend (improving/stable/declining)
    - Personalized recommendations
    - Predicted optimal starting difficulty
    """
)
async def analyze_student(
    user_id: int,
    include_recommendations: bool = Query(True, description="Include recommendations")
) -> StudentAnalysisResponse:
    """
    Analyze student performance and provide insights.
    
    Args:
        user_id: Student user ID
        include_recommendations: Whether to include recommendations
        
    Returns:
        StudentAnalysisResponse with metrics and recommendations
    """
    logger.info(f"Analyzing student: user_id={user_id}")
    
    try:
        # Get database manager
        db = get_db_manager()
        
        # Fetch user attempts from database
        try:
            attempts = db.get_user_attempts(user_id)
        except Exception as e:
            logger.warning(f"Database unavailable, returning mock analysis: {e}")
            # Return mock data when database is unavailable
            return StudentAnalysisResponse(
                user_id=user_id,
                overall_metrics=OverallMetrics(
                    avg_accuracy=0.0,
                    current_level=5,
                    sessions_completed=0,
                    total_questions_answered=0,
                    avg_time_per_question=0.0
                ),
                predicted_optimal_difficulty=5,
                learning_trend="stable",
                recommendations=["Start your first quiz to begin tracking progress!"]
            )
        
        if not attempts:
            return StudentAnalysisResponse(
                user_id=user_id,
                overall_metrics=OverallMetrics(
                    avg_accuracy=0.0,
                    current_level=5,
                    sessions_completed=0,
                    total_questions_answered=0,
                    avg_time_per_question=0.0
                ),
                predicted_optimal_difficulty=5,
                learning_trend="stable",
                recommendations=["Start your first quiz to begin tracking progress!"]
            )
        
        # Use predictor for analysis
        predictor = get_predictor()
        analysis = predictor.analyze_student(user_id, attempts)
        
        return StudentAnalysisResponse(
            user_id=user_id,
            overall_metrics=OverallMetrics(**analysis["overall_metrics"]),
            predicted_optimal_difficulty=analysis["predicted_optimal_difficulty"],
            learning_trend=analysis["learning_trend"],
            recommendations=analysis["recommendations"] if include_recommendations else []
        )
        
    except Exception as e:
        logger.error(f"Analysis failed for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis service error"
        )


@router.get(
    "/session/{session_id}",
    response_model=dict,
    summary="Analyze quiz session",
    description="Get analysis of a specific quiz session"
)
async def analyze_session(session_id: int) -> dict:
    """
    Analyze a specific quiz session.
    
    Args:
        session_id: Quiz session ID
        
    Returns:
        Session analysis with metrics
    """
    logger.info(f"Analyzing session: session_id={session_id}")
    
    try:
        db = get_db_manager()
        
        try:
            attempts = db.get_session_attempts(session_id)
        except Exception as e:
            logger.warning(f"Database unavailable: {e}")
            return {
                "session_id": session_id,
                "total_questions": 0,
                "correct_answers": 0,
                "accuracy": 0.0,
                "avg_time": 0.0,
                "difficulty_range": {"min": 0, "max": 0},
                "status": "no_data"
            }
        
        if not attempts:
            return {
                "session_id": session_id,
                "total_questions": 0,
                "correct_answers": 0,
                "accuracy": 0.0,
                "avg_time": 0.0,
                "difficulty_range": {"min": 0, "max": 0},
                "status": "empty"
            }
        
        total = len(attempts)
        correct = sum(1 for a in attempts if a["is_correct"])
        accuracy = correct / total if total > 0 else 0
        avg_time = sum(a["time_spent_seconds"] for a in attempts) / total
        
        difficulties = [a["difficulty"] for a in attempts]
        
        return {
            "session_id": session_id,
            "total_questions": total,
            "correct_answers": correct,
            "accuracy": round(accuracy, 3),
            "avg_time": round(avg_time, 1),
            "difficulty_range": {
                "min": min(difficulties),
                "max": max(difficulties)
            },
            "difficulty_progression": difficulties,
            "status": "completed" if total >= 10 else "in_progress"
        }
        
    except Exception as e:
        logger.error(f"Session analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis service error"
        )


@router.get(
    "/leaderboard",
    response_model=list,
    summary="Get student leaderboard",
    description="Get top performing students"
)
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=100, description="Number of students")
) -> list:
    """
    Get student leaderboard (mock implementation).
    
    In production, this would query aggregated student data.
    """
    # Mock leaderboard for demo
    return [
        {
            "rank": i + 1,
            "user_id": 100 + i,
            "username": f"student_{i+1}",
            "avg_difficulty": 10 - i * 0.5,
            "total_questions": 100 - i * 5,
            "accuracy": 0.95 - i * 0.03
        }
        for i in range(min(limit, 10))
    ]
