using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Требует JWT токен
public class QuizController : ControllerBase
{
    private readonly IQuizService _quizService;

    public QuizController(IQuizService quizService)
    {
        _quizService = quizService;
    }

    // POST /api/quiz/start
    [HttpPost("start")]
    public async Task<IActionResult> StartSession([FromQuery] int courseId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sessionId = await _quizService.StartQuizSessionAsync(userId, courseId);
        return Ok(new { sessionId });
    }

    // GET /api/quiz/next-question?sessionId=1
    [HttpGet("next-question")]
    public async Task<IActionResult> GetNextQuestion([FromQuery] int sessionId)
    {
        var question = await _quizService.GetNextQuestionAsync(sessionId);
        if (question == null)
            return NotFound(new { message = "No more questions available" });

        return Ok(question);
    }

    // POST /api/quiz/submit-answer
    [HttpPost("submit-answer")]
    public async Task<IActionResult> SubmitAnswer([FromBody] SubmitAnswerDto dto)
    {
        try
        {
            var result = await _quizService.SubmitAnswerAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            // Вернет понятную ошибку на фронт (400 Bad Request)
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/quiz/stats?sessionId=1
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] int sessionId)
    {
        var stats = await _quizService.GetSessionStatsAsync(sessionId);
        return Ok(stats);
    }
}