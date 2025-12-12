namespace VRCourses.API.Models.Entities;

public class Answer
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    
    // Navigation
    public Question Question { get; set; } = null!;
}