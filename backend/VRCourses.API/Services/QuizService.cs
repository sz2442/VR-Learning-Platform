using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VRCourses.API.Data;
using VRCourses.API.Hubs;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Models.Entities;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class QuizService : IQuizService
{
    private readonly AppDbContext _context;
    private readonly IMlService _mlService;
    private readonly IHubContext<QuizHub> _hubContext;
    private readonly ILogger<QuizService> _logger;

    private const int MaxQuestionsMini   = 8;
    private const int MaxQuestionsFinal  = 20;
    private const int MaxQuestionsLegacy = 10;
    private const int CheckpointInterval = 10;

    public QuizService(
        AppDbContext context,
        IMlService mlService,
        IHubContext<QuizHub> hubContext,
        ILogger<QuizService> logger)
    {
        _context = context;
        _mlService = mlService;
        _hubContext = hubContext;
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
            "{{\"event\":\"session_started\",\"session_id\":{SessionId},\"user_id\":{UserId},\"course_id\":{CourseId},\"module_id\":{ModuleId},\"quiz_type\":\"{QuizType}\",\"max_questions\":{MaxQ}}}",
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

        // Base query: correct course, correct module (if set), correct quiz type
        IQueryable<Question> baseQ = _context.Questions
            .Include(q => q.Answers)
            .Where(q => q.CourseId == session.CourseId)
            .Where(q => !attemptedInSession.Contains(q.Id));

        if (session.ModuleId.HasValue)
            baseQ = baseQ.Where(q => q.ModuleId == session.ModuleId);

        // Filter by quiz type so mini and final pools don't bleed into each other.
        // Legacy questions (null QuizType) are included in all session types for backwards compat.
        if (session.QuizType == "final")
            baseQ = baseQ.Where(q => q.QuizType == "finalquiz" || q.QuizType == null);
        else if (session.QuizType == "mini")
            baseQ = baseQ.Where(q => q.QuizType == "miniquiz" || q.QuizType == null);
        else
            baseQ = baseQ.Where(q => q.QuizType == null);

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
            var (difficulty, confidence, source) = await GetAdaptiveDifficultyAsync(session, question.DifficultyLevel);
            newDifficulty = difficulty;
            session.CurrentDifficulty = newDifficulty;
            await _context.SaveChangesAsync();

            // Broadcast DifficultyUpdated via SignalR to all clients in this session group
            await _hubContext.Clients
                .Group($"session_{session.Id}")
                .SendAsync("DifficultyUpdated", new
                {
                    sessionId = session.Id,
                    newDifficulty,
                    confidence,
                    source,
                    timestamp = DateTime.UtcNow,
                });

            _logger.LogInformation(
                "{{\"event\":\"difficulty_updated\",\"session_id\":{SessionId},\"new_difficulty\":{Difficulty},\"confidence\":{Confidence},\"source\":\"{Source}\"}}",
                session.Id, newDifficulty, confidence, source);
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

    // ── Adaptive difficulty ───────────────────────────────────────────────────

    private async Task<(int difficulty, double confidence, string source)> GetAdaptiveDifficultyAsync(
        QuizSession session, int lastQuestionDifficulty)
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
            _logger.LogInformation(
                "{{\"event\":\"adaptive_skip\",\"reason\":\"warmup\",\"session_id\":{SessionId}}}",
                session.Id);
            return (session.CurrentDifficulty, 0.5, "warmup");
        }

        if (recentAttempts.Count < 3)
        {
            _logger.LogInformation(
                "{{\"event\":\"adaptive_skip\",\"reason\":\"insufficient_data\",\"session_id\":{SessionId}}}",
                session.Id);
            var (d, s) = AdjustDifficulty(session);
            return (d, 0.5, s);
        }

        try
        {
            var mlResult = await _mlService.PredictDifficultyAsync(
                session.Id,
                session.CurrentDifficulty,
                recentAttempts,
                "Intermediate");

            if (mlResult != null)
            {
                var validated = ValidateDifficulty(mlResult.Difficulty, session.CurrentDifficulty);
                _logger.LogInformation(
                    "{{\"event\":\"ml_applied\",\"session_id\":{SessionId},\"raw\":{Raw},\"validated\":{Validated},\"confidence\":{Confidence},\"source\":\"{Source}\"}}",
                    session.Id, mlResult.Difficulty, validated, mlResult.Confidence, mlResult.Source);
                return (validated, mlResult.Confidence, mlResult.Source);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                "{{\"event\":\"ml_error\",\"session_id\":{SessionId},\"error\":\"{Error}\"}}",
                session.Id, ex.Message);
        }

        _logger.LogInformation(
            "{{\"event\":\"fallback_applied\",\"session_id\":{SessionId}}}",
            session.Id);
        var (fd, fs) = AdjustDifficulty(session);
        return (fd, 0.5, fs);
    }

    private int ValidateDifficulty(int mlPrediction, int currentDifficulty)
    {
        if (mlPrediction < 3) mlPrediction = 3;

        const int maxChange = 2;
        if (mlPrediction > currentDifficulty + maxChange)
            mlPrediction = currentDifficulty + maxChange;
        if (mlPrediction < currentDifficulty - maxChange)
            mlPrediction = currentDifficulty - maxChange;

        return Math.Clamp(mlPrediction, 1, 10);
    }

    private (int difficulty, string source) AdjustDifficulty(QuizSession session)
    {
        var recentAttempts = session.Attempts
            .OrderByDescending(a => a.Timestamp)
            .Take(5)
            .ToList();

        if (recentAttempts.Count < 3)
            return (session.CurrentDifficulty, "rule_based_fallback");

        double accuracy = recentAttempts.Count(a => a.IsCorrect) / (double)recentAttempts.Count;
        double avgTime  = recentAttempts.Average(a => a.TimeSpentSeconds);

        int newDifficulty = session.CurrentDifficulty;

        if (accuracy >= 0.8 && avgTime < 30)
            newDifficulty = Math.Min(session.CurrentDifficulty + 1, 10);
        else if (accuracy >= 0.6 && accuracy < 0.8)
            newDifficulty = avgTime < 20 ? Math.Min(session.CurrentDifficulty + 1, 10) : session.CurrentDifficulty;
        else if (accuracy >= 0.4)
            newDifficulty = session.CurrentDifficulty;
        else
            newDifficulty = Math.Max(session.CurrentDifficulty - 1, 3);

        _logger.LogInformation(
            "{{\"event\":\"rule_based_result\",\"session_id\":{SessionId},\"accuracy\":{Accuracy},\"avg_time\":{AvgTime},\"old_difficulty\":{Old},\"new_difficulty\":{New}}}",
            session.Id, Math.Round(accuracy, 2), Math.Round(avgTime, 1), session.CurrentDifficulty, newDifficulty);

        return (newDifficulty, "rule_based_fallback");
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

    // ── Debug session info (dev only) ─────────────────────────────────────────

    public async Task<DebugSessionDto?> GetDebugSessionAsync(int sessionId)
    {
        var session = await _context.QuizSessions
            .Include(s => s.Attempts)
                .ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return null;

        int maxQ = session.QuizType switch
        {
            "mini"  => MaxQuestionsMini,
            "final" => MaxQuestionsFinal,
            _       => MaxQuestionsLegacy,
        };

        var attempts = session.Attempts
            .OrderBy(a => a.Timestamp)
            .Select((a, idx) => new DebugAttemptDto
            {
                AttemptNumber     = idx + 1,
                QuestionId        = a.QuestionId,
                IsCorrect         = a.IsCorrect,
                TimeSpentSeconds  = a.TimeSpentSeconds,
                DifficultyAtTime  = a.Question?.DifficultyLevel ?? session.CurrentDifficulty,
                Timestamp         = a.Timestamp,
            })
            .ToList();

        int nextCheckpoint = CheckpointInterval - (session.Attempts.Count % CheckpointInterval);
        if (nextCheckpoint == CheckpointInterval) nextCheckpoint = 0;

        return new DebugSessionDto
        {
            SessionId            = session.Id,
            UserId               = session.UserId,
            CourseId             = session.CourseId,
            ModuleId             = session.ModuleId,
            QuizType             = session.QuizType,
            CurrentDifficulty    = session.CurrentDifficulty,
            TotalAttempts        = session.Attempts.Count,
            MaxQuestions         = maxQ,
            AttemptsUntilNextCheckpoint = nextCheckpoint,
            CheckpointInterval   = CheckpointInterval,
            IsActive             = session.IsActive,
            StartTime            = session.StartTime,
            Attempts             = attempts,
        };
    }
}
