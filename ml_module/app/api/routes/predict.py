"""
Prediction API Routes.

Handles difficulty prediction requests.
"""

import json
import logging
from fastapi import APIRouter, HTTPException, status

from app.models.schemas import (
    PredictionRequest,
    PredictionResponse,
    FeatureImportance,
    ReasoningInfo,
    ErrorResponse,
)
from app.services.predictor import get_predictor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post(
    "/difficulty",
    response_model=PredictionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Prediction failed"},
    },
    summary="Predict optimal difficulty",
    description="""
    Predict the optimal next question difficulty based on student performance.
    
    Uses a Random Forest classifier trained on student interaction patterns.
    The model considers recent accuracy, response times, streaks, and learning trends
    to recommend the difficulty level that will maximize learning effectiveness.
    
    Reference: Hassan et al. (2024) - Students' Performance Prediction Using ML
    """
)
async def predict_difficulty(request: PredictionRequest) -> PredictionResponse:
    """
    Predict optimal next question difficulty.
    
    Args:
        request: Prediction request with session info and recent attempts
        
    Returns:
        PredictionResponse with predicted difficulty and confidence
    """
    logger.info(json.dumps({
        "event": "route_predict_request",
        "session_id": request.session_id,
        "current_difficulty": request.current_difficulty,
        "attempt_count": len(request.recent_attempts),
        "skill_level": request.user_context.skill_level.value,
    }))

    try:
        predictor = get_predictor()

        # Convert attempts to dict format
        attempts_data = [
            {
                "question_id": a.question_id,
                "difficulty": a.difficulty,
                "is_correct": a.is_correct,
                "time_spent_seconds": a.time_spent_seconds,
            }
            for a in request.recent_attempts
        ]

        # Make prediction
        result = predictor.predict(
            session_id=request.session_id,
            current_difficulty=request.current_difficulty,
            recent_attempts=attempts_data,
            skill_level=request.user_context.skill_level.value
        )

        if result.source == "rule_based_fallback":
            logger.info(json.dumps({
                "event": "using_fallback",
                "session_id": request.session_id,
                "model_version": result.model_version,
            }))

        response = PredictionResponse(
            predicted_difficulty=result.predicted_difficulty,
            confidence=round(result.confidence, 3),
            source=result.source,
            reasoning=ReasoningInfo(
                top_features=[
                    FeatureImportance(
                        feature=f["feature"],
                        importance=f["importance"]
                    )
                    for f in result.feature_importances[:5]
                ]
            ),
            model_version=result.model_version,
            inference_time_ms=round(result.inference_time_ms, 2)
        )

        logger.info(json.dumps({
            "event": "route_predict_response",
            "session_id": request.session_id,
            "predicted_difficulty": response.predicted_difficulty,
            "confidence": response.confidence,
            "source": response.source,
        }))

        return response
        
    except ValueError as e:
        logger.warning(f"Invalid request: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction service error"
        )


@router.post(
    "/batch",
    response_model=list[PredictionResponse],
    summary="Batch difficulty prediction",
    description="Predict difficulties for multiple sessions (max 10)"
)
async def predict_batch(requests: list[PredictionRequest]) -> list[PredictionResponse]:
    """
    Batch prediction for multiple sessions.
    
    Args:
        requests: List of prediction requests (max 10)
        
    Returns:
        List of predictions in same order
    """
    if len(requests) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 requests per batch"
        )
    
    results = []
    for req in requests:
        try:
            response = await predict_difficulty(req)
            results.append(response)
        except HTTPException as e:
            # Return error response but continue processing
            results.append(PredictionResponse(
                predicted_difficulty=req.current_difficulty,
                confidence=0.0,
                reasoning=ReasoningInfo(top_features=[]),
                model_version="error",
                inference_time_ms=0.0
            ))
    
    return results
