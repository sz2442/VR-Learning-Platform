using VRCourses.API.Models.DTOs;

namespace VRCourses.API.Services.Interfaces;

public interface IStudentService
{
    Task<StudentStatsDto> GetStatsAsync(int userId);
    Task<List<CourseProgressSummaryDto>> GetProgressAsync(int userId);
    Task<List<ActivityEntryDto>> GetActivityAsync(int userId);
    Task<List<AccuracyPointDto>> GetAccuracyHistoryAsync(int userId);
}
