using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using VRCourses.API.Services;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly MlPredictionStore _store;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        MlPredictionStore store,
        IHttpClientFactory httpFactory,
        IConfiguration config,
        ILogger<AdminController> logger)
    {
        _store = store;
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    // GET /api/admin/ml-predictions — last 20 stored predictions
    [HttpGet("ml-predictions")]
    public IActionResult GetMlPredictions([FromQuery] int count = 20)
    {
        count = Math.Clamp(count, 1, 100);
        var predictions = _store.GetLast(count).Select(e => new
        {
            e.SessionId,
            e.CurrentDifficulty,
            e.PredictedDifficulty,
            e.Confidence,
            e.Source,
            e.Timestamp,
        });
        return Ok(new { total = _store.TotalCount, predictions });
    }

    // GET /api/admin/ml-status — calls ML service /health and returns status
    [HttpGet("ml-status")]
    public async Task<IActionResult> GetMlStatus()
    {
        var baseUrl = _config["MlService:BaseUrl"] ?? "http://localhost:8000";

        try
        {
            var client = _httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);

            var response = await client.GetAsync($"{baseUrl}/health");

            if (!response.IsSuccessStatusCode)
                return Ok(new { reachable = false, status = "unreachable", http_status = (int)response.StatusCode });

            var body = await response.Content.ReadFromJsonAsync<MlHealthResponse>();
            return Ok(new
            {
                reachable = true,
                status = body?.Status ?? "unknown",
                model_loaded = body?.ModelLoaded ?? false,
                model_version = body?.ModelVersion ?? "unknown",
                uptime_seconds = body?.UptimeSeconds ?? 0,
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning("ML health check failed: {Error}", ex.Message);
            return Ok(new { reachable = false, status = "unreachable", error = ex.Message });
        }
    }

    // POST /api/admin/ml-test — send hardcoded test prediction
    [HttpPost("ml-test")]
    public async Task<IActionResult> SendTestPrediction()
    {
        var baseUrl = _config["MlService:BaseUrl"] ?? "http://localhost:8000";

        var testPayload = new
        {
            session_id = 9999,
            current_difficulty = 5,
            recent_attempts = new[]
            {
                new { question_id = 1, difficulty = 5, is_correct = true,  time_spent_seconds = 22 },
                new { question_id = 2, difficulty = 5, is_correct = true,  time_spent_seconds = 18 },
                new { question_id = 3, difficulty = 5, is_correct = false, time_spent_seconds = 45 },
                new { question_id = 4, difficulty = 5, is_correct = true,  time_spent_seconds = 30 },
                new { question_id = 5, difficulty = 5, is_correct = true,  time_spent_seconds = 25 },
            },
            user_context = new { skill_level = "Intermediate" }
        };

        try
        {
            var client = _httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);

            var response = await client.PostAsJsonAsync($"{baseUrl}/api/v1/predict/difficulty", testPayload);
            var body = await response.Content.ReadAsStringAsync();
            return Ok(new { success = response.IsSuccessStatusCode, response = body });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, error = ex.Message });
        }
    }

    private record MlHealthResponse(
        string Status,
        bool ModelLoaded,
        string ModelVersion,
        double UptimeSeconds
    );
}
