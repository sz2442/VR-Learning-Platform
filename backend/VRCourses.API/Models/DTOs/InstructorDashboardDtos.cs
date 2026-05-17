namespace VRCourses.API.Models.DTOs;

public class UpdateLessonContentDto
{
    public string ContentText { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
}

public class InstructorStatsDto
{
    public int TotalStudents { get; set; }
    public int TotalCourses { get; set; }
    public double AverageAccuracy { get; set; }
    public int ActiveSessionsToday { get; set; }
}

public class InstructorStudentDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public int ModulesCompleted { get; set; }
    public int ModulesTotal { get; set; }
    public double AverageAccuracy { get; set; }
    public int BestDifficulty { get; set; }
    public DateTime? LastSessionDate { get; set; }
    public int TotalSessions { get; set; }
}

public class StudentSessionRowDto
{
    public DateTime Date { get; set; }
    public double Accuracy { get; set; }
    public int FinalDifficulty { get; set; }
    public int QuestionsAnswered { get; set; }
    public int DurationMinutes { get; set; }
}

public class WeakQuestionDto
{
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public int IncorrectCount { get; set; }
    public int TotalAttempts { get; set; }
}

public class StudentDetailDto
{
    public string Email { get; set; } = string.Empty;
    public List<StudentSessionRowDto> Sessions { get; set; } = new();
    public List<WeakQuestionDto> WeakQuestions { get; set; } = new();
}

public class CourseQuestionItemDto
{
    public int QuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int DifficultyLevel { get; set; }
    public string QuestionType { get; set; } = "mcq";
    public int TotalAttempts { get; set; }
    public double IncorrectRate { get; set; }
    public List<AnswerDto> Answers { get; set; } = new();
}

public class AnswerDto
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class CourseQuestionGroupDto
{
    public string ModuleTitle { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public List<CourseQuestionItemDto> Questions { get; set; } = new();
}

public class SaveQuestionDto
{
    public int CourseId { get; set; }
    public int? ModuleId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int DifficultyLevel { get; set; } = 5;
    public string Category { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "mcq";
    public string? QuizType { get; set; }
    public List<SaveAnswerDto> Answers { get; set; } = new();
}

public class SaveAnswerDto
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class DailyActiveDto
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}
