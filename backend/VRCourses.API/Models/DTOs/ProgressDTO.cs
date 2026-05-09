namespace VRCourses.API.Models.DTOs;

public record MarkLessonCompleteDto(
    int LessonId,
    int CourseId,
    int ModuleId
);

public record SubmitMiniQuizDto(
    int ModuleId,
    int CourseId,
    List<MiniQuizAnswerSubmitDto> Answers
);

public record MiniQuizAnswerSubmitDto(
    int QuestionId,
    int? SelectedAnswerId,
    bool? DragDropIsCorrect
);

public record MiniQuizResultDto(
    bool Passed,
    int Score,
    int PassingScore,
    int CorrectAnswers,
    int TotalQuestions,
    bool NextModuleUnlocked
);

public record LessonProgressDto(
    int LessonId,
    bool IsCompleted,
    DateTime? CompletedAt
);

public record ModuleProgressDto(
    int ModuleId,
    bool IsLocked,
    bool MiniQuizPassed,
    List<LessonProgressDto> Lessons
);

public record CourseProgressDto(
    int CourseId,
    int TotalLessons,
    int CompletedLessons,
    bool FinalQuizUnlocked,
    List<ModuleProgressDto> Modules
);
