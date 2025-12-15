"""
VR Meta University ML Service

Main FastAPI application for adaptive learning difficulty prediction.

This service provides:
- Real-time difficulty prediction using Random Forest
- Student performance analysis
- Health monitoring endpoints

Reference: Hassan et al. (2024) - Students' Performance Prediction Using ML
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.config import get_settings
from app.utils.logging import setup_logging
from app.services.model_loader import get_model_manager
from app.api.routes import predict_router, analyze_router, health_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting VR Meta University ML Service...")
    
    settings = get_settings()
    model_manager = get_model_manager(settings.model_path)
    
    # Try to load model on startup
    try:
        if model_manager.load_model():
            logger.info(f"Model loaded: {model_manager.model_version}")
        else:
            logger.warning("Model not found, will use fallback predictions")
    except Exception as e:
        logger.warning(f"Failed to load model on startup: {e}")
        logger.info("Service will run with rule-based fallback")
    
    logger.info("ML Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML Service...")
    
    # Cleanup database connections if any
    try:
        from app.utils.database import get_db_manager
        db = get_db_manager()
        db.close()
    except Exception:
        pass
    
    logger.info("ML Service shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="VR Meta University ML Service",
    description="""
    ## Adaptive Learning ML Service
    
    Provides real-time difficulty prediction for the VR Meta University platform.
    
    ### Features:
    - **Difficulty Prediction**: ML-powered optimal question difficulty
    - **Student Analysis**: Performance tracking and recommendations
    - **Health Monitoring**: Service health and model status
    
    ### Model Details:
    - Algorithm: Random Forest Classifier
    - Features: 15 engineered features from quiz interactions
    - Target: 80%+ accuracy (vs 60% rule-based baseline)
    
    ### References:
    - Hassan et al. (2024): Students' Performance Prediction Using ML
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev
        "http://localhost:5173",  # Vite dev
        "http://localhost:5272",  # ASP.NET dev
        "*",  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    """Add X-Response-Time header to all responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Response-Time"] = f"{process_time:.2f}ms"
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.log_level == "DEBUG" else None,
            "status_code": 500
        }
    )


# Register routers
app.include_router(health_router)
app.include_router(predict_router, prefix="/api/v1")
app.include_router(analyze_router, prefix="/api/v1")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": "VR Meta University ML Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "api_version": "v1"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.ml_service_host,
        port=settings.ml_service_port,
        reload=True,
        log_level="info"
    )
