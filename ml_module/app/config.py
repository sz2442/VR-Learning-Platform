# app/config.py
"""
Configuration management for ML Service.
Uses Pydantic Settings for environment variable validation.
"""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database - NO DEFAULT PASSWORDS
    db_host: str = Field(default="localhost", alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_name: str = Field(default="vrcourses_db", alias="DB_NAME")
    db_user: str = Field(alias="DB_USER")  # Required, no default
    db_password: str = Field(alias="DB_PASSWORD")  # Required, no default
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
    
    # Service
    ml_service_host: str = Field(default="0.0.0.0", alias="ML_SERVICE_HOST")
    ml_service_port: int = Field(default=8000, alias="ML_SERVICE_PORT")
    
    # Model
    model_path: str = Field(default="./models/random_forest_v1.joblib", alias="MODEL_PATH")
    model_version: str = Field(default="rf_v1.0", alias="MODEL_VERSION")
    confidence_threshold: float = Field(default=0.6, alias="CONFIDENCE_THRESHOLD")
    
    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    
    @field_validator('db_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Ensure password is set and not a placeholder."""
        if not v or v in ['changeme', 'password', 'your_password', 'your_secure_password']:
            raise ValueError('Database password must be set to a secure value')
        return v
    
    @property
    def get_database_url(self) -> str:
        """Construct database URL from components or use provided URL."""
        if self.database_url:
            return self.database_url
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
