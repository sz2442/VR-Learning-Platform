using VRCourses.API.Models.DTOs;

namespace VRCourses.API.Services.Interfaces;

public interface IProgressService
{
    Task<bool> MarkLessonCompleteAsync(int userId, MarkLessonCompleteDto dto);
    Task<MiniQuizResultDto> SubmitMiniQuizAsync(int userId, SubmitMiniQuizDto dto);
    Task<CourseProgressDto?> GetCourseProgressAsync(int userId, int courseId);
}
