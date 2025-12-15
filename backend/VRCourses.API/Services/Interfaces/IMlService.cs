namespace VRCourses.API.Services.Interfaces;

public interface IMlService
{
    Task<int?> PredictDifficultyAsync(int sessionId, int currentDifficulty, 
        List<AttemptInfo> recentAttempts, string skillLevel = "Intermediate");
}

public record AttemptInfo(int QuestionId, int Difficulty, bool IsCorrect, int TimeSpentSeconds);