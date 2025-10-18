using Microsoft.EntityFrameworkCore;
using VRCourses.API.Data;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class CourseService : ICourseService
{
    private readonly AppDbContext _context;

    public CourseService(AppDbContext context)
    {
        _context = context;
    }

    // Получить все опубликованные курсы
    public async Task<List<CourseDto>> GetAllCoursesAsync()
    {
        var courses = await _context.Courses
            .Where(c => c.IsPublished)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return courses.Select(c => new CourseDto
        {
            Id = c.Id,
            Title = c.Title,
            ShortDescription = c.ShortDescription,
            ImageUrl = c.ImageUrl,
            DurationMinutes = c.DurationMinutes,
            Difficulty = c.Difficulty
        }).ToList();
    }

    // Получить курс по ID
    public async Task<CourseDto?> GetCourseByIdAsync(int courseId)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == courseId && c.IsPublished);

        if (course == null)
            return null;

        return new CourseDto
        {
            Id = course.Id,
            Title = course.Title,
            ShortDescription = course.ShortDescription,
            ImageUrl = course.ImageUrl,
            DurationMinutes = course.DurationMinutes,
            Difficulty = course.Difficulty
        };
    }
}