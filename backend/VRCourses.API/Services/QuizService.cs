using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using VRCourses.API.Data;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Models.Entities;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class QuizService : IQuizService
{
    private readonly AppDbContext _context;
    private readonly IMlService _mlService;
    private readonly ILogger<QuizService> _logger;

    public QuizService(AppDbContext context, IMlService mlService, ILogger<QuizService> logger)
    {
        _context = context;
        _mlService = mlService;
        _logger = logger;
    }

    public async Task<int> StartQuizSessionAsync(int userId, int courseId)
    {
        var session = new QuizSession
        {
            UserId = userId,
            CourseId = courseId,
            CurrentDifficulty = 5,
            StartTime = DateTime.UtcNow,
            IsActive = true
        };

        _context.QuizSessions.Add(session);
        await _context.SaveChangesAsync();

        _logger.LogInformation("🎮 Started quiz session {SessionId} for user {UserId}, course {CourseId}", 
            session.Id, userId, courseId);

        return session.Id;
    }

    public async Task<QuestionDto?> GetNextQuestionAsync(int sessionId)
    {
        var session = await _context.QuizSessions
            .Include(s => s.Attempts)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return null;

        // 🔥 ФИКС: Жесткое ограничение на 10 вопросов
        if (session.Attempts.Count >= 10)
        {
            return null; // Квиз завершен
        }

        var attemptedQuestionIds = session.Attempts.Select(a => a.QuestionId).ToList();

        var question = await _context.Questions
            .Include(q => q.Answers)
            .Where(q => q.CourseId == session.CourseId)
            .Where(q => q.DifficultyLevel == session.CurrentDifficulty)
            .Where(q => !attemptedQuestionIds.Contains(q.Id))
            .OrderBy(q => Guid.NewGuid())
            .FirstOrDefaultAsync();

        if (question == null)
        {
            question = await _context.Questions
                .Include(q => q.Answers)
                .Where(q => q.CourseId == session.CourseId)
                .Where(q => !attemptedQuestionIds.Contains(q.Id))
                .OrderBy(q => Math.Abs(q.DifficultyLevel - session.CurrentDifficulty))
                .ThenBy(q => Guid.NewGuid())
                .FirstOrDefaultAsync();
        }

        if (question == null) return null;

        object? dragDropData = null;
        if (question.QuestionType == "dragdrop" && question.DragDropDataJson != null)
            dragDropData = JsonSerializer.Deserialize<object>(question.DragDropDataJson);

        return new QuestionDto
        {
            QuestionId = question.Id,
            Text = question.Text,
            DifficultyLevel = question.DifficultyLevel,
            QuestionType = question.QuestionType,
            DragDropData = dragDropData,
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
            .ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(s => s.Id == dto.SessionId);

        if (session == null)
            throw new Exception("Session not found");

        var question = await _context.Questions.FindAsync(dto.QuestionId);
        if (question == null)
            throw new Exception($"Question with ID {dto.QuestionId} not found");

        bool isCorrect;
        int? selectedAnswerId = null;

        if (question.QuestionType == "dragdrop")
        {
            if (dto.DragDropIsCorrect == null)
                throw new Exception("DragDropIsCorrect is required for drag & drop questions");
            isCorrect = dto.DragDropIsCorrect.Value;
        }
        else
        {
            if (dto.SelectedAnswerId == null)
                throw new Exception("SelectedAnswerId is required for MCQ questions");

            var answer = await _context.Answers
                .FirstOrDefaultAsync(a => a.Id == dto.SelectedAnswerId);
            if (answer == null)
                throw new Exception($"Answer with ID {dto.SelectedAnswerId} not found");

            isCorrect = answer.IsCorrect;
            selectedAnswerId = dto.SelectedAnswerId;
        }

        // Сохранить попытку
        var attempt = new QuizAttempt
        {
            SessionId = dto.SessionId,
            QuestionId = dto.QuestionId,
            SelectedAnswerId = selectedAnswerId,
            IsCorrect = isCorrect,
            TimeSpentSeconds = dto.TimeSpentSeconds,
            Timestamp = DateTime.UtcNow
        };

        _context.QuizAttempts.Add(attempt);
        await _context.SaveChangesAsync();

        // Перезагрузить сессию с полными данными
        session = await _context.QuizSessions
            .Include(s => s.Attempts)
            .ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(s => s.Id == dto.SessionId);

        if (session == null)
            throw new Exception("Session lost after save");

        // 🎯 ML-АДАПТАЦИЯ с fallback
        var newDifficulty = await GetAdaptiveDifficultyAsync(session, question.DifficultyLevel);
        session.CurrentDifficulty = newDifficulty;

        await _context.SaveChangesAsync();

        return new SubmitAnswerResultDto
        {
            IsCorrect = isCorrect,
            NewDifficulty = newDifficulty,
            Feedback = isCorrect ? "Correct!" : "Incorrect. Try again!"
        };
    }

    private async Task<int> GetAdaptiveDifficultyAsync(QuizSession session, int lastQuestionDifficulty)
    {
        var recentAttempts = session.Attempts
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .Select(a => new AttemptInfo(
                a.QuestionId,
                a.Question?.DifficultyLevel ?? lastQuestionDifficulty,
                a.IsCorrect,
                a.TimeSpentSeconds
            ))
            .ToList();

        // ⚠️ Первые 3 вопроса - не меняем сложность резко (warm-up)
        if (session.Attempts.Count <= 3)
        {
            _logger.LogInformation("🔥 Warm-up period, keeping difficulty stable");
            return session.CurrentDifficulty;
        }

        // Недостаточно данных - используем rule-based
        if (recentAttempts.Count < 3)
        {
            _logger.LogInformation("📊 Not enough data, using rule-based");
            return AdjustDifficulty(session);
        }

        try
        {
            var mlPrediction = await _mlService.PredictDifficultyAsync(
                session.Id,
                session.CurrentDifficulty,
                recentAttempts,
                "Intermediate"
            );

            if (mlPrediction.HasValue)
            {
                // ✅ ВАЛИДАЦИЯ
                var validated = ValidateDifficulty(mlPrediction.Value, session.CurrentDifficulty);
                _logger.LogInformation("🤖 ML: {Raw} → Validated: {Final}", mlPrediction.Value, validated);
                return validated;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ ML service error");
        }

        // Fallback
        _logger.LogInformation("📊 Using rule-based adaptation");
        return AdjustDifficulty(session);
    }

    private int ValidateDifficulty(int mlPrediction, int currentDifficulty)
    {
        _logger.LogInformation("🔍 ML raw prediction: {ML}, current: {Current}", mlPrediction, currentDifficulty);
        
        // 1. Не падаем ниже 3 (слишком легко)
        if (mlPrediction < 3) 
        {
            _logger.LogWarning("⚠️ ML predicted {ML} < 3, clamping to 3", mlPrediction);
            mlPrediction = 3;
        }
        
        // 2. Не прыгаем больше чем на ±2 за раз
        var maxChange = 2;
        if (mlPrediction > currentDifficulty + maxChange)
        {
            _logger.LogWarning("⚠️ ML jump too high: {ML} → {Clamped}", 
                mlPrediction, currentDifficulty + maxChange);
            mlPrediction = currentDifficulty + maxChange;
        }
        if (mlPrediction < currentDifficulty - maxChange)
        {
            _logger.LogWarning("⚠️ ML drop too low: {ML} → {Clamped}", 
                mlPrediction, currentDifficulty - maxChange);
            mlPrediction = currentDifficulty - maxChange;
        }
        
        // 3. Держим в диапазоне 1-10
        mlPrediction = Math.Clamp(mlPrediction, 1, 10);
        
        _logger.LogInformation("✅ Validated difficulty: {Result}", mlPrediction);
        return mlPrediction;
    }

    private int AdjustDifficulty(QuizSession session)
    {
        var recentAttempts = session.Attempts
            .OrderByDescending(a => a.Timestamp)
            .Take(5)
            .ToList();

        if (recentAttempts.Count < 3)
            return session.CurrentDifficulty;

        double accuracy = recentAttempts.Count(a => a.IsCorrect) / (double)recentAttempts.Count;
        double avgTime = recentAttempts.Average(a => a.TimeSpentSeconds);

        var newDifficulty = session.CurrentDifficulty;

        // ✅ Более плавная логика
        if (accuracy >= 0.8 && avgTime < 30)
        {
            newDifficulty = Math.Min(session.CurrentDifficulty + 1, 10);
        }
        else if (accuracy >= 0.6 && accuracy < 0.8)
        {
            if (avgTime < 20)
                newDifficulty = Math.Min(session.CurrentDifficulty + 1, 10);
            else
                newDifficulty = session.CurrentDifficulty;
        }
        else if (accuracy >= 0.4 && accuracy < 0.6)
        {
            newDifficulty = session.CurrentDifficulty;
        }
        else // accuracy < 0.4
        {
            // ✅ Не ниже 3!
            newDifficulty = Math.Max(session.CurrentDifficulty - 1, 3);
        }

        _logger.LogInformation("📊 Rule-based: acc={Accuracy:P0}, time={Time:F1}s → {Current} → {New}", 
            accuracy, avgTime, session.CurrentDifficulty, newDifficulty);
        
        return newDifficulty;
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
            CurrentDifficulty = session.CurrentDifficulty,
            FinalDifficulty = session.CurrentDifficulty
        };
    }
}