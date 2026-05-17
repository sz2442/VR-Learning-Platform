using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api/instructor")]
[Authorize(Roles = "Instructor")]
public class InstructorController : ControllerBase
{
    private readonly IInstructorService _instructorService;

    public InstructorController(IInstructorService instructorService)
    {
        _instructorService = instructorService;
    }

    // GET /api/instructor/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _instructorService.GetStatsAsync();
        return Ok(stats);
    }

    // GET /api/instructor/students
    [HttpGet("students")]
    public async Task<IActionResult> GetStudents()
    {
        var students = await _instructorService.GetStudentsAsync();
        return Ok(students);
    }

    // GET /api/instructor/students/:userId/details
    [HttpGet("students/{userId:int}/details")]
    public async Task<IActionResult> GetStudentDetail(int userId)
    {
        var detail = await _instructorService.GetStudentDetailAsync(userId);
        if (detail == null) return NotFound(new { message = "Student not found" });
        return Ok(detail);
    }

    // GET /api/instructor/courses/:courseId/questions
    [HttpGet("courses/{courseId:int}/questions")]
    public async Task<IActionResult> GetCourseQuestions(int courseId)
    {
        var groups = await _instructorService.GetCourseQuestionsAsync(courseId);
        return Ok(groups);
    }

    // POST /api/instructor/questions
    [HttpPost("questions")]
    public async Task<IActionResult> AddQuestion([FromBody] SaveQuestionDto dto)
    {
        var id = await _instructorService.AddQuestionAsync(dto);
        return Ok(new { id });
    }

    // PUT /api/instructor/questions/:id
    [HttpPut("questions/{id:int}")]
    public async Task<IActionResult> UpdateQuestion(int id, [FromBody] SaveQuestionDto dto)
    {
        var ok = await _instructorService.UpdateQuestionAsync(id, dto);
        if (!ok) return NotFound(new { message = "Question not found" });
        return Ok(new { message = "Updated" });
    }

    // DELETE /api/instructor/questions/:id
    [HttpDelete("questions/{id:int}")]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var ok = await _instructorService.DeleteQuestionAsync(id);
        if (!ok) return NotFound(new { message = "Question not found" });
        return Ok(new { message = "Deleted" });
    }

    // PUT /api/instructor/lessons/:lessonId/content
    [HttpPut("lessons/{lessonId:int}/content")]
    public async Task<IActionResult> UpdateLessonContent(int lessonId, [FromBody] UpdateLessonContentDto dto)
    {
        var ok = await _instructorService.UpdateLessonContentAsync(lessonId, dto.ContentText, dto.VideoUrl);
        if (!ok) return NotFound(new { message = "Lesson not found" });
        return Ok(new { message = "Updated" });
    }

    // GET /api/instructor/analytics/daily-active
    [HttpGet("analytics/daily-active")]
    public async Task<IActionResult> GetDailyActive()
    {
        var data = await _instructorService.GetDailyActiveAsync();
        return Ok(data);
    }
}
