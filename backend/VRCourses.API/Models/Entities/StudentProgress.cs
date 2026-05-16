namespace VRCourses.API.Models.Entities;

public class StudentProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public int? ModuleId { get; set; }
    public int? LessonId { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    // "lesson" | "miniquiz"
    public string ProgressType { get; set; } = "lesson";

    public User User { get; set; } = null!;
    public Course Course { get; set; } = null!;
}
