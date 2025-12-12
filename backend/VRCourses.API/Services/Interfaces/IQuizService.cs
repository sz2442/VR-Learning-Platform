using VRCourses.API.Models.DTOs;

namespace VRCourses.API.Services.Interfaces;

public interface IQuizService
{
    Task<int> StartQuizSessionAsync(int userId, int courseId);
    Task<QuestionDto?> GetNextQuestionAsync(int sessionId);
    Task<SubmitAnswerResultDto> SubmitAnswerAsync(SubmitAnswerDto dto);
    Task<SessionStatsDto> GetSessionStatsAsync(int sessionId);
}