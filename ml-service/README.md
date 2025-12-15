# VR Meta University - ML Service

Machine Learning microservice for adaptive difficulty prediction in the VR Meta University platform.

## 🎯 Overview

This service provides real-time difficulty prediction for quiz questions based on student performance patterns. It uses a Random Forest classifier trained on student interaction data to determine the optimal difficulty level for each student.

**Key Features:**
- Real-time difficulty prediction (<500ms latency)
- 15-feature engineering pipeline
- RESTful API with FastAPI
- PostgreSQL integration
- Docker support

**Academic Reference:**
- Hassan et al. (2024): "Students' Performance Prediction Using Machine Learning Based on GAN" - 99.8% accuracy with Random Forest

## 📋 Requirements

- Python 3.11+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Local Development

```bash
# 1. Clone and navigate to the project
cd ml-service

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Train the model
python -m training.train --samples 5000 --output ./models/random_forest_v1.joblib

# 6. Run the service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 7. Access the API documentation
# Open http://localhost:8000/docs
```

### Option 2: Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t vr-courses-ml .
docker run -p 8000:8000 vr-courses-ml
```

## 📊 API Endpoints

### Health Check
```bash
GET /health
```

### Predict Difficulty
```bash
POST /api/v1/predict/difficulty
Content-Type: application/json

{
  "session_id": 123,
  "current_difficulty": 5,
  "recent_attempts": [
    {
      "question_id": 45,
      "difficulty": 5,
      "is_correct": true,
      "time_spent_seconds": 25
    }
  ],
  "user_context": {
    "skill_level": "Intermediate"
  }
}
```

**Response:**
```json
{
  "predicted_difficulty": 6,
  "confidence": 0.87,
  "reasoning": {
    "top_features": [
      {"feature": "recent_accuracy", "importance": 0.32},
      {"feature": "avg_time", "importance": 0.21}
    ]
  },
  "model_version": "rf_v1.0",
  "inference_time_ms": 12
}
```

### Analyze Student
```bash
GET /api/v1/analyze/student/{user_id}
```

### Session Analysis
```bash
GET /api/v1/analyze/session/{session_id}
```

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_api.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

## 🛠️ Training

### Generate Synthetic Data & Train
```bash
# Train with default settings (5000 samples)
python -m training.train

# Custom training
python -m training.train --samples 10000 --output ./models/custom_model.joblib
```

### Evaluate Model
```bash
python -m training.evaluate --model ./models/random_forest_v1.joblib --samples 1000
```

### Feature Importance Analysis
```bash
python -m training.feature_importance --model ./models/random_forest_v1.joblib
```

## 📁 Project Structure

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application
│   ├── config.py                  # Configuration settings
│   ├── models/
│   │   └── schemas.py             # Pydantic models
│   ├── services/
│   │   ├── feature_engineering.py # Feature extraction
│   │   ├── model_loader.py        # Model loading/caching
│   │   └── predictor.py           # Prediction service
│   ├── api/
│   │   └── routes/
│   │       ├── predict.py         # /predict endpoints
│   │       ├── analyze.py         # /analyze endpoints
│   │       └── health.py          # /health endpoint
│   └── utils/
│       ├── database.py            # PostgreSQL connection
│       └── logging.py             # Logging configuration
├── training/
│   ├── train.py                   # Training script
│   ├── evaluate.py                # Evaluation metrics
│   ├── synthetic_data.py          # Data generation
│   └── feature_importance.py      # Feature analysis
├── models/                        # Saved model files
├── tests/
│   ├── test_api.py
│   ├── test_features.py
│   └── test_prediction.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `MODEL_PATH` | Path to trained model | `./models/random_forest_v1.joblib` |
| `ML_SERVICE_PORT` | Service port | `8000` |
| `LOG_LEVEL` | Logging level | `INFO` |

## 📈 Feature Engineering

The model uses 15 engineered features:

| Feature | Description |
|---------|-------------|
| `current_difficulty` | Current question difficulty (1-10) |
| `is_correct` | Latest answer correctness |
| `time_spent_seconds` | Time spent on current question |
| `attempt_number` | Question number in session |
| `recent_accuracy` | Accuracy over last 5 questions |
| `recent_avg_time` | Average time over last 5 |
| `accuracy_trend` | Slope of recent accuracy |
| `time_trend` | Slope of recent times |
| `streak_correct` | Consecutive correct answers |
| `streak_incorrect` | Consecutive wrong answers |
| `difficulty_variance` | Std dev of recent difficulties |
| `speed_category_*` | One-hot encoded speed (fast/medium/slow) |
| `skill_level_*` | One-hot encoded skill level |

## 🎓 Academic Context

This service is part of the VR Meta University diploma project (IT2-2217), implementing adaptive learning using machine learning as described in the theoretical foundations section of the thesis.

**Team:**
- Kanatbay Miras (Frontend)
- Kuanyshbaev Alikhan (Frontend)
- QSO (ML/Backend, System Architecture)
- Zhumabaev Sabit (VR, Backend)

## 📝 License

This project is part of an academic diploma thesis at MUIT.

## 🔗 Integration

The service integrates with:
- **ASP.NET Core Backend** (port 5272)
- **React Frontend** (port 3000/5173)
- **PostgreSQL Database** (port 5432)

All services communicate via the `vr_courses_network` Docker network.
