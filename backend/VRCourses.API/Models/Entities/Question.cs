namespace VRCourses.API.Models.Entities;

public class Question
{
    public int Id { get; set; }
    public int CourseId { get; set; }          // К какому курсу относится
    public string Text { get; set; } = string.Empty;
    public int DifficultyLevel { get; set; }    // 1-10
    public string Category { get; set; } = string.Empty;  // "Math", "Programming", etc
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Course Course { get; set; } = null!;
    public List<Answer> Answers { get; set; } = new();
}

