// file: VRCourses.API/Data/SeedData.cs
using Microsoft.EntityFrameworkCore;
using VRCourses.API.Models.Entities;

namespace VRCourses.API.Data;

public static class SeedData
{
    public static async Task SeedQuestionsAsync(AppDbContext context)
    {
        // 1️⃣ СНАЧАЛА создать курс, если его нет
        if (!await context.Courses.AnyAsync())
        {
            Console.WriteLine("📚 Creating demo course...");
            
            var demoCourse = new Course
            {
                Title = "Mathematics Fundamentals",
                Description = "Learn basic to advanced mathematical concepts through interactive VR exercises",
                ShortDescription = "Interactive math course with adaptive difficulty",
                ImageUrl = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
                DurationMinutes = 180,
                Difficulty = "Beginner",
                IsPublished = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Courses.Add(demoCourse);
            await context.SaveChangesAsync();
            Console.WriteLine($"✅ Created demo course with ID: {demoCourse.Id}");
        }

        // 2️⃣ ПОТОМ создать вопросы
        if (await context.Questions.AnyAsync())
        {
            Console.WriteLine("ℹ️  Questions already exist, skipping seed");
            return;
        }

        Console.WriteLine("📝 Creating seed questions...");

        // Получить ID первого курса
        var course = await context.Courses.FirstOrDefaultAsync();
        if (course == null)
        {
            Console.WriteLine("❌ No courses found, cannot create questions");
            return;
        }

        var questions = new List<Question>
        {
            // Easy questions (1-3)
            new Question
            {
                CourseId = course.Id,  // ✅ Используем реальный ID
                Text = "What is 2 + 2?",
                DifficultyLevel = 1,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "3", IsCorrect = false },
                    new Answer { Text = "4", IsCorrect = true },
                    new Answer { Text = "5", IsCorrect = false },
                    new Answer { Text = "6", IsCorrect = false }
                }
            },
            new Question
            {
                CourseId = course.Id,
                Text = "What is 5 × 3?",
                DifficultyLevel = 2,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "12", IsCorrect = false },
                    new Answer { Text = "15", IsCorrect = true },
                    new Answer { Text = "18", IsCorrect = false },
                    new Answer { Text = "20", IsCorrect = false }
                }
            },
            new Question
            {
                CourseId = course.Id,
                Text = "What is 10 ÷ 2?",
                DifficultyLevel = 2,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "3", IsCorrect = false },
                    new Answer { Text = "5", IsCorrect = true },
                    new Answer { Text = "8", IsCorrect = false },
                    new Answer { Text = "12", IsCorrect = false }
                }
            },
            new Question
            {
                CourseId = course.Id,
                Text = "What is 7 + 8?",
                DifficultyLevel = 3,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "14", IsCorrect = false },
                    new Answer { Text = "15", IsCorrect = true },
                    new Answer { Text = "16", IsCorrect = false },
                    new Answer { Text = "17", IsCorrect = false }
                }
            },

            // Medium questions (4-6)
            new Question
            {
                CourseId = course.Id,
                Text = "Solve: 3x + 5 = 20. What is x?",
                DifficultyLevel = 5,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "3", IsCorrect = false },
                    new Answer { Text = "5", IsCorrect = true },
                    new Answer { Text = "7", IsCorrect = false },
                    new Answer { Text = "10", IsCorrect = false }
                }
            },
            new Question
            {
                CourseId = course.Id,
                Text = "What is 15% of 200?",
                DifficultyLevel = 4,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "20", IsCorrect = false },
                    new Answer { Text = "30", IsCorrect = true },
                    new Answer { Text = "40", IsCorrect = false },
                    new Answer { Text = "50", IsCorrect = false }
                }
            },
            new Question
            {
                CourseId = course.Id,
                Text = "What is the square root of 64?",
                DifficultyLevel = 4,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "6", IsCorrect = false },
                    new Answer { Text = "8", IsCorrect = true },
                    new Answer { Text = "10", IsCorrect = false },
                    new Answer { Text = "12", IsCorrect = false }
                }
            },

            // Hard questions (7-10)
            new Question
            {
                CourseId = course.Id,
                Text = "What is the derivative of x³ + 2x²?",
                DifficultyLevel = 8,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "3x² + 4x", IsCorrect = true },
                    new Answer { Text = "3x² + 2x", IsCorrect = false },
                    new Answer { Text = "x² + 4x", IsCorrect = false },
                    new Answer { Text = "3x + 4", IsCorrect = false }
                }
            },
            new Question
            {
                CourseId = course.Id,
                Text = "Solve: ∫(2x + 3)dx",
                DifficultyLevel = 9,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "x² + 3x + C", IsCorrect = true },
                    new Answer { Text = "2x² + 3x + C", IsCorrect = false },
                    new Answer { Text = "x² + C", IsCorrect = false },
                    new Answer { Text = "2x + C", IsCorrect = false }
                }
            },
            new Question
            {
                CourseId = course.Id,
                Text = "What is the value of sin(90°)?",
                DifficultyLevel = 6,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "0", IsCorrect = false },
                    new Answer { Text = "1", IsCorrect = true },
                    new Answer { Text = "0.5", IsCorrect = false },
                    new Answer { Text = "√2/2", IsCorrect = false }
                }
            },
            new Question
            {
                CourseId = course.Id,
                Text = "Solve quadratic equation: x² - 5x + 6 = 0",
                DifficultyLevel = 7,
                Category = "Math",
                Answers = new List<Answer>
                {
                    new Answer { Text = "x = 2 or x = 3", IsCorrect = true },
                    new Answer { Text = "x = 1 or x = 6", IsCorrect = false },
                    new Answer { Text = "x = -2 or x = -3", IsCorrect = false },
                    new Answer { Text = "x = 5 or x = 1", IsCorrect = false }
                }
            }
        };

        context.Questions.AddRange(questions);
        await context.SaveChangesAsync();

        Console.WriteLine($"✅ Created {questions.Count} questions with {questions.Sum(q => q.Answers.Count)} answers");
    }
}