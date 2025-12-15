"""
Model Evaluation Script.

Provides detailed evaluation of trained models including:
- Accuracy metrics by difficulty level
- Comparison with baseline (rule-based)
- Inference time benchmarking
"""

import argparse
import logging
import time
from pathlib import Path
from typing import Dict, Any, Tuple, List

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix
)

from training.synthetic_data import generate_training_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_model(model_path: str) -> Tuple[Any, Dict]:
    """Load model and metadata."""
    bundle = joblib.load(model_path)
    if isinstance(bundle, dict):
        return bundle["model"], bundle
    return bundle, {"model": bundle, "version": "unknown"}


def rule_based_prediction(
    current_difficulty: int,
    recent_accuracy: float
) -> int:
    """
    Simple rule-based baseline for comparison.
    
    This is what the current ASP.NET implementation does.
    """
    if recent_accuracy >= 0.8:
        return min(current_difficulty + 1, 10)
    elif recent_accuracy < 0.4:
        return max(current_difficulty - 1, 1)
    return current_difficulty


def evaluate_model_detailed(
    model,
    X: pd.DataFrame,
    y: pd.Series
) -> Dict[str, Any]:
    """
    Detailed model evaluation.
    
    Args:
        model: Trained model
        X: Features
        y: Targets
        
    Returns:
        Dictionary with evaluation metrics
    """
    # Predictions
    y_pred = model.predict(X)
    
    # Overall metrics
    accuracy = accuracy_score(y, y_pred)
    precision, recall, f1, support = precision_recall_fscore_support(
        y, y_pred, average='weighted'
    )
    
    # Per-class metrics
    precision_per, recall_per, f1_per, support_per = precision_recall_fscore_support(
        y, y_pred, average=None
    )
    
    # Confusion matrix
    conf_matrix = confusion_matrix(y, y_pred)
    
    # Accuracy by difficulty level
    difficulties = sorted(y.unique())
    acc_by_diff = {}
    for diff in difficulties:
        mask = y == diff
        if mask.sum() > 0:
            acc_by_diff[diff] = accuracy_score(y[mask], y_pred[mask])
    
    return {
        "accuracy": accuracy,
        "precision_weighted": precision,
        "recall_weighted": recall,
        "f1_weighted": f1,
        "accuracy_by_difficulty": acc_by_diff,
        "confusion_matrix": conf_matrix,
        "per_class_f1": dict(zip(difficulties, f1_per[:len(difficulties)]))
    }


def evaluate_baseline(X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
    """
    Evaluate rule-based baseline.
    
    Args:
        X: Features
        y: Targets
        
    Returns:
        Baseline metrics
    """
    predictions = []
    
    for idx, row in X.iterrows():
        current_diff = int(row['current_difficulty'])
        recent_acc = row['recent_accuracy']
        
        pred = rule_based_prediction(current_diff, recent_acc)
        predictions.append(pred)
    
    predictions = np.array(predictions)
    
    return {
        "accuracy": accuracy_score(y, predictions),
        "predictions": predictions
    }


def benchmark_inference(model, X: pd.DataFrame, n_iterations: int = 100) -> Dict[str, float]:
    """
    Benchmark inference time.
    
    Args:
        model: Trained model
        X: Features
        n_iterations: Number of benchmark iterations
        
    Returns:
        Timing statistics
    """
    times = []
    
    # Warm up
    for _ in range(10):
        model.predict(X.iloc[:1])
    
    # Single sample inference
    for _ in range(n_iterations):
        sample = X.sample(1)
        start = time.perf_counter()
        model.predict(sample)
        elapsed = (time.perf_counter() - start) * 1000  # ms
        times.append(elapsed)
    
    return {
        "mean_ms": np.mean(times),
        "std_ms": np.std(times),
        "p50_ms": np.percentile(times, 50),
        "p95_ms": np.percentile(times, 95),
        "p99_ms": np.percentile(times, 99),
        "min_ms": np.min(times),
        "max_ms": np.max(times)
    }


def print_comparison_report(
    ml_metrics: Dict,
    baseline_metrics: Dict,
    timing_stats: Dict
):
    """Print formatted comparison report."""
    print("\n" + "="*70)
    print("MODEL EVALUATION REPORT")
    print("="*70)
    
    # Accuracy comparison
    print("\n📊 ACCURACY COMPARISON")
    print("-"*40)
    ml_acc = ml_metrics['accuracy']
    base_acc = baseline_metrics['accuracy']
    improvement = (ml_acc - base_acc) / base_acc * 100
    
    print(f"  ML Model Accuracy:    {ml_acc:.4f} ({ml_acc*100:.2f}%)")
    print(f"  Baseline Accuracy:    {base_acc:.4f} ({base_acc*100:.2f}%)")
    print(f"  Improvement:          {improvement:+.1f}%")
    
    if ml_acc > base_acc:
        print("  ✅ ML model outperforms rule-based baseline!")
    else:
        print("  ⚠️ ML model needs improvement")
    
    # Accuracy by difficulty
    print("\n📈 ACCURACY BY DIFFICULTY LEVEL")
    print("-"*40)
    for diff, acc in sorted(ml_metrics['accuracy_by_difficulty'].items()):
        bar = "█" * int(acc * 30)
        print(f"  Level {diff:2d}: {acc:.2%} {bar}")
    
    # Inference timing
    print("\n⏱️ INFERENCE TIMING (single sample)")
    print("-"*40)
    print(f"  Mean:   {timing_stats['mean_ms']:.2f} ms")
    print(f"  Std:    {timing_stats['std_ms']:.2f} ms")
    print(f"  P50:    {timing_stats['p50_ms']:.2f} ms")
    print(f"  P95:    {timing_stats['p95_ms']:.2f} ms")
    print(f"  P99:    {timing_stats['p99_ms']:.2f} ms")
    
    if timing_stats['p95_ms'] < 500:
        print("  ✅ Meets <500ms latency requirement!")
    else:
        print("  ⚠️ Latency exceeds target")
    
    # Success criteria summary
    print("\n" + "="*70)
    print("SUCCESS CRITERIA SUMMARY")
    print("="*70)
    
    criteria = [
        ("Accuracy ≥ 80%", ml_acc >= 0.80),
        ("Better than baseline", ml_acc > base_acc),
        ("P95 latency < 500ms", timing_stats['p95_ms'] < 500),
        ("P99 latency < 1000ms", timing_stats['p99_ms'] < 1000),
    ]
    
    all_passed = True
    for name, passed in criteria:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {name}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*70)
    if all_passed:
        print("🎉 ALL CRITERIA PASSED - MODEL READY FOR DEPLOYMENT!")
    else:
        print("⚠️ SOME CRITERIA NOT MET - REVIEW REQUIRED")
    print("="*70 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Evaluate trained model")
    parser.add_argument("--model", type=str, default="./models/random_forest_v1.joblib", help="Model path")
    parser.add_argument("--samples", type=int, default=1000, help="Test samples")
    parser.add_argument("--seed", type=int, default=123, help="Random seed (different from training)")
    args = parser.parse_args()
    
    logger.info(f"Loading model from {args.model}")
    model, metadata = load_model(args.model)
    
    logger.info("Generating test data...")
    X, y = generate_training_data(n_samples=args.samples, output_path=None, seed=args.seed)
    
    logger.info("Evaluating ML model...")
    ml_metrics = evaluate_model_detailed(model, X, y)
    
    logger.info("Evaluating baseline...")
    baseline_metrics = evaluate_baseline(X, y)
    
    logger.info("Benchmarking inference time...")
    timing_stats = benchmark_inference(model, X)
    
    print_comparison_report(ml_metrics, baseline_metrics, timing_stats)


if __name__ == "__main__":
    main()
