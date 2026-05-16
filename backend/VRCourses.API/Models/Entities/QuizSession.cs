namespace VRCourses.API.Models.Entities;

public class QuizSession
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public int? ModuleId { get; set; }      // null → course-level (legacy /vr-test)
    public string? QuizType { get; set; }   // "mini" | "final" | null
    public int CurrentDifficulty { get; set; } = 5;
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public User User { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public List<QuizAttempt> Attempts { get; set; } = new();
}