"""
Model Training Script for VR Meta University ML Service.

Trains a Random Forest classifier for difficulty prediction.
Based on Hassan et al. (2024) approach achieving 99.8% accuracy.

Usage:
    python -m training.train
    python -m training.train --samples 10000 --output ./models/rf_v1.joblib
"""

import argparse
import logging
import time
from pathlib import Path
from typing import Tuple, Dict, Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score
)
import joblib

from training.synthetic_data import generate_training_data, SyntheticDataGenerator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s"
)
logger = logging.getLogger(__name__)


def train_model(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.2,
    random_state: int = 42
) -> Tuple[RandomForestClassifier, Dict[str, Any]]:
    """
    Train Random Forest classifier.
    
    Args:
        X: Feature DataFrame
        y: Target Series
        test_size: Fraction for test split
        random_state: Random seed
        
    Returns:
        Tuple of (trained model, evaluation metrics)
    """
    logger.info("Splitting data into train/test sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    logger.info(f"Train size: {len(X_train)}, Test size: {len(X_test)}")
    
    # Initialize model with tuned hyperparameters
    # Based on Hassan et al. (2024) approach
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=20,
        min_samples_leaf=10,
        max_features='sqrt',
        random_state=random_state,
        n_jobs=-1,
        class_weight='balanced',  # Handle class imbalance
        oob_score=True  # Out-of-bag score for validation
    )
    
    # Train model
    logger.info("Training Random Forest classifier...")
    start_time = time.time()
    model.fit(X_train, y_train)
    training_time = time.time() - start_time
    logger.info(f"Training completed in {training_time:.2f} seconds")
    
    # Evaluate on test set
    logger.info("Evaluating model...")
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "f1_macro": f1_score(y_test, y_pred, average='macro'),
        "f1_weighted": f1_score(y_test, y_pred, average='weighted'),
        "oob_score": model.oob_score_,
        "training_time_seconds": training_time,
        "n_train_samples": len(X_train),
        "n_test_samples": len(X_test),
    }
    
    # Cross-validation
    logger.info("Running cross-validation...")
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy', n_jobs=-1)
    metrics["cv_mean_accuracy"] = cv_scores.mean()
    metrics["cv_std_accuracy"] = cv_scores.std()
    
    # Classification report
    class_report = classification_report(y_test, y_pred, output_dict=True)
    metrics["classification_report"] = class_report
    
    # Confusion matrix
    conf_matrix = confusion_matrix(y_test, y_pred)
    metrics["confusion_matrix"] = conf_matrix.tolist()
    
    # Feature importances
    feature_importance = dict(zip(X.columns, model.feature_importances_))
    metrics["feature_importances"] = feature_importance
    
    return model, metrics


def print_evaluation_results(metrics: Dict[str, Any]):
    """Print formatted evaluation results."""
    print("\n" + "="*60)
    print("MODEL EVALUATION RESULTS")
    print("="*60)
    
    print(f"\n📊 Performance Metrics:")
    print(f"  - Test Accuracy:     {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
    print(f"  - F1 Score (macro):  {metrics['f1_macro']:.4f}")
    print(f"  - F1 Score (weighted): {metrics['f1_weighted']:.4f}")
    print(f"  - OOB Score:         {metrics['oob_score']:.4f}")
    
    print(f"\n🔄 Cross-Validation (5-fold):")
    print(f"  - Mean Accuracy:     {metrics['cv_mean_accuracy']:.4f} ± {metrics['cv_std_accuracy']:.4f}")
    
    print(f"\n⏱️ Training Info:")
    print(f"  - Training Time:     {metrics['training_time_seconds']:.2f} seconds")
    print(f"  - Train Samples:     {metrics['n_train_samples']}")
    print(f"  - Test Samples:      {metrics['n_test_samples']}")
    
    # Top features
    print(f"\n🎯 Top 10 Feature Importances:")
    importances = metrics['feature_importances']
    sorted_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)
    for i, (feature, importance) in enumerate(sorted_features[:10], 1):
        bar = "█" * int(importance * 50)
        print(f"  {i:2d}. {feature:25s} {importance:.4f} {bar}")
    
    # Success criteria check
    print("\n" + "="*60)
    print("SUCCESS CRITERIA CHECK")
    print("="*60)
    
    target_accuracy = 0.80
    if metrics['accuracy'] >= target_accuracy:
        print(f"✅ Accuracy {metrics['accuracy']:.2%} >= {target_accuracy:.0%} target - PASSED!")
    else:
        print(f"❌ Accuracy {metrics['accuracy']:.2%} < {target_accuracy:.0%} target - NEEDS IMPROVEMENT")
    
    print("="*60 + "\n")


def save_model(
    model: RandomForestClassifier,
    metrics: Dict[str, Any],
    output_path: str,
    feature_names: list,
    version: str = "rf_v1.0"
):
    """
    Save trained model with metadata.
    
    Args:
        model: Trained model
        metrics: Evaluation metrics
        output_path: Path to save model
        feature_names: List of feature names
        version: Model version string
    """
    # Create model bundle
    bundle = {
        "model": model,
        "version": version,
        "feature_names": feature_names,
        "metadata": {
            "accuracy": metrics["accuracy"],
            "f1_macro": metrics["f1_macro"],
            "cv_mean_accuracy": metrics["cv_mean_accuracy"],
            "training_samples": metrics["n_train_samples"],
            "feature_importances": metrics["feature_importances"],
        }
    }
    
    # Ensure directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Save model
    joblib.dump(bundle, output_path)
    logger.info(f"Model saved to {output_path}")
    
    # Print file size
    file_size = Path(output_path).stat().st_size / 1024 / 1024
    logger.info(f"Model file size: {file_size:.2f} MB")


def main():
    """Main training pipeline."""
    parser = argparse.ArgumentParser(description="Train ML model for difficulty prediction")
    parser.add_argument("--samples", type=int, default=5000, help="Number of training samples")
    parser.add_argument("--output", type=str, default="./models/random_forest_v1.joblib", help="Output path")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--version", type=str, default="rf_v1.0", help="Model version")
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("VR META UNIVERSITY - ML MODEL TRAINING")
    print("="*60)
    print(f"Samples: {args.samples}")
    print(f"Output: {args.output}")
    print(f"Version: {args.version}")
    print("="*60 + "\n")
    
    # Generate synthetic data
    logger.info("Generating synthetic training data...")
    X, y = generate_training_data(
        n_samples=args.samples,
        output_path=None,  # Don't save separately
        seed=args.seed
    )
    
    logger.info(f"Data generated: {X.shape[0]} samples, {X.shape[1]} features")
    logger.info(f"Target distribution:\n{y.value_counts().sort_index()}")
    
    # Train model
    model, metrics = train_model(X, y, random_state=args.seed)
    
    # Print results
    print_evaluation_results(metrics)
    
    # Save model
    save_model(
        model=model,
        metrics=metrics,
        output_path=args.output,
        feature_names=X.columns.tolist(),
        version=args.version
    )
    
    logger.info("Training pipeline completed successfully! 🎉")
    
    return model, metrics


if __name__ == "__main__":
    main()
