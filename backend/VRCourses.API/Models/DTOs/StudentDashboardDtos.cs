namespace VRCourses.API.Models.DTOs;

public class StudentStatsDto
{
    public int TotalSessions { get; set; }
    public int TotalQuestionsAnswered { get; set; }
    public double AverageAccuracy { get; set; }
    public int TotalTimeSpentMinutes { get; set; }
    public int CurrentStreak { get; set; }
    public int BestDifficultyReached { get; set; }
    public string FavoriteCategory { get; set; } = string.Empty;
    public DateTime MemberSince { get; set; }
}

public class CourseProgressSummaryDto
{
    public int CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public int ModulesCompleted { get; set; }
    public int ModulesTotal { get; set; }
    public int CompletionPercentage { get; set; }
    public int BestDifficulty { get; set; }
    public DateTime? LastSessionDate { get; set; }
    public double AverageAccuracy { get; set; }
}

public class ActivityEntryDto
{
    public int SessionId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int QuestionsAnswered { get; set; }
    public double Accuracy { get; set; }
    public int FinalDifficulty { get; set; }
    public int DurationMinutes { get; set; }
}

public class AccuracyPointDto
{
    public int SessionNumber { get; set; }
    public double Accuracy { get; set; }
    public int Difficulty { get; set; }
}
