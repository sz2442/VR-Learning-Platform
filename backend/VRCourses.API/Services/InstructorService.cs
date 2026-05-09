using Microsoft.EntityFrameworkCore;
using VRCourses.API.Data;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Models.Entities;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class InstructorService : IInstructorService
{
    private readonly AppDbContext _context;

    public InstructorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<InstructorStatsDto> GetStatsAsync()
    {
        int totalStudents = await _context.Users.CountAsync(u => u.Role == "Student");
        int totalCourses = await _context.Courses.CountAsync(c => c.IsPublished);

        var allAttempts = await _context.QuizAttempts.ToListAsync();
        double avgAccuracy = allAttempts.Count == 0
            ? 0
            : Math.Round((double)allAttempts.Count(a => a.IsCorrect) / allAttempts.Count * 100, 1);

        var todayStart = DateTime.UtcNow.Date;
        int activeToday = await _context.QuizSessions
            .CountAsync(s => s.StartTime >= todayStart);

        return new InstructorStatsDto
        {
            TotalStudents = totalStudents,
            TotalCourses = totalCourses,
            AverageAccuracy = avgAccuracy,
            ActiveSessionsToday = activeToday
        };
    }

    public async Task<List<InstructorStudentDto>> GetStudentsAsync()
    {
        var students = await _context.Users
            .Where(u => u.Role == "Student")
            .ToListAsync();

        var result = new List<InstructorStudentDto>();

        foreach (var student in students)
        {
            var sessions = await _context.QuizSessions
                .Where(s => s.UserId == student.Id)
                .Include(s => s.Attempts)
                .Include(s => s.Course)
                .OrderByDescending(s => s.StartTime)
                .ToListAsync();

            if (sessions.Count == 0) continue;

            // Use the course of the most recent session
            var latestSession = sessions.First();
            var courseId = latestSession.CourseId;
            var courseTitle = latestSession.Course.Title;

            int modulesTotal = await _context.Modules.CountAsync(m => m.CourseId == courseId);
            int modulesCompleted = await _context.StudentProgress
                .CountAsync(p => p.UserId == student.Id
                                 && p.CourseId == courseId
                                 && p.ProgressType == "miniquiz"
                                 && p.IsCompleted);

            var allAttempts = sessions.SelectMany(s => s.Attempts).ToList();
            double avgAcc = allAttempts.Count == 0
                ? 0
                : Math.Round((double)allAttempts.Count(a => a.IsCorrect) / allAttempts.Count * 100, 1);

            int bestDiff = sessions.Max(s => s.CurrentDifficulty);

            result.Add(new InstructorStudentDto
            {
                UserId = student.Id,
                Email = student.Email,
                CourseTitle = courseTitle,
                ModulesCompleted = modulesCompleted,
                ModulesTotal = modulesTotal,
                AverageAccuracy = avgAcc,
                BestDifficulty = bestDiff,
                LastSessionDate = latestSession.StartTime,
                TotalSessions = sessions.Count
            });
        }

        return result.OrderByDescending(s => s.LastSessionDate).ToList();
    }

    public async Task<StudentDetailDto?> GetStudentDetailAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        var sessions = await _context.QuizSessions
            .Where(s => s.UserId == userId)
            .Include(s => s.Attempts)
                .ThenInclude(a => a.Question)
            .OrderByDescending(s => s.StartTime)
            .Take(20)
            .ToListAsync();

        var sessionRows = sessions.Select(s =>
        {
            var attempts = s.Attempts;
            int total = attempts.Count;
            double acc = total == 0 ? 0
                : Math.Round((double)attempts.Count(a => a.IsCorrect) / total * 100, 1);
            int duration = s.EndTime.HasValue
                ? (int)(s.EndTime.Value - s.StartTime).TotalMinutes : 0;

            return new StudentSessionRowDto
            {
                Date = s.StartTime,
                Accuracy = acc,
                FinalDifficulty = s.CurrentDifficulty,
                QuestionsAnswered = total,
                DurationMinutes = duration
            };
        }).ToList();

        // Weak questions: answered incorrectly ≥2 times
        var weakQuestions = sessions
            .SelectMany(s => s.Attempts)
            .Where(a => !a.IsCorrect)
            .GroupBy(a => a.QuestionId)
            .Where(g => g.Count() >= 2)
            .Select(g =>
            {
                var allForQuestion = sessions
                    .SelectMany(s => s.Attempts)
                    .Where(a => a.QuestionId == g.Key)
                    .ToList();
                return new WeakQuestionDto
                {
                    QuestionId = g.Key,
                    QuestionText = g.First().Question.Text,
                    IncorrectCount = g.Count(),
                    TotalAttempts = allForQuestion.Count
                };
            })
            .OrderByDescending(w => w.IncorrectCount)
            .Take(10)
            .ToList();

        return new StudentDetailDto
        {
            Email = user.Email,
            Sessions = sessionRows,
            WeakQuestions = weakQuestions
        };
    }

    public async Task<List<CourseQuestionGroupDto>> GetCourseQuestionsAsync(int courseId)
    {
        var modules = await _context.Modules
            .Where(m => m.CourseId == courseId)
            .OrderBy(m => m.OrderIndex)
            .ToListAsync();

        var questions = await _context.Questions
            .Where(q => q.CourseId == courseId)
            .Include(q => q.Answers)
            .ToListAsync();

        var questionIds = questions.Select(q => q.Id).ToList();

        // Attempt counts per question — load into dictionaries
        var allAttempts = await _context.QuizAttempts
            .Where(a => questionIds.Contains(a.QuestionId))
            .Select(a => new { a.QuestionId, a.IsCorrect })
            .ToListAsync();

        var totalByQ = allAttempts.GroupBy(a => a.QuestionId)
            .ToDictionary(g => g.Key, g => g.Count());
        var incorrectByQ = allAttempts.Where(a => !a.IsCorrect).GroupBy(a => a.QuestionId)
            .ToDictionary(g => g.Key, g => g.Count());

        var result = new List<CourseQuestionGroupDto>();

        // Ungrouped questions (no module / legacy)
        var ungrouped = questions.Where(q => q.ModuleId == null).ToList();
        if (ungrouped.Any())
            result.Add(BuildGroup("General", 0, ungrouped, totalByQ, incorrectByQ));

        foreach (var module in modules)
        {
            var moduleQuestions = questions.Where(q => q.ModuleId == module.Id).ToList();
            if (moduleQuestions.Any())
                result.Add(BuildGroup(module.Title, module.Id, moduleQuestions, totalByQ, incorrectByQ));
        }

        return result;
    }

    private static CourseQuestionGroupDto BuildGroup(
        string title, int moduleId,
        List<Question> questions,
        Dictionary<int, int> totalByQ,
        Dictionary<int, int> incorrectByQ)
    {
        var items = questions.Select(q =>
        {
            int total = totalByQ.GetValueOrDefault(q.Id, 0);
            int incorrect = incorrectByQ.GetValueOrDefault(q.Id, 0);
            double incorrectRate = total == 0 ? 0 : Math.Round((double)incorrect / total, 3);

            return new CourseQuestionItemDto
            {
                QuestionId = q.Id,
                Text = q.Text,
                DifficultyLevel = q.DifficultyLevel,
                QuestionType = q.QuestionType,
                TotalAttempts = total,
                IncorrectRate = incorrectRate,
                Answers = q.Answers.Select(a => new AnswerDto
                {
                    Id = a.Id,
                    Text = a.Text,
                    IsCorrect = a.IsCorrect
                }).ToList()
            };
        }).ToList();

        return new CourseQuestionGroupDto
        {
            ModuleTitle = title,
            ModuleId = moduleId,
            Questions = items
        };
    }

    public async Task<int> AddQuestionAsync(SaveQuestionDto dto)
    {
        var question = new Question
        {
            CourseId = dto.CourseId,
            ModuleId = dto.ModuleId,
            Text = dto.Text,
            DifficultyLevel = dto.DifficultyLevel,
            Category = dto.Category,
            QuestionType = dto.QuestionType,
            QuizType = dto.QuizType,
            CreatedAt = DateTime.UtcNow,
            Answers = dto.Answers.Select(a => new Answer
            {
                Text = a.Text,
                IsCorrect = a.IsCorrect
            }).ToList()
        };

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();
        return question.Id;
    }

    public async Task<bool> UpdateQuestionAsync(int questionId, SaveQuestionDto dto)
    {
        var question = await _context.Questions
            .Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == questionId);

        if (question == null) return false;

        question.Text = dto.Text;
        question.DifficultyLevel = dto.DifficultyLevel;
        question.Category = dto.Category;
        question.QuestionType = dto.QuestionType;
        question.QuizType = dto.QuizType;
        question.ModuleId = dto.ModuleId;

        // Replace answers
        _context.Answers.RemoveRange(question.Answers);
        question.Answers = dto.Answers.Select(a => new Answer
        {
            Text = a.Text,
            IsCorrect = a.IsCorrect
        }).ToList();

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<DailyActiveDto>> GetDailyActiveAsync()
    {
        var since = DateTime.UtcNow.Date.AddDays(-13);

        var sessions = await _context.QuizSessions
            .Where(s => s.StartTime >= since)
            .Select(s => new { s.StartTime, s.UserId })
            .ToListAsync();

        var result = new List<DailyActiveDto>();
        for (int i = 0; i < 14; i++)
        {
            var day = since.AddDays(i);
            var count = sessions
                .Where(s => s.StartTime.Date == day)
                .Select(s => s.UserId)
                .Distinct()
                .Count();

            result.Add(new DailyActiveDto
            {
                Date = day.ToString("MM/dd"),
                Count = count
            });
        }

        return result;
    }
}
