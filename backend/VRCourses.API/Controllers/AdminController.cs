using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using VRCourses.API.Data;
using VRCourses.API.Services;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly MlPredictionStore _store;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminController> _logger;
    private readonly AppDbContext _db;

    public AdminController(
        MlPredictionStore store,
        IHttpClientFactory httpFactory,
        IConfiguration config,
        ILogger<AdminController> logger,
        AppDbContext db)
    {
        _store = store;
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
        _db = db;
    }

    // ── ML Debug (existing) ────────────────────────────────────────────────

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
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var body = await response.Content.ReadFromJsonAsync<MlHealthResponse>(options);
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

    // ── Platform Stats ─────────────────────────────────────────────────────

    [HttpGet("platform-stats")]
    public async Task<IActionResult> GetPlatformStats()
    {
        var today = DateTime.UtcNow.Date;

        var totalUsers = await _db.Users.CountAsync();
        var totalStudents = await _db.Users.CountAsync(u => u.Role == "Student");
        var totalInstructors = await _db.Users.CountAsync(u => u.Role == "Instructor");
        var activeSessionsToday = await _db.QuizSessions
            .CountAsync(s => s.StartTime.Date == today && s.IsActive);
        var totalSessionsAllTime = await _db.QuizSessions.CountAsync();
        var totalQuestionsAnswered = await _db.QuizAttempts.CountAsync();

        double averageAccuracyPlatform = 0;
        if (totalQuestionsAnswered > 0)
        {
            var correctCount = await _db.QuizAttempts.CountAsync(a => a.IsCorrect);
            averageAccuracyPlatform = Math.Round((double)correctCount / totalQuestionsAnswered * 100, 1);
        }

        return Ok(new
        {
            totalUsers,
            totalStudents,
            totalInstructors,
            activeSessionsToday,
            totalSessionsAllTime,
            averageAccuracyPlatform,
            totalQuestionsAnswered,
        });
    }

    // ── User Management ────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .Select(u => new
            {
                userId = u.Id,
                email = u.Email,
                role = u.Role,
                createdAt = u.CreatedAt,
                totalSessions = u.QuizSessions.Count,
                isActive = u.IsActive,
            })
            .OrderBy(u => u.userId)
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateRoleDto dto)
    {
        var allowed = new[] { "Student", "Instructor", "Admin" };
        if (!allowed.Contains(dto.Role))
            return BadRequest(new { message = "Invalid role. Must be Student, Instructor, or Admin." });

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        user.Role = dto.Role;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Role updated" });
    }

    [HttpPut("users/{id:int}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        user.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "User deactivated" });
    }

    // ── Course Management ──────────────────────────────────────────────────

    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses()
    {
        var courses = await _db.Courses.OrderBy(c => c.Id).ToListAsync();

        // distinct enrolled students per course
        var studentCounts = await _db.QuizSessions
            .GroupBy(s => s.CourseId)
            .Select(g => new { courseId = g.Key, count = g.Select(s => s.UserId).Distinct().Count() })
            .ToListAsync();

        // accuracy stats per course
        var attemptStats = await _db.QuizAttempts
            .GroupBy(a => a.Session.CourseId)
            .Select(g => new { courseId = g.Key, total = g.Count(), correct = g.Count(a => a.IsCorrect) })
            .ToListAsync();

        var studentMap  = studentCounts.ToDictionary(x => x.courseId, x => x.count);
        var attemptMap  = attemptStats.ToDictionary(x => x.courseId, x => x);

        var result = courses.Select(c =>
        {
            attemptMap.TryGetValue(c.Id, out var stats);
            var avg = stats is { total: > 0 }
                ? Math.Round((double)stats.correct / stats.total * 100, 1)
                : 0.0;
            return new
            {
                courseId        = c.Id,
                title           = c.Title,
                isPublished     = c.IsPublished,
                totalStudents   = studentMap.GetValueOrDefault(c.Id, 0),
                averageAccuracy = avg,
            };
        });

        return Ok(result);
    }

    [HttpPut("courses/{id:int}/publish")]
    public async Task<IActionResult> TogglePublish(int id)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course == null) return NotFound(new { message = "Course not found" });

        course.IsPublished = !course.IsPublished;
        await _db.SaveChangesAsync();
        return Ok(new { isPublished = course.IsPublished });
    }

    // ── Private types ──────────────────────────────────────────────────────

    private record MlHealthResponse(
        [property: JsonPropertyName("status")]        string Status,
        [property: JsonPropertyName("model_loaded")]  bool ModelLoaded,
        [property: JsonPropertyName("model_version")] string ModelVersion,
        [property: JsonPropertyName("uptime_seconds")] double UptimeSeconds
    );

    public record UpdateRoleDto(string Role);
}
