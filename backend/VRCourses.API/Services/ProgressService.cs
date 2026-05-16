using Microsoft.EntityFrameworkCore;
using VRCourses.API.Data;
using VRCourses.API.Models.Entities;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class ProgressService : IProgressService
{
    private readonly AppDbContext _context;

    public ProgressService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> MarkLessonCompleteAsync(int userId, MarkLessonCompleteDto dto)
    {
        var existing = await _context.StudentProgress.FirstOrDefaultAsync(sp =>
            sp.UserId == userId &&
            sp.CourseId == dto.CourseId &&
            sp.LessonId == dto.LessonId &&
            sp.ProgressType == "lesson");

        if (existing != null)
        {
            if (existing.IsCompleted) return true;
            existing.IsCompleted = true;
            existing.CompletedAt = DateTime.UtcNow;
        }
        else
        {
            _context.StudentProgress.Add(new StudentProgress
            {
                UserId = userId,
                CourseId = dto.CourseId,
                ModuleId = dto.ModuleId,
                LessonId = dto.LessonId,
                ProgressType = "lesson",
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<MiniQuizResultDto> SubmitMiniQuizAsync(int userId, SubmitMiniQuizDto dto)
    {
        var miniQuiz = await _context.MiniQuizzes.FirstOrDefaultAsync(mq => mq.ModuleId == dto.ModuleId);
        int passingScore = miniQuiz?.PassingScore ?? 70;

        var questionIds = dto.Answers.Select(a => a.QuestionId).ToList();
        var questions = await _context.Questions
            .Where(q => questionIds.Contains(q.Id))
            .Include(q => q.Answers)
            .ToListAsync();

        int correct = 0;
        foreach (var answer in dto.Answers)
        {
            var question = questions.FirstOrDefault(q => q.Id == answer.QuestionId);
            if (question == null) continue;

            if (question.QuestionType == "dragdrop")
            {
                if (answer.DragDropIsCorrect == true) correct++;
            }
            else
            {
                var correctAnswer = question.Answers.FirstOrDefault(a => a.IsCorrect);
                if (correctAnswer != null && answer.SelectedAnswerId == correctAnswer.Id)
                    correct++;
            }
        }

        int total = dto.Answers.Count;
        int score = total > 0 ? (int)Math.Round((double)correct / total * 100) : 0;
        bool passed = score >= passingScore;

        if (passed)
        {
            var existing = await _context.StudentProgress.FirstOrDefaultAsync(sp =>
                sp.UserId == userId &&
                sp.CourseId == dto.CourseId &&
                sp.ModuleId == dto.ModuleId &&
                sp.ProgressType == "miniquiz");

            if (existing == null)
            {
                _context.StudentProgress.Add(new StudentProgress
                {
                    UserId = userId,
                    CourseId = dto.CourseId,
                    ModuleId = dto.ModuleId,
                    ProgressType = "miniquiz",
                    IsCompleted = true,
                    CompletedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }
            else if (!existing.IsCompleted)
            {
                existing.IsCompleted = true;
                existing.CompletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        // Check if the next module is now unlocked
        var modules = await _context.Modules
            .Where(m => m.CourseId == dto.CourseId)
            .OrderBy(m => m.OrderIndex)
            .ToListAsync();

        int currentIdx = modules.FindIndex(m => m.Id == dto.ModuleId);
        bool nextUnlocked = passed && currentIdx >= 0 && currentIdx < modules.Count - 1;

        return new MiniQuizResultDto(passed, score, passingScore, correct, total, nextUnlocked);
    }

    public async Task<RecordVrMiniQuizResultDto> RecordVrMiniQuizAsync(int userId, RecordVrMiniQuizDto dto)
    {
        if (dto.Passed)
        {
            var existing = await _context.StudentProgress.FirstOrDefaultAsync(sp =>
                sp.UserId == userId &&
                sp.CourseId == dto.CourseId &&
                sp.ModuleId == dto.ModuleId &&
                sp.ProgressType == "miniquiz");

            if (existing == null)
            {
                _context.StudentProgress.Add(new StudentProgress
                {
                    UserId       = userId,
                    CourseId     = dto.CourseId,
                    ModuleId     = dto.ModuleId,
                    ProgressType = "miniquiz",
                    IsCompleted  = true,
                    CompletedAt  = DateTime.UtcNow,
                });
                await _context.SaveChangesAsync();
            }
            else if (!existing.IsCompleted)
            {
                existing.IsCompleted = true;
                existing.CompletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        var modules = await _context.Modules
            .Where(m => m.CourseId == dto.CourseId)
            .OrderBy(m => m.OrderIndex)
            .ToListAsync();

        int idx          = modules.FindIndex(m => m.Id == dto.ModuleId);
        bool nextUnlocked = dto.Passed && idx >= 0 && idx < modules.Count - 1;

        return new RecordVrMiniQuizResultDto(dto.Passed, nextUnlocked);
    }

    public async Task<CourseProgressDto?> GetCourseProgressAsync(int userId, int courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return null;

        var modules = await _context.Modules
            .Where(m => m.CourseId == courseId)
            .OrderBy(m => m.OrderIndex)
            .Include(m => m.Lessons.OrderBy(l => l.OrderIndex))
            .ToListAsync();

        var progressRecords = await _context.StudentProgress
            .Where(sp => sp.UserId == userId && sp.CourseId == courseId)
            .ToListAsync();

        var completedLessonIds = progressRecords
            .Where(sp => sp.ProgressType == "lesson" && sp.IsCompleted)
            .Select(sp => sp.LessonId)
            .ToHashSet();

        var passedModuleIds = progressRecords
            .Where(sp => sp.ProgressType == "miniquiz" && sp.IsCompleted)
            .Select(sp => sp.ModuleId)
            .ToHashSet();

        var moduleDtos = new List<ModuleProgressDto>();
        for (int i = 0; i < modules.Count; i++)
        {
            var module = modules[i];
            bool isLocked = i > 0 && !passedModuleIds.Contains(modules[i - 1].Id);

            var lessonDtos = module.Lessons.Select(l =>
            {
                var rec = progressRecords.FirstOrDefault(sp => sp.LessonId == l.Id && sp.ProgressType == "lesson");
                return new LessonProgressDto(l.Id, rec?.IsCompleted ?? false, rec?.CompletedAt);
            }).ToList();

            moduleDtos.Add(new ModuleProgressDto(module.Id, isLocked, passedModuleIds.Contains(module.Id), lessonDtos));
        }

        bool allPassed = modules.All(m => passedModuleIds.Contains(m.Id));
        int totalLessons = modules.Sum(m => m.Lessons.Count);
        int completedLessons = modules.SelectMany(m => m.Lessons).Count(l => completedLessonIds.Contains(l.Id));

        return new CourseProgressDto(courseId, totalLessons, completedLessons, allPassed, moduleDtos);
    }
}
