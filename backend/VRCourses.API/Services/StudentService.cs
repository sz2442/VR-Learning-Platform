using Microsoft.EntityFrameworkCore;
using VRCourses.API.Data;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class StudentService : IStudentService
{
    private readonly AppDbContext _context;

    public StudentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StudentStatsDto> GetStatsAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);

        var sessions = await _context.QuizSessions
            .Where(s => s.UserId == userId)
            .Include(s => s.Attempts)
            .Include(s => s.Course)
            .ToListAsync();

        var allAttempts = sessions.SelectMany(s => s.Attempts).ToList();
        int totalQuestions = allAttempts.Count;
        double avgAccuracy = totalQuestions == 0
            ? 0
            : Math.Round((double)allAttempts.Count(a => a.IsCorrect) / totalQuestions * 100, 1);

        int totalMinutes = sessions
            .Where(s => s.EndTime.HasValue)
            .Sum(s => (int)(s.EndTime!.Value - s.StartTime).TotalMinutes);

        int bestDifficulty = sessions.Count == 0 ? 0 : sessions.Max(s => s.CurrentDifficulty);

        // Favorite = course with most attempts
        string favoriteCategory = sessions
            .GroupBy(s => s.Course.Title)
            .OrderByDescending(g => g.SelectMany(s => s.Attempts).Count())
            .Select(g => g.Key)
            .FirstOrDefault() ?? "—";

        // Streak: count consecutive days (ending today) with at least one session
        int streak = 0;
        var today = DateTime.UtcNow.Date;
        var sessionDays = sessions
            .Select(s => s.StartTime.Date)
            .Distinct()
            .ToHashSet();

        for (var day = today; sessionDays.Contains(day); day = day.AddDays(-1))
            streak++;

        return new StudentStatsDto
        {
            TotalSessions = sessions.Count,
            TotalQuestionsAnswered = totalQuestions,
            AverageAccuracy = avgAccuracy,
            TotalTimeSpentMinutes = totalMinutes,
            CurrentStreak = streak,
            BestDifficultyReached = bestDifficulty,
            FavoriteCategory = favoriteCategory,
            MemberSince = user?.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task<List<CourseProgressSummaryDto>> GetProgressAsync(int userId)
    {
        // Courses the student has interacted with (has sessions or progress records)
        var courseIds = await _context.QuizSessions
            .Where(s => s.UserId == userId)
            .Select(s => s.CourseId)
            .Union(_context.StudentProgress
                .Where(p => p.UserId == userId)
                .Select(p => p.CourseId))
            .Distinct()
            .ToListAsync();

        var result = new List<CourseProgressSummaryDto>();

        foreach (var courseId in courseIds)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) continue;

            var modulesTotal = await _context.Modules
                .CountAsync(m => m.CourseId == courseId);

            // A module is completed when the student has a passed miniquiz record for it
            var modulesCompleted = await _context.StudentProgress
                .CountAsync(p => p.UserId == userId
                                 && p.CourseId == courseId
                                 && p.ProgressType == "miniquiz"
                                 && p.IsCompleted);

            int completionPct = modulesTotal == 0
                ? 0
                : (int)Math.Round((double)modulesCompleted / modulesTotal * 100);

            var courseSessions = await _context.QuizSessions
                .Where(s => s.UserId == userId && s.CourseId == courseId)
                .Include(s => s.Attempts)
                .ToListAsync();

            int bestDifficulty = courseSessions.Count == 0 ? 0 : courseSessions.Max(s => s.CurrentDifficulty);
            DateTime? lastSession = courseSessions.Count == 0
                ? null
                : courseSessions.Max(s => s.StartTime);

            var courseAttempts = courseSessions.SelectMany(s => s.Attempts).ToList();
            double avgAcc = courseAttempts.Count == 0
                ? 0
                : Math.Round((double)courseAttempts.Count(a => a.IsCorrect) / courseAttempts.Count * 100, 1);

            result.Add(new CourseProgressSummaryDto
            {
                CourseId = courseId,
                CourseTitle = course.Title,
                ModulesCompleted = modulesCompleted,
                ModulesTotal = modulesTotal,
                CompletionPercentage = completionPct,
                BestDifficulty = bestDifficulty,
                LastSessionDate = lastSession,
                AverageAccuracy = avgAcc
            });
        }

        return result;
    }

    public async Task<List<ActivityEntryDto>> GetActivityAsync(int userId)
    {
        var sessions = await _context.QuizSessions
            .Where(s => s.UserId == userId)
            .Include(s => s.Attempts)
            .Include(s => s.Course)
            .OrderByDescending(s => s.StartTime)
            .Take(10)
            .ToListAsync();

        return sessions.Select(s =>
        {
            var attempts = s.Attempts;
            int total = attempts.Count;
            double acc = total == 0
                ? 0
                : Math.Round((double)attempts.Count(a => a.IsCorrect) / total * 100, 1);
            int duration = s.EndTime.HasValue
                ? (int)(s.EndTime.Value - s.StartTime).TotalMinutes
                : 0;

            return new ActivityEntryDto
            {
                SessionId = s.Id,
                CourseTitle = s.Course.Title,
                Date = s.StartTime,
                QuestionsAnswered = total,
                Accuracy = acc,
                FinalDifficulty = s.CurrentDifficulty,
                DurationMinutes = duration
            };
        }).ToList();
    }

    public async Task<List<AccuracyPointDto>> GetAccuracyHistoryAsync(int userId)
    {
        var total = await _context.QuizSessions.CountAsync(s => s.UserId == userId);
        var skip = Math.Max(0, total - 10);

        var sessions = await _context.QuizSessions
            .Where(s => s.UserId == userId)
            .Include(s => s.Attempts)
            .OrderBy(s => s.StartTime)
            .Skip(skip)
            .Take(10)
            .ToListAsync();

        return sessions.Select((s, i) =>
        {
            var attempts = s.Attempts;
            int total = attempts.Count;
            double acc = total == 0
                ? 0
                : Math.Round((double)attempts.Count(a => a.IsCorrect) / total * 100, 1);

            return new AccuracyPointDto
            {
                SessionNumber = i + 1,
                Accuracy = acc,
                Difficulty = s.CurrentDifficulty
            };
        }).ToList();
    }
}
