namespace VRCourses.API.Services.Interfaces;

public record AttemptInfo(int QuestionId, int Difficulty, bool IsCorrect, int TimeSpentSeconds);

public record MlPredictionResult(int Difficulty, double Confidence, string Source);

public interface IMlService
{
    Task<MlPredictionResult?> PredictDifficultyAsync(
        int sessionId,
        int currentDifficulty,
        List<AttemptInfo> recentAttempts,
        string skillLevel = "Intermediate");
}
