using System.Net.Http.Json;
using System.Text.Json.Serialization;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class MlService : IMlService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MlService> _logger;

    public MlService(HttpClient httpClient, ILogger<MlService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<int?> PredictDifficultyAsync(int sessionId, int currentDifficulty,
        List<AttemptInfo> recentAttempts, string skillLevel = "Intermediate")
    {
        try
        {
            var request = new
            {
                session_id = sessionId,
                current_difficulty = currentDifficulty,
                recent_attempts = recentAttempts.Select(a => new
                {
                    question_id = a.QuestionId,
                    difficulty = a.Difficulty,
                    is_correct = a.IsCorrect,
                    time_spent_seconds = a.TimeSpentSeconds
                }),
                user_context = new { skill_level = skillLevel }
            };

            var response = await _httpClient.PostAsJsonAsync("/api/v1/predict/difficulty", request);
        
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("ML Service returned {StatusCode}", response.StatusCode);
                return null;
            }

            var result = await response.Content.ReadFromJsonAsync<MlPredictionResponse>();
        
            _logger.LogInformation("📥 ML returned: predicted={Predicted}, confidence={Confidence:F3}", 
                result?.PredictedDifficulty, result?.Confidence);
        
            return result?.PredictedDifficulty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ ML Service error: {Message}", ex.Message);
            return null;
        }
    }

    private record MlPredictionResponse(
        [property: JsonPropertyName("predicted_difficulty")] int PredictedDifficulty,
        [property: JsonPropertyName("confidence")] double Confidence,
        [property: JsonPropertyName("model_version")] string ModelVersion
    );
}