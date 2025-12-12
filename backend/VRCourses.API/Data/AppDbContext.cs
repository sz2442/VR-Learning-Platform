using Microsoft.EntityFrameworkCore;
using VRCourses.API.Models.Entities;

namespace VRCourses.API.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Course> Courses { get; set; }
    
    // 🆕 Добавить:
    public DbSet<Question> Questions { get; set; }
    public DbSet<Answer> Answers { get; set; }
    public DbSet<QuizSession> QuizSessions { get; set; }
    public DbSet<QuizAttempt> QuizAttempts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Уникальный email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        
        // 🆕 Relationships
        modelBuilder.Entity<Question>()
            .HasOne(q => q.Course)
            .WithMany()
            .HasForeignKey(q => q.CourseId);
        
        modelBuilder.Entity<Answer>()
            .HasOne(a => a.Question)
            .WithMany(q => q.Answers)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<QuizSession>()
            .HasOne(qs => qs.User)
            .WithMany(u => u.QuizSessions)
            .HasForeignKey(qs => qs.UserId);
        
        modelBuilder.Entity<QuizSession>()
            .HasOne(qs => qs.Course)
            .WithMany()
            .HasForeignKey(qs => qs.CourseId);
        
        modelBuilder.Entity<QuizAttempt>()
            .HasOne(qa => qa.Session)
            .WithMany(qs => qs.Attempts)
            .HasForeignKey(qa => qa.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}