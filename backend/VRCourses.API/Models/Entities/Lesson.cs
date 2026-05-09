namespace VRCourses.API.Models.Entities;

public class Lesson
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ContentText { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public int OrderIndex { get; set; }

    public Module Module { get; set; } = null!;
}
