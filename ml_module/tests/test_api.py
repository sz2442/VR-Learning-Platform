"""
API endpoint tests.

Tests the FastAPI endpoints for the ML service.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    def test_health_check(self, client):
        """Test /health endpoint returns valid response."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data
        assert "uptime_seconds" in data
        assert data["status"] == "healthy"
    
    def test_liveness_check(self, client):
        """Test /live endpoint."""
        response = client.get("/live")
        assert response.status_code == 200
        
        data = response.json()
        assert data["alive"] is True
    
    def test_readiness_check(self, client):
        """Test /ready endpoint."""
        response = client.get("/ready")
        assert response.status_code == 200
        
        data = response.json()
        assert "ready" in data
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns service info."""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["service"] == "VR Meta University ML Service"
        assert "version" in data


class TestPredictionEndpoints:
    """Tests for prediction endpoints."""
    
    def test_predict_difficulty_basic(self, client):
        """Test basic prediction request."""
        request_data = {
            "session_id": 1,
            "current_difficulty": 5,
            "recent_attempts": [
                {
                    "question_id": 1,
                    "difficulty": 5,
                    "is_correct": True,
                    "time_spent_seconds": 25
                }
            ],
            "user_context": {
                "skill_level": "Beginner"
            }
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "predicted_difficulty" in data
        assert "confidence" in data
        assert "model_version" in data
        assert "inference_time_ms" in data
        
        # Check valid difficulty range
        assert 1 <= data["predicted_difficulty"] <= 10
        assert 0 <= data["confidence"] <= 1
    
    def test_predict_difficulty_empty_attempts(self, client):
        """Test prediction with no prior attempts (cold start)."""
        request_data = {
            "session_id": 1,
            "current_difficulty": 5,
            "recent_attempts": [],
            "user_context": {
                "skill_level": "Beginner"
            }
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "predicted_difficulty" in data
    
    def test_predict_difficulty_multiple_attempts(self, client):
        """Test prediction with multiple attempts."""
        attempts = [
            {"question_id": i + 1, "difficulty": 5, "is_correct": i % 2 == 0, "time_spent_seconds": 20 + i*5}
            for i in range(10)
        ]
        
        request_data = {
            "session_id": 1,
            "current_difficulty": 5,
            "recent_attempts": attempts,
            "user_context": {"skill_level": "Intermediate"}
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        assert response.status_code == 200
    
    def test_predict_difficulty_high_accuracy(self, client):
        """Test that high accuracy leads to difficulty increase."""
        # All correct answers
        attempts = [
            {"question_id": i + 1, "difficulty": 5, "is_correct": True, "time_spent_seconds": 20}
            for i in range(5)
        ]
        
        request_data = {
            "session_id": 1,
            "current_difficulty": 5,
            "recent_attempts": attempts,
            "user_context": {"skill_level": "Intermediate"}
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        data = response.json()
        
        # Should suggest higher difficulty
        assert data["predicted_difficulty"] >= 5
    
    def test_predict_difficulty_low_accuracy(self, client):
        """Test that low accuracy leads to difficulty decrease."""
        # All wrong answers
        attempts = [
            {"question_id": i + 1, "difficulty": 5, "is_correct": False, "time_spent_seconds": 45}
            for i in range(5)
        ]
        
        request_data = {
            "session_id": 1,
            "current_difficulty": 5,
            "recent_attempts": attempts,
            "user_context": {"skill_level": "Intermediate"}
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        data = response.json()
        
        # Should suggest lower difficulty
        assert data["predicted_difficulty"] <= 5
    
    def test_predict_invalid_difficulty(self, client):
        """Test validation for invalid difficulty values."""
        request_data = {
            "session_id": 1,
            "current_difficulty": 15,  # Invalid: > 10
            "recent_attempts": [],
            "user_context": {"skill_level": "Beginner"}
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        assert response.status_code == 422  # Validation error


class TestAnalyzeEndpoints:
    """Tests for analysis endpoints."""
    
    def test_analyze_student_not_found(self, client):
        """Test student analysis when no data exists."""
        response = client.get("/api/v1/analyze/student/999")
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == 999
        assert "overall_metrics" in data
        assert "recommendations" in data
    
    def test_analyze_session(self, client):
        """Test session analysis endpoint."""
        response = client.get("/api/v1/analyze/session/1")
        assert response.status_code == 200
        
        data = response.json()
        assert "session_id" in data
        assert "total_questions" in data
    
    def test_leaderboard(self, client):
        """Test leaderboard endpoint."""
        response = client.get("/api/v1/analyze/leaderboard?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 5
        if data:
            assert "rank" in data[0]
            assert "user_id" in data[0]


class TestInputValidation:
    """Tests for input validation."""
    
    def test_missing_session_id(self, client):
        """Test validation for missing session_id."""
        request_data = {
            "current_difficulty": 5,
            "recent_attempts": []
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        assert response.status_code == 422
    
    def test_invalid_time_spent(self, client):
        """Test validation for invalid time_spent."""
        request_data = {
            "session_id": 1,
            "current_difficulty": 5,
            "recent_attempts": [
                {
                    "question_id": 1,
                    "difficulty": 5,
                    "is_correct": True,
                    "time_spent_seconds": -10  # Invalid: negative
                }
            ]
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        assert response.status_code == 422
    
    def test_invalid_skill_level(self, client):
        """Test validation for invalid skill level."""
        request_data = {
            "session_id": 1,
            "current_difficulty": 5,
            "recent_attempts": [],
            "user_context": {
                "skill_level": "Expert"  # Invalid: not in enum
            }
        }
        
        response = client.post("/api/v1/predict/difficulty", json=request_data)
        assert response.status_code == 422
