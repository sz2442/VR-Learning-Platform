using VRCourses.API.Models.DTOs;

namespace VRCourses.API.Services.Interfaces;

public interface ICourseService
{
    Task<List<CourseDto>> GetAllCoursesAsync();
    Task<CourseDto?> GetCourseByIdAsync(int courseId);
}