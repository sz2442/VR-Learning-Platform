using VRCourses.API.Models.DTOs;

namespace VRCourses.API.Services.Interfaces;

public interface IQuizService
{
    Task<StartSessionResultDto> StartQuizSessionAsync(int userId, int courseId, int? moduleId = null, string? quizType = null);
    Task<QuestionDto?> GetNextQuestionAsync(int sessionId);
    Task<SubmitAnswerResultDto> SubmitAnswerAsync(SubmitAnswerDto dto);
    Task<SessionStatsDto> GetSessionStatsAsync(int sessionId);
    Task EndSessionAsync(int sessionId);
}