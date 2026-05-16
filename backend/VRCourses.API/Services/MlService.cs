using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class MlService : IMlService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MlService> _logger;
    private readonly MlPredictionStore _store;

    public MlService(HttpClient httpClient, ILogger<MlService> logger, MlPredictionStore store)
    {
        _httpClient = httpClient;
        _logger = logger;
        _store = store;
    }

    public async Task<MlPredictionResult?> PredictDifficultyAsync(
        int sessionId,
        int currentDifficulty,
        List<AttemptInfo> recentAttempts,
        string skillLevel = "Intermediate")
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

        _logger.LogInformation(
            "{{\"event\":\"ml_request\",\"session_id\":{SessionId},\"current_difficulty\":{CurrentDifficulty},\"attempt_count\":{AttemptCount},\"skill_level\":\"{SkillLevel}\"}}",
            sessionId, currentDifficulty, recentAttempts.Count, skillLevel);

        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/v1/predict/difficulty", request);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "{{\"event\":\"ml_http_error\",\"session_id\":{SessionId},\"status\":{Status}}}",
                    sessionId, (int)response.StatusCode);
                return null;
            }

            var result = await response.Content.ReadFromJsonAsync<MlPredictionResponse>();
            if (result == null) return null;

            _logger.LogInformation(
                "{{\"event\":\"ml_response\",\"session_id\":{SessionId},\"predicted\":{Predicted},\"confidence\":{Confidence},\"source\":\"{Source}\",\"model_version\":\"{ModelVersion}\"}}",
                sessionId, result.PredictedDifficulty, result.Confidence, result.Source, result.ModelVersion);

            var entry = new PredictionLogEntry(
                SessionId: sessionId,
                CurrentDifficulty: currentDifficulty,
                PredictedDifficulty: result.PredictedDifficulty,
                Confidence: result.Confidence,
                Source: result.Source,
                Features: new Dictionary<string, float>(),
                Timestamp: DateTime.UtcNow
            );
            _store.Add(entry);

            return new MlPredictionResult(result.PredictedDifficulty, result.Confidence, result.Source);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                "{{\"event\":\"ml_exception\",\"session_id\":{SessionId},\"error\":\"{Error}\"}}",
                sessionId, ex.Message);
            return null;
        }
    }

    private record MlPredictionResponse(
        [property: JsonPropertyName("predicted_difficulty")] int PredictedDifficulty,
        [property: JsonPropertyName("confidence")] double Confidence,
        [property: JsonPropertyName("source")] string Source,
        [property: JsonPropertyName("model_version")] string ModelVersion
    );
}
