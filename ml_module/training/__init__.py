"""Training module for ML model."""

from .synthetic_data import (
    SyntheticDataGenerator,
    StudentArchetype,
    generate_training_data,
)
from .train import train_model, save_model, main as train_main

__all__ = [
    "SyntheticDataGenerator",
    "StudentArchetype", 
    "generate_training_data",
    "train_model",
    "save_model",
    "train_main",
]
