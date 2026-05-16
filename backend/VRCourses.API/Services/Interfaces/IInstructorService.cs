using VRCourses.API.Models.DTOs;

namespace VRCourses.API.Services.Interfaces;

public interface IInstructorService
{
    Task<InstructorStatsDto> GetStatsAsync();
    Task<List<InstructorStudentDto>> GetStudentsAsync();
    Task<StudentDetailDto?> GetStudentDetailAsync(int userId);
    Task<List<CourseQuestionGroupDto>> GetCourseQuestionsAsync(int courseId);
    Task<int> AddQuestionAsync(SaveQuestionDto dto);
    Task<bool> UpdateQuestionAsync(int questionId, SaveQuestionDto dto);
    Task<List<DailyActiveDto>> GetDailyActiveAsync();
}
