using Microsoft.EntityFrameworkCore;
using VRCourses.API.Models.Entities;

namespace VRCourses.API.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<Answer> Answers { get; set; }
    public DbSet<QuizSession> QuizSessions { get; set; }
    public DbSet<QuizAttempt> QuizAttempts { get; set; }

    // Course structure
    public DbSet<Module> Modules { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<MiniQuiz> MiniQuizzes { get; set; }
    public DbSet<StudentProgress> StudentProgress { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Question>()
            .HasOne(q => q.Course)
            .WithMany()
            .HasForeignKey(q => q.CourseId);

        modelBuilder.Entity<Question>()
            .HasOne(q => q.Module)
            .WithMany(m => m.Questions)
            .HasForeignKey(q => q.ModuleId)
            .IsRequired(false);

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

        // Module
        modelBuilder.Entity<Module>()
            .HasOne(m => m.Course)
            .WithMany()
            .HasForeignKey(m => m.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Lesson
        modelBuilder.Entity<Lesson>()
            .HasOne(l => l.Module)
            .WithMany(m => m.Lessons)
            .HasForeignKey(l => l.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        // MiniQuiz — one per module
        modelBuilder.Entity<MiniQuiz>()
            .HasOne(mq => mq.Module)
            .WithOne(m => m.MiniQuiz)
            .HasForeignKey<MiniQuiz>(mq => mq.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MiniQuiz>()
            .HasIndex(mq => mq.ModuleId)
            .IsUnique();

        // StudentProgress
        modelBuilder.Entity<StudentProgress>()
            .HasOne(sp => sp.User)
            .WithMany()
            .HasForeignKey(sp => sp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentProgress>()
            .HasOne(sp => sp.Course)
            .WithMany()
            .HasForeignKey(sp => sp.CourseId);

        // Unique: one progress record per user+course+module+lesson+type
        modelBuilder.Entity<StudentProgress>()
            .HasIndex(sp => new { sp.UserId, sp.CourseId, sp.ModuleId, sp.LessonId, sp.ProgressType })
            .IsUnique();
    }
}
