namespace VRCourses.API.Models.Entities;

public class Module
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int OrderIndex { get; set; }

    public Course Course { get; set; } = null!;
    public List<Lesson> Lessons { get; set; } = new();
    public MiniQuiz? MiniQuiz { get; set; }
    public List<Question> Questions { get; set; } = new();
}
