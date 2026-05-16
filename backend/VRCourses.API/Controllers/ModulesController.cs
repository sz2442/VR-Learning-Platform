using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ModulesController : ControllerBase
{
    private readonly ICourseStructureService _structureService;

    public ModulesController(ICourseStructureService structureService)
    {
        _structureService = structureService;
    }

    // GET /api/courses/{id}/modules
    [HttpGet("courses/{courseId}/modules")]
    public async Task<IActionResult> GetCourseStructure(int courseId)
    {
        int userId = GetUserId();
        var structure = await _structureService.GetCourseStructureAsync(courseId, userId);
        if (structure == null) return NotFound(new { message = "Course not found" });
        return Ok(structure);
    }

    // GET /api/lessons/{id}
    [HttpGet("lessons/{lessonId}")]
    public async Task<IActionResult> GetLesson(int lessonId)
    {
        var lesson = await _structureService.GetLessonContentAsync(lessonId);
        if (lesson == null) return NotFound(new { message = "Lesson not found" });
        return Ok(lesson);
    }

    // GET /api/modules/{id}/miniquiz
    [HttpGet("modules/{moduleId}/miniquiz")]
    public async Task<IActionResult> GetMiniQuiz(int moduleId)
    {
        var questions = await _structureService.GetMiniQuizQuestionsAsync(moduleId);
        return Ok(questions);
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
