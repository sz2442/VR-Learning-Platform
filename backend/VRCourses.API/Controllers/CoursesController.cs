using Microsoft.AspNetCore.Mvc;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    // GET /api/courses - Список всех курсов
    [HttpGet]
    public async Task<IActionResult> GetAllCourses()
    {
        var courses = await _courseService.GetAllCoursesAsync();
        return Ok(courses);
    }

    // GET /api/courses/{id} - Получить курс по ID
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCourseById(int id)
    {
        var course = await _courseService.GetCourseByIdAsync(id);
        
        if (course == null)
            return NotFound(new { message = "Курс не найден" });

        return Ok(course);
    }
}