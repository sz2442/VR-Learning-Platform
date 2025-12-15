"""
Synthetic Data Generation for Training.

Generates realistic student quiz attempt data for model training.
Creates three student archetypes:
- Fast Learners (30%): High accuracy, quick responses
- Average Learners (50%): Medium accuracy, moderate speed
- Struggling Learners (20%): Lower accuracy, slower responses
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from dataclasses import dataclass
import logging
import random

logger = logging.getLogger(__name__)


@dataclass
class StudentArchetype:
    """Configuration for a student archetype."""
    name: str
    proportion: float  # Fraction of total students
    accuracy_range: Tuple[float, float]
    time_range: Tuple[int, int]  # seconds
    difficulty_start: int
    difficulty_progression: str  # "up", "down", "stable"
    difficulty_variance: float


class SyntheticDataGenerator:
    """
    Generate synthetic quiz attempt data for model training.
    
    Creates realistic patterns of student interactions including:
    - Varying accuracy levels
    - Response time patterns
    - Difficulty progression
    - Learning trends
    """
    
    # Student archetypes
    ARCHETYPES = [
        StudentArchetype(
            name="fast_learner",
            proportion=0.30,
            accuracy_range=(0.75, 0.95),
            time_range=(15, 25),
            difficulty_start=5,
            difficulty_progression="up",
            difficulty_variance=0.8
        ),
        StudentArchetype(
            name="average_learner",
            proportion=0.50,
            accuracy_range=(0.50, 0.75),
            time_range=(25, 40),
            difficulty_start=4,
            difficulty_progression="stable",
            difficulty_variance=0.5
        ),
        StudentArchetype(
            name="struggling_learner",
            proportion=0.20,
            accuracy_range=(0.20, 0.50),
            time_range=(40, 60),
            difficulty_start=5,
            difficulty_progression="down",
            difficulty_variance=0.3
        ),
    ]
    
    # Feature names for the output
    FEATURE_NAMES = [
        "current_difficulty",
        "is_correct",
        "time_spent_seconds",
        "attempt_number",
        "recent_accuracy",
        "recent_avg_time",
        "accuracy_trend",
        "time_trend",
        "streak_correct",
        "streak_incorrect",
        "difficulty_variance",
        "speed_category_fast",
        "speed_category_medium",
        "speed_category_slow",
        "skill_level_beginner",
        "skill_level_intermediate",
        "skill_level_advanced",
    ]
    
    def __init__(self, seed: int = 42):
        """Initialize generator with random seed."""
        self.seed = seed
        np.random.seed(seed)
        random.seed(seed)
    
    def generate_dataset(
        self,
        n_samples: int = 5000,
        questions_per_session: int = 10
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Generate complete training dataset.
        
        Args:
            n_samples: Total number of samples to generate
            questions_per_session: Questions per quiz session
            
        Returns:
            Tuple of (features DataFrame, target Series)
        """
        logger.info(f"Generating {n_samples} synthetic samples...")
        
        all_features = []
        all_targets = []
        
        # Calculate samples per archetype
        samples_generated = 0
        
        for archetype in self.ARCHETYPES:
            n_archetype = int(n_samples * archetype.proportion)
            n_sessions = n_archetype // questions_per_session
            
            logger.info(f"Generating {n_archetype} samples for {archetype.name}")
            
            for session_idx in range(n_sessions):
                # Generate a complete session
                session_features, session_targets = self._generate_session(
                    archetype=archetype,
                    n_questions=questions_per_session
                )
                
                all_features.extend(session_features)
                all_targets.extend(session_targets)
                samples_generated += len(session_features)
        
        # Convert to DataFrame
        features_df = pd.DataFrame(all_features, columns=self.FEATURE_NAMES)
        targets_series = pd.Series(all_targets, name="next_difficulty")
        
        logger.info(f"Generated {len(features_df)} samples total")
        
        return features_df, targets_series
    
    def _generate_session(
        self,
        archetype: StudentArchetype,
        n_questions: int
    ) -> Tuple[List[List[float]], List[int]]:
        """
        Generate a single quiz session.
        
        Args:
            archetype: Student archetype configuration
            n_questions: Number of questions in session
            
        Returns:
            Tuple of (list of feature vectors, list of target difficulties)
        """
        features_list = []
        targets_list = []
        
        # Session state
        current_difficulty = archetype.difficulty_start
        attempts_history: List[Dict] = []
        
        # Determine skill level
        skill_level = self._determine_skill_level(archetype)
        
        for q_num in range(n_questions):
            # Generate this attempt
            accuracy_base = np.random.uniform(*archetype.accuracy_range)
            
            # Adjust accuracy based on difficulty mismatch
            if archetype.name == "fast_learner":
                # Fast learners do better at higher difficulties
                accuracy_modifier = 0.05 if current_difficulty > 7 else 0
            elif archetype.name == "struggling_learner":
                # Struggling learners do worse at higher difficulties
                accuracy_modifier = -0.1 if current_difficulty > 6 else 0.05
            else:
                accuracy_modifier = 0
            
            is_correct = np.random.random() < (accuracy_base + accuracy_modifier)
            
            # Generate time
            base_time = np.random.uniform(*archetype.time_range)
            # Harder questions take longer
            time_modifier = (current_difficulty - 5) * 2
            time_spent = int(np.clip(base_time + time_modifier + np.random.normal(0, 5), 5, 120))
            
            # Create attempt record
            attempt = {
                "difficulty": current_difficulty,
                "is_correct": is_correct,
                "time_spent_seconds": time_spent
            }
            attempts_history.append(attempt)
            
            # Extract features
            features = self._extract_features(
                current_difficulty=current_difficulty,
                attempts_history=attempts_history,
                skill_level=skill_level,
                attempt_number=q_num + 1
            )
            
            # Determine next difficulty (target)
            next_difficulty = self._calculate_next_difficulty(
                archetype=archetype,
                current_difficulty=current_difficulty,
                attempts_history=attempts_history[-5:]  # Last 5
            )
            
            features_list.append(features)
            targets_list.append(next_difficulty)
            
            # Update for next iteration
            current_difficulty = next_difficulty
        
        return features_list, targets_list
    
    def _extract_features(
        self,
        current_difficulty: int,
        attempts_history: List[Dict],
        skill_level: str,
        attempt_number: int
    ) -> List[float]:
        """Extract feature vector from session state."""
        features = []
        
        # 1. Current difficulty
        features.append(float(current_difficulty))
        
        # Get latest attempt
        latest = attempts_history[-1] if attempts_history else None
        
        # 2. Is correct (latest)
        features.append(1.0 if latest and latest["is_correct"] else 0.0)
        
        # 3. Time spent (latest)
        features.append(float(latest["time_spent_seconds"]) if latest else 30.0)
        
        # 4. Attempt number
        features.append(float(attempt_number))
        
        # Recent window (last 5)
        recent = attempts_history[-5:] if len(attempts_history) >= 5 else attempts_history
        
        # 5. Recent accuracy
        if recent:
            recent_acc = sum(1 for a in recent if a["is_correct"]) / len(recent)
        else:
            recent_acc = 0.5
        features.append(recent_acc)
        
        # 6. Recent avg time
        if recent:
            recent_time = np.mean([a["time_spent_seconds"] for a in recent])
        else:
            recent_time = 30.0
        features.append(recent_time)
        
        # 7. Accuracy trend
        if len(attempts_history) >= 3:
            # Simple trend calculation
            first_half = attempts_history[:len(attempts_history)//2]
            second_half = attempts_history[len(attempts_history)//2:]
            if first_half and second_half:
                first_acc = sum(1 for a in first_half if a["is_correct"]) / len(first_half)
                second_acc = sum(1 for a in second_half if a["is_correct"]) / len(second_half)
                trend = second_acc - first_acc
            else:
                trend = 0.0
        else:
            trend = 0.0
        features.append(np.clip(trend, -1.0, 1.0))
        
        # 8. Time trend
        if len(recent) >= 2:
            times = [a["time_spent_seconds"] for a in recent]
            time_trend = (times[-1] - times[0]) / (len(times) * 30.0)
        else:
            time_trend = 0.0
        features.append(np.clip(time_trend, -1.0, 1.0))
        
        # 9-10. Streaks
        streak_correct = 0
        streak_incorrect = 0
        for a in reversed(attempts_history):
            if a["is_correct"]:
                if streak_incorrect == 0:
                    streak_correct += 1
                else:
                    break
            else:
                if streak_correct == 0:
                    streak_incorrect += 1
                else:
                    break
        features.append(float(streak_correct))
        features.append(float(streak_incorrect))
        
        # 11. Difficulty variance
        if len(recent) >= 2:
            diff_var = np.std([a["difficulty"] for a in recent])
        else:
            diff_var = 0.0
        features.append(diff_var)
        
        # 12-14. Speed categories
        time_spent = latest["time_spent_seconds"] if latest else 30
        features.append(1.0 if time_spent < 20 else 0.0)  # fast
        features.append(1.0 if 20 <= time_spent < 40 else 0.0)  # medium
        features.append(1.0 if time_spent >= 40 else 0.0)  # slow
        
        # 15-17. Skill level one-hot
        features.append(1.0 if skill_level == "Beginner" else 0.0)
        features.append(1.0 if skill_level == "Intermediate" else 0.0)
        features.append(1.0 if skill_level == "Advanced" else 0.0)
        
        return features
    
    def _calculate_next_difficulty(
        self,
        archetype: StudentArchetype,
        current_difficulty: int,
        attempts_history: List[Dict]
    ) -> int:
        """Calculate optimal next difficulty (ground truth)."""
        if not attempts_history:
            return current_difficulty
        
        # Calculate recent accuracy
        recent_accuracy = sum(1 for a in attempts_history if a["is_correct"]) / len(attempts_history)
        
        # Base difficulty adjustment
        if recent_accuracy >= 0.8:
            # Doing very well - increase difficulty
            next_diff = current_difficulty + 1
        elif recent_accuracy >= 0.6:
            # Doing well - maybe increase
            next_diff = current_difficulty + (1 if np.random.random() > 0.5 else 0)
        elif recent_accuracy >= 0.4:
            # Struggling a bit - stay or decrease
            next_diff = current_difficulty + (0 if np.random.random() > 0.3 else -1)
        else:
            # Really struggling - decrease
            next_diff = current_difficulty - 1
        
        # Apply archetype tendencies
        if archetype.difficulty_progression == "up":
            # Fast learners tend to progress
            if recent_accuracy >= 0.6:
                next_diff = max(next_diff, current_difficulty + 1)
        elif archetype.difficulty_progression == "down":
            # Struggling learners need easier content
            if recent_accuracy < 0.5:
                next_diff = min(next_diff, current_difficulty - 1)
        
        # Clip to valid range
        return int(np.clip(next_diff, 1, 10))
    
    def _determine_skill_level(self, archetype: StudentArchetype) -> str:
        """Determine skill level based on archetype."""
        if archetype.name == "fast_learner":
            return np.random.choice(
                ["Intermediate", "Advanced"],
                p=[0.4, 0.6]
            )
        elif archetype.name == "struggling_learner":
            return np.random.choice(
                ["Beginner", "Intermediate"],
                p=[0.7, 0.3]
            )
        else:
            return np.random.choice(
                ["Beginner", "Intermediate", "Advanced"],
                p=[0.3, 0.5, 0.2]
            )


def generate_training_data(
    n_samples: int = 5000,
    output_path: str = "./training/data",
    seed: int = 42
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Generate and optionally save training data.
    
    Args:
        n_samples: Number of samples to generate
        output_path: Path to save data (None to skip saving)
        seed: Random seed for reproducibility
        
    Returns:
        Tuple of features DataFrame and targets Series
    """
    generator = SyntheticDataGenerator(seed=seed)
    X, y = generator.generate_dataset(n_samples=n_samples)
    
    if output_path:
        import os
        os.makedirs(output_path, exist_ok=True)
        
        # Combine for saving
        data = X.copy()
        data["next_difficulty"] = y
        data.to_csv(f"{output_path}/synthetic_data.csv", index=False)
        logger.info(f"Saved training data to {output_path}/synthetic_data.csv")
    
    return X, y


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Generate dataset
    X, y = generate_training_data(
        n_samples=5000,
        output_path="./training/data",
        seed=42
    )
    
    print(f"\nDataset shape: {X.shape}")
    print(f"Target distribution:\n{y.value_counts().sort_index()}")
    print(f"\nFeature statistics:\n{X.describe()}")
