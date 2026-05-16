namespace VRCourses.API.Models.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    // 🆕 Добавить для адаптивности:
    public string SkillLevel { get; set; } = "Beginner";  // Beginner, Intermediate, Advanced
    public string Role { get; set; } = "Student";         // Student, Instructor, Admin
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public List<QuizSession> QuizSessions { get; set; } = new();
}