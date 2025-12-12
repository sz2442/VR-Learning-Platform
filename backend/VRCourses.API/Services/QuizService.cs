using Microsoft.EntityFrameworkCore;
using VRCourses.API.Data;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Models.Entities;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class QuizService : IQuizService
{
    private readonly AppDbContext _context;

    public QuizService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> StartQuizSessionAsync(int userId, int courseId)
    {
        var session = new QuizSession
        {
            UserId = userId,
            CourseId = courseId,
            CurrentDifficulty = 5, // Start medium
            StartTime = DateTime.UtcNow,
            IsActive = true
        };

        _context.QuizSessions.Add(session);
        await _context.SaveChangesAsync();

        return session.Id;
    }

    public async Task<QuestionDto?> GetNextQuestionAsync(int sessionId)
    {
        var session = await _context.QuizSessions
            .Include(s => s.Attempts)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return null;

        // Получить вопросы, которые пользователь еще не видел
        var attemptedQuestionIds = session.Attempts.Select(a => a.QuestionId).ToList();

        var question = await _context.Questions
            .Include(q => q.Answers)
            .Where(q => q.CourseId == session.CourseId)
            .Where(q => q.DifficultyLevel == session.CurrentDifficulty)
            .Where(q => !attemptedQuestionIds.Contains(q.Id))
            .OrderBy(q => Guid.NewGuid()) // Random
            .FirstOrDefaultAsync();

        if (question == null)
        {
            // Если вопросов на этом уровне нет, ищем ближайший уровень
            question = await _context.Questions
                .Include(q => q.Answers)
                .Where(q => q.CourseId == session.CourseId)
                .Where(q => !attemptedQuestionIds.Contains(q.Id))
                .OrderBy(q => Math.Abs(q.DifficultyLevel - session.CurrentDifficulty))
                .ThenBy(q => Guid.NewGuid())
                .FirstOrDefaultAsync();
        }

        if (question == null) return null;

        return new QuestionDto
        {
            QuestionId = question.Id,
            Text = question.Text,
            DifficultyLevel = question.DifficultyLevel,
            Answers = question.Answers.Select(a => new AnswerOptionDto
            {
                AnswerId = a.Id,
                Text = a.Text
            }).ToList()
        };
    }

    public async Task<SubmitAnswerResultDto> SubmitAnswerAsync(SubmitAnswerDto dto)
    {
        var session = await _context.QuizSessions
            .Include(s => s.Attempts)
            .FirstOrDefaultAsync(s => s.Id == dto.SessionId);

        if (session == null)
            throw new Exception("Session not found");

        var answer = await _context.Answers
            .FirstOrDefaultAsync(a => a.Id == dto.SelectedAnswerId);

        if (answer == null)
            throw new Exception($"Answer with ID {dto.SelectedAnswerId} not found in database. QuestionId was: {dto.QuestionId}");
        // Сохранить попытку
        var attempt = new QuizAttempt
        {
            SessionId = dto.SessionId,
            QuestionId = dto.QuestionId,
            SelectedAnswerId = dto.SelectedAnswerId,
            IsCorrect = answer.IsCorrect,
            TimeSpentSeconds = dto.TimeSpentSeconds,
            Timestamp = DateTime.UtcNow
        };

        _context.QuizAttempts.Add(attempt);

        // 🎯 АДАПТИВНЫЙ АЛГОРИТМ (простой)
        var newDifficulty = AdjustDifficulty(session);
        session.CurrentDifficulty = newDifficulty;

        await _context.SaveChangesAsync();

        return new SubmitAnswerResultDto
        {
            IsCorrect = answer.IsCorrect,
            NewDifficulty = newDifficulty,
            Feedback = answer.IsCorrect ? "Correct!" : "Incorrect. Try again!"
        };
    }

    private int AdjustDifficulty(QuizSession session)
    {
        var recentAttempts = session.Attempts
            .OrderByDescending(a => a.Timestamp)
            .Take(5)
            .ToList();

        if (recentAttempts.Count < 3)
            return session.CurrentDifficulty; // Недостаточно данных

        double accuracy = recentAttempts.Count(a => a.IsCorrect) / (double)recentAttempts.Count;
        double avgTime = recentAttempts.Average(a => a.TimeSpentSeconds);

        // 📊 Правила адаптации
        if (accuracy >= 0.8 && avgTime < 30)
        {
            // Слишком легко -> увеличить сложность
            return Math.Min(session.CurrentDifficulty + 1, 10);
        }
        else if (accuracy < 0.4)
        {
            // Слишком сложно -> уменьшить сложность
            return Math.Max(session.CurrentDifficulty - 1, 1);
        }

        return session.CurrentDifficulty; // Оставить как есть
    }

    public async Task<SessionStatsDto> GetSessionStatsAsync(int sessionId)
    {
        var session = await _context.QuizSessions
            .Include(s => s.Attempts)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new Exception("Session not found");

        var total = session.Attempts.Count;
        var correct = session.Attempts.Count(a => a.IsCorrect);

        return new SessionStatsDto
        {
            TotalQuestions = total,
            CorrectAnswers = correct,
            Accuracy = total > 0 ? (double)correct / total * 100 : 0,
            CurrentDifficulty = session.CurrentDifficulty
        };
    }
}