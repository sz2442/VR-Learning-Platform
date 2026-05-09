using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuizController : ControllerBase
{
    private readonly IQuizService _quizService;

    public QuizController(IQuizService quizService)
    {
        _quizService = quizService;
    }

    // POST /api/quiz/start?courseId=1[&moduleId=2&quizType=mini]
    [HttpPost("start")]
    public async Task<IActionResult> StartSession(
        [FromQuery] int courseId,
        [FromQuery] int? moduleId = null,
        [FromQuery] string? quizType = null)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _quizService.StartQuizSessionAsync(userId, courseId, moduleId, quizType);
        return Ok(result);
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

    // POST /api/quiz/end?sessionId=1  — close session, save partial progress
    [HttpPost("end")]
    public async Task<IActionResult> EndSession([FromQuery] int sessionId)
    {
        await _quizService.EndSessionAsync(sessionId);
        return Ok(new { message = "Session ended" });
    }
}
