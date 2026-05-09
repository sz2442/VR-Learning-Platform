namespace VRCourses.API.Models.Entities;

public class MiniQuiz
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public int PassingScore { get; set; } = 70;
    public bool IsRequired { get; set; } = true;

    public Module Module { get; set; } = null!;
}
