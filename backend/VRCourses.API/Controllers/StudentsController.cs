using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api/students")]
[Authorize(Roles = "Student")]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    // GET /api/students/me/stats
    [HttpGet("me/stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var stats = await _studentService.GetStatsAsync(userId);
        return Ok(stats);
    }

    // GET /api/students/me/progress
    [HttpGet("me/progress")]
    public async Task<IActionResult> GetProgress()
    {
        var userId = GetUserId();
        var progress = await _studentService.GetProgressAsync(userId);
        return Ok(progress);
    }

    // GET /api/students/me/activity
    [HttpGet("me/activity")]
    public async Task<IActionResult> GetActivity()
    {
        var userId = GetUserId();
        var activity = await _studentService.GetActivityAsync(userId);
        return Ok(activity);
    }

    // GET /api/students/me/accuracy-history
    [HttpGet("me/accuracy-history")]
    public async Task<IActionResult> GetAccuracyHistory()
    {
        var userId = GetUserId();
        var history = await _studentService.GetAccuracyHistoryAsync(userId);
        return Ok(history);
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
