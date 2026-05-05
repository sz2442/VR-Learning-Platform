namespace VRCourses.API.Models.DTOs;

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
    public int CurrentDifficulty { get; set; }  // ✅ Для промежуточных результатов
    public int FinalDifficulty { get; set; }  
}