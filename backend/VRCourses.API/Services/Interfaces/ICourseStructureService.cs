using VRCourses.API.Models.DTOs;

namespace VRCourses.API.Services.Interfaces;

public interface ICourseStructureService
{
    Task<CourseStructureDto?> GetCourseStructureAsync(int courseId, int userId);
    Task<LessonContentDto?> GetLessonContentAsync(int lessonId);
    Task<List<MiniQuizQuestionDto>> GetMiniQuizQuestionsAsync(int moduleId);
}
