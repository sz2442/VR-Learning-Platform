using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api/progress")]
[Authorize]
public class ProgressController : ControllerBase
{
    private readonly IProgressService _progressService;

    public ProgressController(IProgressService progressService)
    {
        _progressService = progressService;
    }

    // POST /api/progress/lesson
    [HttpPost("lesson")]
    public async Task<IActionResult> MarkLessonComplete([FromBody] MarkLessonCompleteDto dto)
    {
        int userId = GetUserId();
        await _progressService.MarkLessonCompleteAsync(userId, dto);
        return Ok(new { message = "Lesson marked as complete" });
    }

    // POST /api/progress/miniquiz
    [HttpPost("miniquiz")]
    public async Task<IActionResult> SubmitMiniQuiz([FromBody] SubmitMiniQuizDto dto)
    {
        int userId = GetUserId();
        var result = await _progressService.SubmitMiniQuizAsync(userId, dto);
        return Ok(result);
    }

    // POST /api/progress/miniquiz/vr  — record VR quiz result without re-evaluating answers
    [HttpPost("miniquiz/vr")]
    public async Task<IActionResult> RecordVrMiniQuiz([FromBody] RecordVrMiniQuizDto dto)
    {
        int userId = GetUserId();
        var result = await _progressService.RecordVrMiniQuizAsync(userId, dto);
        return Ok(result);
    }

    // GET /api/progress/{courseId}
    [HttpGet("{courseId}")]
    public async Task<IActionResult> GetCourseProgress(int courseId)
    {
        int userId = GetUserId();
        var progress = await _progressService.GetCourseProgressAsync(userId, courseId);
        if (progress == null) return NotFound(new { message = "Course not found" });
        return Ok(progress);
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
