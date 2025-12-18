"""
Feature Importance Analysis.

Analyzes which features are most important for difficulty prediction.
Useful for thesis documentation and model explainability.
"""

import argparse
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple

import numpy as np
import pandas as pd
import joblib
from sklearn.inspection import permutation_importance

from training.synthetic_data import generate_training_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def analyze_feature_importance(
    model,
    X: pd.DataFrame,
    y: pd.Series,
    feature_names: List[str]
) -> Dict[str, Any]:
    """
    Comprehensive feature importance analysis.
    
    Includes:
    - Built-in Random Forest importance (Gini)
    - Permutation importance (more reliable)
    """
    results = {}
    
    # 1. Built-in importance (MDI - Mean Decrease in Impurity)
    mdi_importance = dict(zip(feature_names, model.feature_importances_))
    results["mdi_importance"] = mdi_importance
    
    # 2. Permutation importance
    logger.info("Computing permutation importance (this may take a moment)...")
    perm_importance = permutation_importance(
        model, X, y,
        n_repeats=10,
        random_state=42,
        n_jobs=-1
    )
    
    perm_importance_dict = dict(zip(
        feature_names,
        perm_importance.importances_mean
    ))
    results["permutation_importance"] = perm_importance_dict
    
    # 3. Feature correlations with target
    correlations = {}
    for col in X.columns:
        corr = np.corrcoef(X[col], y)[0, 1]
        correlations[col] = corr
    results["correlations"] = correlations
    
    return results


def print_feature_report(results: Dict[str, Any], feature_names: List[str]):
    """Print formatted feature importance report."""
    print("\n" + "="*70)
    print("FEATURE IMPORTANCE ANALYSIS")
    print("="*70)
    
    # MDI Importance
    print("\n📊 GINI IMPORTANCE (Mean Decrease in Impurity)")
    print("-"*50)
    mdi = results["mdi_importance"]
    sorted_mdi = sorted(mdi.items(), key=lambda x: x[1], reverse=True)
    
    for i, (feature, importance) in enumerate(sorted_mdi, 1):
        bar = "█" * int(importance * 100)
        print(f"  {i:2d}. {feature:30s} {importance:.4f} {bar}")
    
    # Permutation Importance
    print("\n🔀 PERMUTATION IMPORTANCE (more reliable)")
    print("-"*50)
    perm = results["permutation_importance"]
    sorted_perm = sorted(perm.items(), key=lambda x: x[1], reverse=True)
    
    for i, (feature, importance) in enumerate(sorted_perm, 1):
        bar = "█" * int(importance * 100)
        print(f"  {i:2d}. {feature:30s} {importance:.4f} {bar}")
    
    # Correlations with target
    print("\n📈 CORRELATION WITH TARGET")
    print("-"*50)
    corr = results["correlations"]
    sorted_corr = sorted(corr.items(), key=lambda x: abs(x[1]), reverse=True)
    
    for i, (feature, correlation) in enumerate(sorted_corr, 1):
        sign = "+" if correlation > 0 else ""
        bar_len = int(abs(correlation) * 30)
        bar = "+" * bar_len if correlation > 0 else "-" * bar_len
        print(f"  {i:2d}. {feature:30s} {sign}{correlation:.4f} {bar}")
    
    # Key insights
    print("\n" + "="*70)
    print("KEY INSIGHTS FOR THESIS")
    print("="*70)
    
    top_mdi = sorted_mdi[:3]
    top_perm = sorted_perm[:3]
    
    print("\n📝 Top predictive features (by both methods):")
    common_top = set([f[0] for f in top_mdi]) & set([f[0] for f in top_perm])
    if common_top:
        for f in common_top:
            print(f"  • {f}")
    
    print("\n📝 Feature categories breakdown:")
    categories = {
        "Performance": ["recent_accuracy", "is_correct", "streak_correct", "streak_incorrect"],
        "Temporal": ["time_spent_seconds", "recent_avg_time", "speed_category_fast", 
                    "speed_category_medium", "speed_category_slow"],
        "Difficulty": ["current_difficulty", "difficulty_variance"],
        "Trends": ["accuracy_trend", "time_trend"],
        "User Context": ["skill_level_beginner", "skill_level_intermediate", "skill_level_advanced"],
        "Session": ["attempt_number"]
    }
    
    for cat, features in categories.items():
        total_importance = sum(mdi.get(f, 0) for f in features)
        print(f"  {cat:20s}: {total_importance:.2%} of total importance")
    
    print("\n" + "="*70 + "\n")


def export_to_latex(results: Dict[str, Any], output_path: str):
    """Export feature importance table to LaTeX for thesis."""
    mdi = results["mdi_importance"]
    sorted_mdi = sorted(mdi.items(), key=lambda x: x[1], reverse=True)
    
    latex = """
\\begin{table}[h]
\\centering
\\caption{Feature Importance Rankings for Difficulty Prediction}
\\label{tab:feature_importance}
\\begin{tabular}{|c|l|c|}
\\hline
\\textbf{Rank} & \\textbf{Feature} & \\textbf{Importance} \\\\
\\hline
"""
    
    for i, (feature, importance) in enumerate(sorted_mdi[:10], 1):
        # Clean feature name for LaTeX
        clean_name = feature.replace("_", "\\_")
        latex += f"{i} & {clean_name} & {importance:.4f} \\\\\n"
    
    latex += """\\hline
\\end{tabular}
\\end{table}
"""
    
    with open(output_path, 'w') as f:
        f.write(latex)
    
    logger.info(f"LaTeX table exported to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Analyze feature importance")
    parser.add_argument("--model", type=str, default="./models/random_forest_v1.joblib")
    parser.add_argument("--samples", type=int, default=1000)
    parser.add_argument("--export-latex", type=str, default=None, help="Export LaTeX table")
    args = parser.parse_args()
    
    logger.info(f"Loading model from {args.model}")
    bundle = joblib.load(args.model)
    model = bundle["model"] if isinstance(bundle, dict) else bundle
    feature_names = bundle.get("feature_names", []) if isinstance(bundle, dict) else []
    
    logger.info("Generating test data...")
    X, y = generate_training_data(n_samples=args.samples, output_path=None, seed=123)
    
    if not feature_names:
        feature_names = X.columns.tolist()
    
    logger.info("Analyzing feature importance...")
    results = analyze_feature_importance(model, X, y, feature_names)
    
    print_feature_report(results, feature_names)
    
    if args.export_latex:
        export_to_latex(results, args.export_latex)


if __name__ == "__main__":
    main()
