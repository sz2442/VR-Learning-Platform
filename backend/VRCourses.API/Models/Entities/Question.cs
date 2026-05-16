namespace VRCourses.API.Models.Entities;

public class Question
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int? ModuleId { get; set; }          // null for legacy questions
    public string Text { get; set; } = string.Empty;
    public int DifficultyLevel { get; set; }    // 1-10
    public string Category { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string QuestionType { get; set; } = "mcq";       // "mcq" | "dragdrop"
    public string? DragDropDataJson { get; set; } = null;
    public string? QuizType { get; set; } = null;           // "miniquiz" | "finalquiz" | null

    public Course Course { get; set; } = null!;
    public Module? Module { get; set; }
    public List<Answer> Answers { get; set; } = new();
}

