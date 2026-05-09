namespace VRCourses.API.Models.DTOs;

public class StartSessionResultDto
{
    public int SessionId { get; set; }
    public string? QuizType { get; set; }   // "mini" | "final" | null
    public int MaxQuestions { get; set; }   // 8 mini / 20 final / 10 legacy
}

public class QuestionDto
{
    public int QuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int DifficultyLevel { get; set; }
    public string QuestionType { get; set; } = "mcq";
    public object? DragDropData { get; set; }
    public List<AnswerOptionDto> Answers { get; set; } = new();
}

public class AnswerOptionDto
{
    public int AnswerId { get; set; }
    public string Text { get; set; } = string.Empty;
}

public class SubmitAnswerDto
{
    public int SessionId { get; set; }
    public int QuestionId { get; set; }
    public int? SelectedAnswerId { get; set; }       // null for dragdrop
    public int TimeSpentSeconds { get; set; }
    public bool? DragDropIsCorrect { get; set; }     // used when QuestionType == "dragdrop"
}

public class SubmitAnswerResultDto
{
    public bool IsCorrect { get; set; }
    public int NewDifficulty { get; set; }
    public string Feedback { get; set; } = string.Empty;
}

public class SessionStatsDto
{
    public int TotalQuestions { get; set; }
    public int CorrectAnswers { get; set; }
    public double Accuracy { get; set; }
    public int CurrentDifficulty { get; set; }
    public int FinalDifficulty { get; set; }
}

public class DebugAttemptDto
{
    public int AttemptNumber { get; set; }
    public int QuestionId { get; set; }
    public bool IsCorrect { get; set; }
    public int TimeSpentSeconds { get; set; }
    public int DifficultyAtTime { get; set; }
    public DateTime Timestamp { get; set; }
}

public class DebugSessionDto
{
    public int SessionId { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public int? ModuleId { get; set; }
    public string? QuizType { get; set; }
    public int CurrentDifficulty { get; set; }
    public int TotalAttempts { get; set; }
    public int MaxQuestions { get; set; }
    public int AttemptsUntilNextCheckpoint { get; set; }
    public int CheckpointInterval { get; set; }
    public bool IsActive { get; set; }
    public DateTime StartTime { get; set; }
    public List<DebugAttemptDto> Attempts { get; set; } = new();
}