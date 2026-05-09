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

    private const int MaxQuestionsMini   = 8;
    private const int MaxQuestionsFinal  = 20;
    private const int MaxQuestionsLegacy = 10;

    public QuizService(AppDbContext context, IMlService mlService, ILogger<QuizService> logger)
    {
        _context = context;
        _mlService = mlService;
        _logger = logger;
    }

    // ── Problem 1: optional moduleId / quizType ──────────────────────────────

    public async Task<StartSessionResultDto> StartQuizSessionAsync(
        int userId, int courseId, int? moduleId = null, string? quizType = null)
    {
        var session = new QuizSession
        {
            UserId = userId,
            CourseId = courseId,
            ModuleId = moduleId,
            QuizType = quizType,
            CurrentDifficulty = 5,
            StartTime = DateTime.UtcNow,
            IsActive = true
        };

        _context.QuizSessions.Add(session);
        await _context.SaveChangesAsync();

        int maxQ = quizType switch
        {
            "mini"  => MaxQuestionsMini,
            "final" => MaxQuestionsFinal,
            _       => MaxQuestionsLegacy,
        };

        _logger.LogInformation(
            "🎮 Started quiz session {SessionId} for user {UserId}, course {CourseId}, module {ModuleId}, type {QuizType}, maxQ {MaxQ}",
            session.Id, userId, courseId, moduleId, quizType, maxQ);

        return new StartSessionResultDto
        {
            SessionId    = session.Id,
            QuizType     = quizType,
            MaxQuestions = maxQ,
        };
    }

    // ── Problem 3: anti-repeat + Problem 1: module/count limits ─────────────

    public async Task<QuestionDto?> GetNextQuestionAsync(int sessionId)
    {
        var session = await _context.QuizSessions
            .Include(s => s.Attempts)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return null;

        int maxQ = session.QuizType switch
        {
            "mini"  => MaxQuestionsMini,
            "final" => MaxQuestionsFinal,
            _       => MaxQuestionsLegacy,
        };

        if (session.Attempts.Count >= maxQ)
            return null;

        var attemptedInSession = session.Attempts.Select(a => a.QuestionId).ToList();

        // Build the "already seen in last 2 prior sessions" exclusion set (Problem 3)
        var recentSessionIds = await _context.QuizSessions
            .Where(s => s.UserId == session.UserId
                     && s.CourseId == session.CourseId
                     && s.ModuleId == session.ModuleId
                     && s.Id != session.Id
                     && !s.IsActive)
            .OrderByDescending(s => s.StartTime)
            .Take(2)
            .Select(s => s.Id)
            .ToListAsync();

        var seenInRecentSessions = recentSessionIds.Count > 0
            ? await _context.QuizAttempts
                .Where(a => recentSessionIds.Contains(a.SessionId))
                .Select(a => a.QuestionId)
                .Distinct()
                .ToListAsync()
            : new List<int>();

        // Base query: correct course, correct module (if set)
        IQueryable<Question> baseQ = _context.Questions
            .Include(q => q.Answers)
            .Where(q => q.CourseId == session.CourseId)
            .Where(q => !attemptedInSession.Contains(q.Id));

        if (session.ModuleId.HasValue)
            baseQ = baseQ.Where(q => q.ModuleId == session.ModuleId);

        // Try with anti-repeat exclusion
        var question = await baseQ
            .Where(q => !seenInRecentSessions.Contains(q.Id))
            .Where(q => q.DifficultyLevel == session.CurrentDifficulty)
            .OrderBy(_ => Guid.NewGuid())
            .FirstOrDefaultAsync();

        // Nearest difficulty, still anti-repeat
        if (question == null)
        {
            question = await baseQ
                .Where(q => !seenInRecentSessions.Contains(q.Id))
                .OrderBy(q => Math.Abs(q.DifficultyLevel - session.CurrentDifficulty))
                .ThenBy(_ => Guid.NewGuid())
                .FirstOrDefaultAsync();
        }

        // Pool exhausted — allow repeats from recent sessions
        if (question == null)
        {
            _logger.LogInformation("♻️ Allowing repeats from recent sessions for session {SessionId}", sessionId);
            question = await baseQ
                .Where(q => q.DifficultyLevel == session.CurrentDifficulty)
                .OrderBy(_ => Guid.NewGuid())
                .FirstOrDefaultAsync()
                ?? await baseQ
                    .OrderBy(q => Math.Abs(q.DifficultyLevel - session.CurrentDifficulty))
                    .ThenBy(_ => Guid.NewGuid())
                    .FirstOrDefaultAsync();
        }

        if (question == null) return null;

        object? dragDropData = null;
        if (question.QuestionType == "dragdrop" && question.DragDropDataJson != null)
            dragDropData = JsonSerializer.Deserialize<object>(question.DragDropDataJson);

        return new QuestionDto
        {
            QuestionId    = question.Id,
            Text          = question.Text,
            DifficultyLevel = question.DifficultyLevel,
            QuestionType  = question.QuestionType,
            DragDropData  = dragDropData,
            Answers       = question.Answers.Select(a => new AnswerOptionDto
            {
                AnswerId = a.Id,
                Text     = a.Text,
            }).ToList(),
        };
    }

    // ── Problem 1: mini quiz skips adaptive difficulty ────────────────────────

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

            var answer = await _context.Answers.FirstOrDefaultAsync(a => a.Id == dto.SelectedAnswerId);
            if (answer == null)
                throw new Exception($"Answer with ID {dto.SelectedAnswerId} not found");

            isCorrect = answer.IsCorrect;
            selectedAnswerId = dto.SelectedAnswerId;
        }

        var attempt = new QuizAttempt
        {
            SessionId       = dto.SessionId,
            QuestionId      = dto.QuestionId,
            SelectedAnswerId = selectedAnswerId,
            IsCorrect       = isCorrect,
            TimeSpentSeconds = dto.TimeSpentSeconds,
            Timestamp       = DateTime.UtcNow,
        };

        _context.QuizAttempts.Add(attempt);
        await _context.SaveChangesAsync();

        // Reload with full attempt data
        session = await _context.QuizSessions
            .Include(s => s.Attempts)
                .ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(s => s.Id == dto.SessionId)
            ?? throw new Exception("Session lost after save");

        // Mini quiz: fixed difficulty, no ML
        int newDifficulty;
        if (session.QuizType == "mini")
        {
            newDifficulty = session.CurrentDifficulty;
        }
        else
        {
            newDifficulty = await GetAdaptiveDifficultyAsync(session, question.DifficultyLevel);
            session.CurrentDifficulty = newDifficulty;
            await _context.SaveChangesAsync();
        }

        return new SubmitAnswerResultDto
        {
            IsCorrect     = isCorrect,
            NewDifficulty = newDifficulty,
            Feedback      = isCorrect ? "Correct!" : "Incorrect. Try again!",
        };
    }

    // ── Problem 2: clean exit ────────────────────────────────────────────────

    public async Task EndSessionAsync(int sessionId)
    {
        var session = await _context.QuizSessions.FindAsync(sessionId);
        if (session == null) return;

        session.IsActive = false;
        session.EndTime  = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("🚪 Session {SessionId} ended (possibly mid-quiz)", sessionId);
    }

    // ── Adaptive difficulty helpers (unchanged) ───────────────────────────────

    private async Task<int> GetAdaptiveDifficultyAsync(QuizSession session, int lastQuestionDifficulty)
    {
        var recentAttempts = session.Attempts
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .Select(a => new AttemptInfo(
                a.QuestionId,
                a.Question?.DifficultyLevel ?? lastQuestionDifficulty,
                a.IsCorrect,
                a.TimeSpentSeconds))
            .ToList();

        if (session.Attempts.Count <= 3)
        {
            _logger.LogInformation("🔥 Warm-up period, keeping difficulty stable");
            return session.CurrentDifficulty;
        }

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
                "Intermediate");

            if (mlPrediction.HasValue)
            {
                var validated = ValidateDifficulty(mlPrediction.Value, session.CurrentDifficulty);
                _logger.LogInformation("🤖 ML: {Raw} → Validated: {Final}", mlPrediction.Value, validated);
                return validated;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ ML service error");
        }

        _logger.LogInformation("📊 Using rule-based adaptation");
        return AdjustDifficulty(session);
    }

    private int ValidateDifficulty(int mlPrediction, int currentDifficulty)
    {
        _logger.LogInformation("🔍 ML raw prediction: {ML}, current: {Current}", mlPrediction, currentDifficulty);

        if (mlPrediction < 3)
        {
            _logger.LogWarning("⚠️ ML predicted {ML} < 3, clamping to 3", mlPrediction);
            mlPrediction = 3;
        }

        const int maxChange = 2;
        if (mlPrediction > currentDifficulty + maxChange)
        {
            _logger.LogWarning("⚠️ ML jump too high: {ML} → {Clamped}", mlPrediction, currentDifficulty + maxChange);
            mlPrediction = currentDifficulty + maxChange;
        }
        if (mlPrediction < currentDifficulty - maxChange)
        {
            _logger.LogWarning("⚠️ ML drop too low: {ML} → {Clamped}", mlPrediction, currentDifficulty - maxChange);
            mlPrediction = currentDifficulty - maxChange;
        }

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
        double avgTime  = recentAttempts.Average(a => a.TimeSpentSeconds);

        var newDifficulty = session.CurrentDifficulty;

        if (accuracy >= 0.8 && avgTime < 30)
            newDifficulty = Math.Min(session.CurrentDifficulty + 1, 10);
        else if (accuracy >= 0.6 && accuracy < 0.8)
            newDifficulty = avgTime < 20 ? Math.Min(session.CurrentDifficulty + 1, 10) : session.CurrentDifficulty;
        else if (accuracy >= 0.4)
            newDifficulty = session.CurrentDifficulty;
        else
            newDifficulty = Math.Max(session.CurrentDifficulty - 1, 3);

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

        var total   = session.Attempts.Count;
        var correct = session.Attempts.Count(a => a.IsCorrect);

        return new SessionStatsDto
        {
            TotalQuestions   = total,
            CorrectAnswers   = correct,
            Accuracy         = total > 0 ? (double)correct / total * 100 : 0,
            CurrentDifficulty = session.CurrentDifficulty,
            FinalDifficulty  = session.CurrentDifficulty,
        };
    }
}
