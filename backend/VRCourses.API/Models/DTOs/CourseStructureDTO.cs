namespace VRCourses.API.Models.DTOs;

public record LessonSummaryDto(
    int Id,
    string Title,
    int OrderIndex,
    bool IsCompleted
);

public record LessonContentDto(
    int Id,
    int ModuleId,
    string Title,
    string ContentText,
    string? VideoUrl,
    int OrderIndex
);

public record MiniQuizSummaryDto(
    int Id,
    int PassingScore,
    bool IsRequired,
    bool IsPassed
);

public record MiniQuizQuestionDto(
    int QuestionId,
    string Text,
    int DifficultyLevel,
    string QuestionType,
    object? DragDropData,
    List<MiniQuizAnswerDto> Answers
);

public record MiniQuizAnswerDto(
    int AnswerId,
    string Text
);

public record ModuleDto(
    int Id,
    string Title,
    string Description,
    int OrderIndex,
    bool IsLocked,
    List<LessonSummaryDto> Lessons,
    MiniQuizSummaryDto? MiniQuiz
);

public record CourseStructureDto(
    int CourseId,
    string Title,
    List<ModuleDto> Modules,
    bool HasFinalQuiz,
    bool FinalQuizUnlocked,
    int TotalLessons,
    int CompletedLessons
);
