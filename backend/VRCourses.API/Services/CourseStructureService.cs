using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using VRCourses.API.Data;
using VRCourses.API.Models.DTOs;
using VRCourses.API.Services.Interfaces;

namespace VRCourses.API.Services;

public class CourseStructureService : ICourseStructureService
{
    private readonly AppDbContext _context;

    public CourseStructureService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CourseStructureDto?> GetCourseStructureAsync(int courseId, int userId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return null;

        var modules = await _context.Modules
            .Where(m => m.CourseId == courseId)
            .OrderBy(m => m.OrderIndex)
            .Include(m => m.Lessons.OrderBy(l => l.OrderIndex))
            .Include(m => m.MiniQuiz)
            .ToListAsync();

        var completedLessonIds = await _context.StudentProgress
            .Where(sp => sp.UserId == userId && sp.CourseId == courseId && sp.ProgressType == "lesson" && sp.IsCompleted)
            .Select(sp => sp.LessonId)
            .ToListAsync();

        var passedMiniQuizModuleIds = await _context.StudentProgress
            .Where(sp => sp.UserId == userId && sp.CourseId == courseId && sp.ProgressType == "miniquiz" && sp.IsCompleted)
            .Select(sp => sp.ModuleId)
            .ToListAsync();

        var moduleDtos = new List<ModuleDto>();
        for (int i = 0; i < modules.Count; i++)
        {
            var module = modules[i];
            // Module 0 is always unlocked; subsequent modules unlock when previous mini quiz is passed
            bool isLocked = i > 0 && !passedMiniQuizModuleIds.Contains(modules[i - 1].Id);

            var lessons = module.Lessons.Select(l => new LessonSummaryDto(
                l.Id,
                l.Title,
                l.OrderIndex,
                completedLessonIds.Contains(l.Id)
            )).ToList();

            MiniQuizSummaryDto? miniQuizDto = null;
            if (module.MiniQuiz != null)
            {
                miniQuizDto = new MiniQuizSummaryDto(
                    module.MiniQuiz.Id,
                    module.MiniQuiz.PassingScore,
                    module.MiniQuiz.IsRequired,
                    passedMiniQuizModuleIds.Contains(module.Id)
                );
            }

            moduleDtos.Add(new ModuleDto(module.Id, module.Title, module.Description, module.OrderIndex, isLocked, lessons, miniQuizDto));
        }

        bool allModulesComplete = modules.All(m => passedMiniQuizModuleIds.Contains(m.Id));
        bool hasFinalQuiz = await _context.Questions
            .AnyAsync(q => q.CourseId == courseId && q.QuizType == "finalquiz");

        int totalLessons = modules.Sum(m => m.Lessons.Count);
        int completedLessons = modules.SelectMany(m => m.Lessons).Count(l => completedLessonIds.Contains(l.Id));

        return new CourseStructureDto(courseId, course.Title, moduleDtos, hasFinalQuiz, allModulesComplete, totalLessons, completedLessons);
    }

    public async Task<LessonContentDto?> GetLessonContentAsync(int lessonId)
    {
        var lesson = await _context.Lessons.FindAsync(lessonId);
        if (lesson == null) return null;

        return new LessonContentDto(lesson.Id, lesson.ModuleId, lesson.Title, lesson.ContentText, lesson.VideoUrl, lesson.OrderIndex);
    }

    public async Task<List<MiniQuizQuestionDto>> GetMiniQuizQuestionsAsync(int moduleId)
    {
        var questions = await _context.Questions
            .Where(q => q.ModuleId == moduleId && q.QuizType == "miniquiz")
            .Include(q => q.Answers)
            .OrderBy(q => q.Id)
            .ToListAsync();

        return questions.Select(q =>
        {
            object? dragDropData = null;
            if (q.QuestionType == "dragdrop" && q.DragDropDataJson != null)
                dragDropData = JsonSerializer.Deserialize<object>(q.DragDropDataJson);

            return new MiniQuizQuestionDto(
                q.Id,
                q.Text,
                q.DifficultyLevel,
                q.QuestionType,
                dragDropData,
                q.Answers.Select(a => new MiniQuizAnswerDto(a.Id, a.Text)).ToList()
            );
        }).ToList();
    }
}
