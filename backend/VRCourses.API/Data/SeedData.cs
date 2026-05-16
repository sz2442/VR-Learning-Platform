using Microsoft.EntityFrameworkCore;
using VRCourses.API.Models.Entities;

namespace VRCourses.API.Data;

public static class SeedData
{
    public static async Task SeedQuestionsAsync(AppDbContext context)
    {
        // ===== ADMIN USER =====
        if (!await context.Users.AnyAsync(u => u.Role == "Admin"))
        {
            Console.WriteLine("👤 Creating admin user...");
            context.Users.Add(new User
            {
                Email = "admin@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                FirstName = "Admin",
                LastName = "User",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            });
            await context.SaveChangesAsync();
            Console.WriteLine("✅ Admin user created: admin@test.com / admin123");
        }

        // ===== КУРС 1: Mathematics Fundamentals =====
        if (!await context.Courses.AnyAsync(c => c.Title == "Mathematics Fundamentals"))
        {
            Console.WriteLine("📚 Creating Mathematics Fundamentals course...");
            context.Courses.Add(new Course
            {
                Title = "Mathematics Fundamentals",
                Description = "Learn basic to advanced mathematical concepts through interactive VR exercises",
                ShortDescription = "Interactive math course with adaptive difficulty",
                ImageUrl = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
                DurationMinutes = 180,
                Difficulty = "Beginner",
                IsPublished = true,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
            Console.WriteLine("✅ Mathematics Fundamentals course created");
        }

        // ===== КУРС 2: История Казахстана =====
        if (!await context.Courses.AnyAsync(c => c.Title == "История Казахстана"))
        {
            Console.WriteLine("📚 Creating История Казахстана course...");
            context.Courses.Add(new Course
            {
                Title = "История Казахстана",
                ShortDescription = "Ключевые события и факты истории Казахстана от древности до наших дней",
                Description = "Курс охватывает ключевые события истории Казахстана — от образования Казахского ханства в XV веке до обретения независимости в 1991 году. Вы познакомитесь с выдающимися ханами, периодом вхождения в состав Российской империи и советской эпохой. Особое внимание уделено современной истории: принятию Конституции, переносу столицы и роли Казахстана на мировой арене.",
                ImageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
                DurationMinutes = 120,
                Difficulty = "Beginner",
                IsPublished = true,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
            Console.WriteLine("✅ История Казахстана course created");
        }

        // ===== ВОПРОСЫ: Mathematics Fundamentals =====
        var mathCourse = await context.Courses.FirstOrDefaultAsync(c => c.Title == "Mathematics Fundamentals");
        if (mathCourse != null && !await context.Questions.AnyAsync(q => q.CourseId == mathCourse.Id))
        {
            Console.WriteLine("📝 Creating Math questions...");
            context.Questions.AddRange(new List<Question>
            {
                new Question
                {
                    CourseId = mathCourse.Id,
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
                    CourseId = mathCourse.Id,
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
                    CourseId = mathCourse.Id,
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
                    CourseId = mathCourse.Id,
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
                new Question
                {
                    CourseId = mathCourse.Id,
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
                    CourseId = mathCourse.Id,
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
                    CourseId = mathCourse.Id,
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
                new Question
                {
                    CourseId = mathCourse.Id,
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
                    CourseId = mathCourse.Id,
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
                    CourseId = mathCourse.Id,
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
                    CourseId = mathCourse.Id,
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
            });
            await context.SaveChangesAsync();
            Console.WriteLine("✅ Math questions created");
        }

        // ===== ВОПРОСЫ: История Казахстана =====
        var kazakhCourse = await context.Courses.FirstOrDefaultAsync(c => c.Title == "История Казахстана");
        if (kazakhCourse == null)
        {
            Console.WriteLine("❌ История Казахстана course not found, cannot create questions");
            return;
        }

        if (await context.Questions.AnyAsync(q => q.CourseId == kazakhCourse.Id))
        {
            Console.WriteLine("ℹ️  История Казахстана questions already exist, skipping");
        }
        else
        {
            Console.WriteLine("📝 Creating История Казахстана questions...");

            var kazakhMcq = new List<Question>
            {
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "В каком году было основано Казахское ханство?",
                    DifficultyLevel = 1,
                    Category = "Казахское ханство",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "1380", IsCorrect = false },
                        new Answer { Text = "1465", IsCorrect = true },
                        new Answer { Text = "1500", IsCorrect = false },
                        new Answer { Text = "1600", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "Кто были основателями Казахского ханства?",
                    DifficultyLevel = 1,
                    Category = "Казахское ханство",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "Джучи и Бату", IsCorrect = false },
                        new Answer { Text = "Джанибек и Керей", IsCorrect = true },
                        new Answer { Text = "Аблай и Тауке", IsCorrect = false },
                        new Answer { Text = "Касым и Хакназар", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "Когда Казахстан провозгласил независимость?",
                    DifficultyLevel = 2,
                    Category = "Независимость",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "25 октября 1990", IsCorrect = false },
                        new Answer { Text = "16 декабря 1991", IsCorrect = true },
                        new Answer { Text = "12 марта 1992", IsCorrect = false },
                        new Answer { Text = "1 января 1992", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "Кто стал первым Президентом Казахстана?",
                    DifficultyLevel = 2,
                    Category = "Независимость",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "Динмухамед Кунаев", IsCorrect = false },
                        new Answer { Text = "Нурсултан Назарбаев", IsCorrect = true },
                        new Answer { Text = "Акежан Кажегельдин", IsCorrect = false },
                        new Answer { Text = "Касым-Жомарт Токаев", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "В каком году Астана была провозглашена новой столицей Казахстана?",
                    DifficultyLevel = 3,
                    Category = "Столица Астана",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "1991", IsCorrect = false },
                        new Answer { Text = "1994", IsCorrect = false },
                        new Answer { Text = "1997", IsCorrect = true },
                        new Answer { Text = "2000", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "В каком году была принята действующая Конституция Казахстана?",
                    DifficultyLevel = 3,
                    Category = "Конституция",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "1991", IsCorrect = false },
                        new Answer { Text = "1993", IsCorrect = false },
                        new Answer { Text = "1995", IsCorrect = true },
                        new Answer { Text = "1998", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "В каком году Младший жуз казахов принял российское подданство?",
                    DifficultyLevel = 4,
                    Category = "Присоединение к России",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "1680", IsCorrect = false },
                        new Answer { Text = "1731", IsCorrect = true },
                        new Answer { Text = "1765", IsCorrect = false },
                        new Answer { Text = "1800", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "Какой хан создал свод обычного права «Жеті жарғы» (Семь установлений)?",
                    DifficultyLevel = 4,
                    Category = "Казахское ханство",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "Касым-хан", IsCorrect = false },
                        new Answer { Text = "Аблай-хан", IsCorrect = false },
                        new Answer { Text = "Тауке-хан", IsCorrect = true },
                        new Answer { Text = "Кенесары-хан", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "Как официально называлась советская республика на территории Казахстана с 1936 по 1991 год?",
                    DifficultyLevel = 5,
                    Category = "Советский период",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "Казахская АССР", IsCorrect = false },
                        new Answer { Text = "Казахская ССР", IsCorrect = true },
                        new Answer { Text = "Туркестанская ССР", IsCorrect = false },
                        new Answer { Text = "Казакская АО", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "На каком испытательном полигоне СССР проводил ядерные взрывы на территории Казахстана?",
                    DifficultyLevel = 5,
                    Category = "Советский период",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "Байконурский", IsCorrect = false },
                        new Answer { Text = "Балхашский", IsCorrect = false },
                        new Answer { Text = "Семипалатинский", IsCorrect = true },
                        new Answer { Text = "Аральский", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "В каком году прошло первое ядерное испытание на Семипалатинском полигоне?",
                    DifficultyLevel = 6,
                    Category = "Советский период",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "1945", IsCorrect = false },
                        new Answer { Text = "1947", IsCorrect = false },
                        new Answer { Text = "1949", IsCorrect = true },
                        new Answer { Text = "1953", IsCorrect = false }
                    }
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "mcq",
                    Text = "Какое массовое народное выступление произошло в Алма-Ате в декабре 1986 года?",
                    DifficultyLevel = 8,
                    Category = "Советский период",
                    Answers = new List<Answer>
                    {
                        new Answer { Text = "Февральская революция", IsCorrect = false },
                        new Answer { Text = "Желтоқсан (Декабрьские события)", IsCorrect = true },
                        new Answer { Text = "Новоогарёвский процесс", IsCorrect = false },
                        new Answer { Text = "Наурызское восстание", IsCorrect = false }
                    }
                }
            };

            var kazakhDragDrop = new List<Question>
            {
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "dragdrop",
                    Text = "Расставьте события истории Казахстана в хронологическом порядке (от раннего к позднему)",
                    DifficultyLevel = 2,
                    Category = "Хронология",
                    DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Основание Казахского ханства""},{""id"":""i2"",""text"":""Присоединение Младшего жуза к Российской империи""},{""id"":""i3"",""text"":""Провозглашение Казахской ССР""},{""id"":""i4"",""text"":""Независимость Казахстана""}],""zones"":[{""id"":""z1"",""label"":""1-е (самое раннее)"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""2-е"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""3-е"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""4-е (самое позднее)"",""correctItemId"":""i4""}]}"
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "dragdrop",
                    Text = "Соотнесите год с историческим событием",
                    DifficultyLevel = 2,
                    Category = "Хронология",
                    DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""1465""},{""id"":""i2"",""text"":""1731""},{""id"":""i3"",""text"":""1991""},{""id"":""i4"",""text"":""1997""}],""zones"":[{""id"":""z1"",""label"":""Основание Казахского ханства"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Присоединение Младшего жуза к России"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Провозглашение независимости Казахстана"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Перенос столицы в Астану"",""correctItemId"":""i4""}]}"
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "dragdrop",
                    Text = "Расставьте казахских ханов в хронологическом порядке их правления",
                    DifficultyLevel = 3,
                    Category = "Казахское ханство",
                    DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Керей-хан""},{""id"":""i2"",""text"":""Касым-хан""},{""id"":""i3"",""text"":""Тауке-хан""},{""id"":""i4"",""text"":""Аблай-хан""}],""zones"":[{""id"":""z1"",""label"":""1-й (1459–1474)"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""2-й (1511–1523)"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""3-й (1680–1715)"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""4-й (1771–1781)"",""correctItemId"":""i4""}]}"
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "dragdrop",
                    Text = "Соотнесите казахского хана с его главным историческим достижением",
                    DifficultyLevel = 3,
                    Category = "Казахское ханство",
                    DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Касым-хан""},{""id"":""i2"",""text"":""Тауке-хан""},{""id"":""i3"",""text"":""Аблай-хан""},{""id"":""i4"",""text"":""Кенесары-хан""}],""zones"":[{""id"":""z1"",""label"":""Расширил ханство до наибольших границ"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Создал свод законов «Жеті жарғы»"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Балансировал между Россией и Цинским Китаем"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Возглавил национально-освободительное движение 1837–1847 гг."",""correctItemId"":""i4""}]}"
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "dragdrop",
                    Text = "Расставьте в хронологическом порядке вхождение казахских жузов в состав России",
                    DifficultyLevel = 4,
                    Category = "Присоединение к России",
                    DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Младший жуз""},{""id"":""i2"",""text"":""Средний жуз""},{""id"":""i3"",""text"":""Старший жуз""},{""id"":""i4"",""text"":""Провозглашение Казахской АССР""}],""zones"":[{""id"":""z1"",""label"":""1-е (1731)"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""2-е (1740-е)"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""3-е (1846)"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""4-е (1920)"",""correctItemId"":""i4""}]}"
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "dragdrop",
                    Text = "Соотнесите выдающуюся личность с её ролью в истории Казахстана",
                    DifficultyLevel = 4,
                    Category = "Выдающиеся личности",
                    DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Нурсултан Назарбаев""},{""id"":""i2"",""text"":""Абай Кунанбаев""},{""id"":""i3"",""text"":""Мухтар Ауэзов""},{""id"":""i4"",""text"":""Динмухамед Кунаев""}],""zones"":[{""id"":""z1"",""label"":""Первый Президент независимого Казахстана"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Великий казахский поэт и просветитель XIX века"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Автор романа-эпопеи «Путь Абая»"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Первый секретарь ЦК КП Казахстана (1960–1986)"",""correctItemId"":""i4""}]}"
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "dragdrop",
                    Text = "Соотнесите дату с историческим событием советского и постсоветского периода",
                    DifficultyLevel = 5,
                    Category = "Хронология",
                    DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""1949""},{""id"":""i2"",""text"":""1986""},{""id"":""i3"",""text"":""1995""},{""id"":""i4"",""text"":""1997""}],""zones"":[{""id"":""z1"",""label"":""Первое ядерное испытание на Семипалатинском полигоне"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Декабрьские события (Желтоқсан) в Алма-Ате"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Принятие Конституции Казахстана"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Перенос столицы в Астану"",""correctItemId"":""i4""}]}"
                },
                new Question
                {
                    CourseId = kazakhCourse.Id,
                    QuestionType = "dragdrop",
                    Text = "Соотнесите казахский исторический термин с его значением",
                    DifficultyLevel = 6,
                    Category = "Казахское ханство",
                    DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Жуз""},{""id"":""i2"",""text"":""Би""},{""id"":""i3"",""text"":""Жайлау""},{""id"":""i4"",""text"":""Жырау""}],""zones"":[{""id"":""z1"",""label"":""Крупное родоплеменное объединение казахов"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Судья-оратор, хранитель обычного права"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Летнее горное пастбище"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Певец-сказитель, исполнитель героических эпосов"",""correctItemId"":""i4""}]}"
                }
            };

            var allKazakhQuestions = new List<Question>();
            allKazakhQuestions.AddRange(kazakhMcq);
            allKazakhQuestions.AddRange(kazakhDragDrop);
            context.Questions.AddRange(allKazakhQuestions);
            await context.SaveChangesAsync();
            Console.WriteLine($"✅ Created {kazakhMcq.Count} MCQ + {kazakhDragDrop.Count} drag-drop questions for История Казахстана");
        }

        // ===== КУРС 3: Adaptive Learning and VR in Education =====
        await SeedVRCoursAsync(context);
    }

    private static async Task SeedVRCoursAsync(AppDbContext context)
    {
        if (await context.Courses.AnyAsync(c => c.Title == "Adaptive Learning and VR in Education"))
        {
            Console.WriteLine("ℹ️  VR course already exists, skipping");
            return;
        }

        Console.WriteLine("📚 Creating VR course with full module structure...");

        var vrCourse = new Course
        {
            Title = "Adaptive Learning and VR in Education",
            ShortDescription = "Explore how VR and AI-powered adaptive learning are transforming education",
            Description = "This course explores the intersection of Virtual Reality and adaptive learning technologies. You will learn how immersive VR environments enhance engagement, how machine learning algorithms personalize the learning experience, and how to design effective VR-based instructional content. Each module builds on the last, culminating in a comprehensive final assessment.",
            ImageUrl = "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&q=80",
            DurationMinutes = 150,
            Difficulty = "Intermediate",
            IsPublished = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Courses.Add(vrCourse);
        await context.SaveChangesAsync();

        // ============================
        // MODULE 1: Foundations of VR
        // ============================
        var module1 = new Module
        {
            CourseId = vrCourse.Id,
            Title = "Foundations of VR Technology",
            Description = "Understand the hardware, software, and core principles behind Virtual Reality systems used in education.",
            OrderIndex = 1
        };
        context.Modules.Add(module1);
        await context.SaveChangesAsync();

        context.Lessons.AddRange(
            new Lesson
            {
                ModuleId = module1.Id,
                Title = "What is Virtual Reality?",
                OrderIndex = 1,
                VideoUrl = "https://www.youtube.com/embed/vRoKhLAhBmE",
                ContentText = @"## What is Virtual Reality?

Virtual Reality (VR) is a simulated, three-dimensional environment that allows users to interact with a computer-generated world using specialized hardware such as head-mounted displays (HMDs), motion controllers, and tracking sensors.

### Key Components of a VR System

**Head-Mounted Display (HMD)**
The HMD is the primary device that immerses the user in a virtual environment. Modern HMDs contain:
- High-resolution displays for each eye (stereoscopic vision)
- Wide field-of-view optics
- Built-in accelerometers, gyroscopes, and positional tracking sensors

**Motion Controllers**
Controllers allow users to interact with virtual objects. They detect position and orientation in 3D space and typically include buttons, triggers, and haptic feedback.

**Positional Tracking**
Systems like inside-out tracking (using cameras on the headset) or outside-in tracking (using external base stations) map the user's physical position to the virtual world.

### A Brief History of VR

- **1960s**: Ivan Sutherland created the first HMD, called the ""Sword of Damocles""
- **1980s–90s**: Jaron Lanier coined the term ""Virtual Reality""; VPL Research commercialized early VR gear
- **2012**: Oculus Rift Kickstarter campaign reignited mainstream interest
- **2016**: Consumer VR era begins with HTC Vive, Oculus Rift CV1, and PlayStation VR
- **2019–present**: Standalone headsets (Meta Quest) make VR accessible without a PC

### Degrees of Immersion

| Type | Description | Example |
|------|-------------|---------|
| Non-immersive | Traditional screen-based simulation | Flight simulator on PC |
| Semi-immersive | Large screens + partial tracking | CAVE systems |
| Fully immersive | HMD + full body tracking | Meta Quest, Valve Index |

### Why VR for Education?

Research shows that learners retain information better when they experience it rather than read or hear it. VR enables:
- **Presence**: The feeling of ""being there"" in a virtual environment
- **Embodied learning**: Learning through physical actions (e.g., assembling a virtual engine)
- **Safe experimentation**: Practice dangerous procedures (surgery, firefighting) without real-world risk
- **Scalable access**: Students worldwide can visit the same virtual lab"
            },
            new Lesson
            {
                ModuleId = module1.Id,
                Title = "VR in Educational Contexts",
                OrderIndex = 2,
                VideoUrl = null,
                ContentText = @"## VR in Educational Contexts

Researchers and educators have documented significant benefits from integrating VR into learning environments. This lesson reviews the evidence and key use cases.

### Evidence for VR Learning Outcomes

A 2019 study by PwC found that VR learners were:
- **4× faster** to train than classroom learners
- **275% more confident** to apply skills after training
- **3.75× more emotionally connected** to the content

The concept of **experiential learning** (Kolb, 1984) positions direct experience as the most effective form of learning. VR can simulate direct experience at scale.

### Current Use Cases in Education

**Medical Training**
Medical schools use VR to simulate surgeries, anatomical dissections, and patient consultations. Students can repeat procedures without risk to real patients.

**STEM Education**
Virtual labs allow chemistry, physics, and biology experiments that would be too dangerous or expensive in real life — for example, reactions with volatile chemicals or quantum mechanics visualizations.

**History and Social Studies**
Students can ""walk through"" ancient Rome, witness historical events, or explore geographic locations they could never visit physically.

**Language Learning**
VR enables immersive language practice by placing learners in simulated social situations — ordering food in a French café, navigating a Japanese subway station.

**Special Needs Education**
VR is used for social skills training in individuals with autism spectrum disorder (ASD), providing a low-stakes environment to practice interactions.

### Challenges and Considerations

- **Cost**: HMDs range from $300 to $1,500+; content development is expensive
- **Motion sickness (cybersickness)**: Affects ~20–40% of users, especially beginners
- **Screen time concerns**: Extended VR sessions require careful management
- **Accessibility**: Students with visual impairments or vestibular disorders may not be able to use standard HMDs
- **Pedagogical alignment**: VR must be matched to clear learning objectives, not used as a novelty

### The SAMR Model Applied to VR

The SAMR model (Substitution, Augmentation, Modification, Redefinition) helps educators evaluate technology integration:

| Level | Example |
|-------|---------|
| Substitution | Watch a 360° video instead of a documentary |
| Augmentation | Interactive 3D model instead of a textbook diagram |
| Modification | Virtual group dissection replacing a physical lab |
| Redefinition | Students create and share their own VR environments |

The most educationally powerful use of VR sits at the **Redefinition** level, where tasks that were previously impossible become achievable."
            }
        );
        await context.SaveChangesAsync();

        var miniQuiz1 = new MiniQuiz { ModuleId = module1.Id, PassingScore = 70, IsRequired = true };
        context.MiniQuizzes.Add(miniQuiz1);
        await context.SaveChangesAsync();

        context.Questions.AddRange(
            // MCQ 1
            new Question { CourseId = vrCourse.Id, ModuleId = module1.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "What does HMD stand for in the context of VR hardware?", DifficultyLevel = 2, Category = "VR Fundamentals", Answers = new List<Answer> { new() { Text = "High-Memory Device", IsCorrect = false }, new() { Text = "Head-Mounted Display", IsCorrect = true }, new() { Text = "Haptic Motion Driver", IsCorrect = false }, new() { Text = "Hybrid Media Display", IsCorrect = false } } },
            // MCQ 2
            new Question { CourseId = vrCourse.Id, ModuleId = module1.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "Which tracking method uses cameras mounted on the headset itself to determine position?", DifficultyLevel = 3, Category = "VR Fundamentals", Answers = new List<Answer> { new() { Text = "Outside-in tracking", IsCorrect = false }, new() { Text = "Inside-out tracking", IsCorrect = true }, new() { Text = "Optical flow tracking", IsCorrect = false }, new() { Text = "Magnetic field tracking", IsCorrect = false } } },
            // MCQ 3
            new Question { CourseId = vrCourse.Id, ModuleId = module1.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "According to the PwC 2019 study, how much faster do VR learners train compared to classroom learners?", DifficultyLevel = 3, Category = "VR in Education", Answers = new List<Answer> { new() { Text = "2× faster", IsCorrect = false }, new() { Text = "4× faster", IsCorrect = true }, new() { Text = "10× faster", IsCorrect = false }, new() { Text = "1.5× faster", IsCorrect = false } } },
            // MCQ 4
            new Question { CourseId = vrCourse.Id, ModuleId = module1.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "Which level of the SAMR model represents tasks that were previously impossible now becoming achievable through technology?", DifficultyLevel = 4, Category = "VR in Education", Answers = new List<Answer> { new() { Text = "Substitution", IsCorrect = false }, new() { Text = "Augmentation", IsCorrect = false }, new() { Text = "Modification", IsCorrect = false }, new() { Text = "Redefinition", IsCorrect = true } } },
            // MCQ 5
            new Question { CourseId = vrCourse.Id, ModuleId = module1.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "Who coined the term 'Virtual Reality' in the 1980s?", DifficultyLevel = 3, Category = "VR History", Answers = new List<Answer> { new() { Text = "Ivan Sutherland", IsCorrect = false }, new() { Text = "Jaron Lanier", IsCorrect = true }, new() { Text = "Mark Zuckerberg", IsCorrect = false }, new() { Text = "John Carmack", IsCorrect = false } } },
            // Drag-drop 1
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module1.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each VR milestone to its correct year",
                DifficultyLevel = 3, Category = "VR History",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Oculus Rift Kickstarter""},{""id"":""i2"",""text"":""Ivan Sutherland's first HMD""},{""id"":""i3"",""text"":""Consumer VR era begins (HTC Vive, Rift CV1)""},{""id"":""i4"",""text"":""Meta Quest standalone headset""}],""zones"":[{""id"":""z1"",""label"":""1960s"",""correctItemId"":""i2""},{""id"":""z2"",""label"":""2012"",""correctItemId"":""i1""},{""id"":""z3"",""label"":""2016"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""2019–present"",""correctItemId"":""i4""}]}"
            },
            // Drag-drop 2
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module1.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each immersion type to its correct example",
                DifficultyLevel = 4, Category = "VR Fundamentals",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Flight simulator on a PC monitor""},{""id"":""i2"",""text"":""CAVE projection system""},{""id"":""i3"",""text"":""Meta Quest with full body tracking""}],""zones"":[{""id"":""z1"",""label"":""Non-immersive"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Semi-immersive"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Fully immersive"",""correctItemId"":""i3""}]}"
            },
            // Drag-drop 3
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module1.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each VR application to the correct educational domain",
                DifficultyLevel = 4, Category = "VR in Education",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Virtual surgery simulation""},{""id"":""i2"",""text"":""Social skills practice for ASD learners""},{""id"":""i3"",""text"":""Virtual chemistry lab""},{""id"":""i4"",""text"":""Walking through ancient Rome""}],""zones"":[{""id"":""z1"",""label"":""Medical Training"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Special Needs Education"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""STEM Education"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""History & Social Studies"",""correctItemId"":""i4""}]}"
            }
        );
        await context.SaveChangesAsync();

        // ============================
        // MODULE 2: Adaptive Learning Systems
        // ============================
        var module2 = new Module
        {
            CourseId = vrCourse.Id,
            Title = "Adaptive Learning Systems",
            Description = "Explore how AI and machine learning power personalized learning experiences that respond to each student's needs.",
            OrderIndex = 2
        };
        context.Modules.Add(module2);
        await context.SaveChangesAsync();

        context.Lessons.AddRange(
            new Lesson
            {
                ModuleId = module2.Id,
                Title = "What is Adaptive Learning?",
                OrderIndex = 1,
                VideoUrl = "https://www.youtube.com/embed/4V9Nf0w9hRE",
                ContentText = @"## What is Adaptive Learning?

Adaptive learning is an educational method that uses data-driven algorithms to modify the presentation of material in response to each learner's performance, preferences, and pace in real time.

### Core Concept: The Learner Model

At the heart of any adaptive system is a **learner model** — a dynamic representation of what the student knows, how fast they learn, and what kinds of errors they make.

The learner model is updated after every interaction (answering a question, completing a task, spending time on a concept) to reflect the current estimate of the student's knowledge state.

### Key Components of an Adaptive Learning System

1. **Domain Model**: The structured map of all concepts and skills to be learned, including prerequisite relationships
2. **Learner Model**: The dynamic profile of the individual student
3. **Pedagogical Model**: Rules and strategies for deciding what to present next (easier, harder, review, skip)
4. **Interface**: The UI through which the student interacts

### Intelligent Tutoring Systems (ITS)

ITS are the historical predecessors to modern adaptive learning platforms. Examples include:
- **LISP Tutor** (Carnegie Mellon, 1980s): Guided programming students step by step
- **Cognitive Tutor** (now MATHia): Widely deployed in US high schools for algebra
- **ALEKS**: Used in universities for math placement and adaptive coursework

### Zone of Proximal Development (ZPD)

Vygotsky's ZPD theory holds that learning is most effective when content is slightly above the learner's current ability — challenging but achievable. Adaptive systems operationalize this by:
- Estimating current ability (using Item Response Theory or Bayesian Knowledge Tracing)
- Selecting questions at difficulty d+1 relative to the learner's estimated level
- Adjusting dynamically as the learner progresses

### Feedback Loops in Adaptive Systems

Effective feedback in adaptive learning is:
- **Immediate**: Provided right after the learner's response
- **Specific**: Explains why an answer is correct or incorrect
- **Actionable**: Directs the learner to review specific content
- **Adaptive**: Changes based on the pattern of errors, not just the last answer

### Real-World Examples

| Platform | Domain | Adaptive Mechanism |
|----------|--------|--------------------|
| Duolingo | Language | Spaced repetition + skill decay |
| Khan Academy | Math/Science | Mastery-based unlocking |
| Coursera | Multi-domain | Deadline reminders + content recommendations |
| This Platform | VR + Courses | Difficulty adaptation via ML |"
            },
            new Lesson
            {
                ModuleId = module2.Id,
                Title = "ML Algorithms in Adaptive Systems",
                OrderIndex = 2,
                VideoUrl = null,
                ContentText = @"## ML Algorithms in Adaptive Systems

Modern adaptive learning platforms rely on a range of machine learning techniques to model learners, predict performance, and select optimal content.

### Item Response Theory (IRT)

IRT is a psychometric model that describes the relationship between a latent trait (ability) and the probability of a correct response to a specific item (question).

The key equation in the 3-parameter logistic model:
```
P(correct) = c + (1 - c) / (1 + e^(-a(θ - b)))
```
Where:
- **θ** = learner's ability
- **b** = item difficulty
- **a** = item discrimination
- **c** = guessing parameter

IRT allows us to estimate learner ability from a small number of responses and to select questions that provide maximum **information** at the learner's current ability level.

### Bayesian Knowledge Tracing (BKT)

BKT models learning as a Hidden Markov Model with two hidden states: **knows** and **doesn't know**. At each step, the model updates the probability that the learner has mastered a skill based on observed responses.

Key parameters:
- **P(L₀)**: Prior probability of knowing the skill
- **P(T)**: Probability of transitioning from not-knowing to knowing (learning rate)
- **P(S)**: Probability of a slip (knows but answers wrong)
- **P(G)**: Probability of a guess (doesn't know but answers correctly)

### Collaborative Filtering

Used in recommendation systems (Netflix, Spotify), collaborative filtering identifies learners similar to the current user and recommends content they found effective. Two approaches:
- **User-based**: Find similar learners, recommend what they succeeded with
- **Item-based**: Find similar content items, recommend those related to what the learner mastered

### Decision Trees and Random Forests

Decision trees are interpretable models used to predict whether a learner will answer a question correctly given features like:
- Prior performance on similar questions
- Time since last review
- Current session length
- Historical accuracy on this topic

**Random Forests** aggregate multiple decision trees to reduce variance and improve prediction accuracy — this is what this platform's ML module uses for difficulty adaptation.

### Deep Learning Approaches

Recent advances use recurrent neural networks (RNNs) and transformer models to capture long-term learning patterns:
- **Deep Knowledge Tracing (DKT)**: Uses LSTMs to model student knowledge state over time
- **SAINT**: Transformer-based model that separates concept and response sequences

### Model Evaluation in Adaptive Learning

Key metrics:
- **AUC-ROC**: Ability to distinguish correct from incorrect responses
- **RMSE**: Error in predicting response time or score
- **Precision/Recall**: Relevance of recommended content
- **Learning Gain**: Improvement in post-test vs. pre-test scores (ultimate educational metric)"
            }
        );
        await context.SaveChangesAsync();

        var miniQuiz2 = new MiniQuiz { ModuleId = module2.Id, PassingScore = 70, IsRequired = true };
        context.MiniQuizzes.Add(miniQuiz2);
        await context.SaveChangesAsync();

        context.Questions.AddRange(
            // MCQ 1
            new Question { CourseId = vrCourse.Id, ModuleId = module2.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "In Item Response Theory, what does the variable θ (theta) represent?", DifficultyLevel = 4, Category = "ML for Learning", Answers = new List<Answer> { new() { Text = "Item difficulty", IsCorrect = false }, new() { Text = "Guessing probability", IsCorrect = false }, new() { Text = "Learner ability", IsCorrect = true }, new() { Text = "Item discrimination", IsCorrect = false } } },
            // MCQ 2
            new Question { CourseId = vrCourse.Id, ModuleId = module2.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "Which machine learning model is described as a Hidden Markov Model with 'knows' and 'doesn't know' states?", DifficultyLevel = 5, Category = "ML for Learning", Answers = new List<Answer> { new() { Text = "Item Response Theory", IsCorrect = false }, new() { Text = "Bayesian Knowledge Tracing", IsCorrect = true }, new() { Text = "Collaborative Filtering", IsCorrect = false }, new() { Text = "Deep Knowledge Tracing", IsCorrect = false } } },
            // MCQ 3
            new Question { CourseId = vrCourse.Id, ModuleId = module2.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "Vygotsky's Zone of Proximal Development suggests that learning is most effective when content is:", DifficultyLevel = 3, Category = "Adaptive Learning Theory", Answers = new List<Answer> { new() { Text = "Far above the learner's current ability", IsCorrect = false }, new() { Text = "Exactly at the learner's current ability", IsCorrect = false }, new() { Text = "Slightly above the learner's current ability", IsCorrect = true }, new() { Text = "Well below the learner's current ability", IsCorrect = false } } },
            // MCQ 4
            new Question { CourseId = vrCourse.Id, ModuleId = module2.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "What is the primary advantage of Random Forests over a single Decision Tree?", DifficultyLevel = 5, Category = "ML for Learning", Answers = new List<Answer> { new() { Text = "Random Forests are faster to train", IsCorrect = false }, new() { Text = "Random Forests aggregate multiple trees to reduce variance", IsCorrect = true }, new() { Text = "Random Forests require less data", IsCorrect = false }, new() { Text = "Random Forests are more interpretable", IsCorrect = false } } },
            // MCQ 5
            new Question { CourseId = vrCourse.Id, ModuleId = module2.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "Which evaluation metric measures the ultimate educational effectiveness of an adaptive system?", DifficultyLevel = 4, Category = "ML for Learning", Answers = new List<Answer> { new() { Text = "AUC-ROC", IsCorrect = false }, new() { Text = "RMSE", IsCorrect = false }, new() { Text = "Learning Gain (post-test vs pre-test improvement)", IsCorrect = true }, new() { Text = "Precision/Recall", IsCorrect = false } } },
            // Drag-drop 1
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module2.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each IRT parameter to its correct meaning",
                DifficultyLevel = 5, Category = "ML for Learning",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""θ (theta)""},{""id"":""i2"",""text"":""b""},{""id"":""i3"",""text"":""a""},{""id"":""i4"",""text"":""c""}],""zones"":[{""id"":""z1"",""label"":""Learner ability"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Item difficulty"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Item discrimination"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Guessing parameter"",""correctItemId"":""i4""}]}"
            },
            // Drag-drop 2
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module2.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each adaptive learning platform to its primary adaptive mechanism",
                DifficultyLevel = 4, Category = "Adaptive Learning Theory",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Duolingo""},{""id"":""i2"",""text"":""Khan Academy""},{""id"":""i3"",""text"":""This VR Platform""}],""zones"":[{""id"":""z1"",""label"":""Spaced repetition + skill decay"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Mastery-based content unlocking"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Difficulty adaptation via ML (Random Forest)"",""correctItemId"":""i3""}]}"
            },
            // Drag-drop 3
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module2.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each BKT parameter to its definition",
                DifficultyLevel = 6, Category = "ML for Learning",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""P(L₀)""},{""id"":""i2"",""text"":""P(T)""},{""id"":""i3"",""text"":""P(S)""},{""id"":""i4"",""text"":""P(G)""}],""zones"":[{""id"":""z1"",""label"":""Prior probability of knowing the skill"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Probability of learning (transitioning to knows)"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Probability of a slip (knows but answers wrong)"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Probability of a guess (doesn't know but answers right)"",""correctItemId"":""i4""}]}"
            }
        );
        await context.SaveChangesAsync();

        // ============================
        // MODULE 3: Designing VR Learning Experiences
        // ============================
        var module3 = new Module
        {
            CourseId = vrCourse.Id,
            Title = "Designing VR Learning Experiences",
            Description = "Apply instructional design principles to create effective, engaging VR-based educational content.",
            OrderIndex = 3
        };
        context.Modules.Add(module3);
        await context.SaveChangesAsync();

        context.Lessons.AddRange(
            new Lesson
            {
                ModuleId = module3.Id,
                Title = "Instructional Design for VR",
                OrderIndex = 1,
                VideoUrl = null,
                ContentText = @"## Instructional Design for VR

Creating effective VR learning experiences requires more than technical skill — it demands a deep understanding of how people learn and how to translate pedagogical goals into immersive design decisions.

### The ADDIE Model Applied to VR

The ADDIE model (Analysis, Design, Development, Implementation, Evaluation) is the most widely used instructional design framework. Here's how each phase applies to VR:

**Analysis**
- Identify learning objectives (what should the learner be able to do after the experience?)
- Assess learner characteristics (prior knowledge, technology access, cognitive load capacity)
- Determine if VR is appropriate (not every topic benefits from immersion)

**Design**
- Map objectives to VR interactions (e.g., ""learner will perform a medical procedure"" → hand-tracking simulation)
- Define assessment strategy (formative in-experience checks vs. summative post-quiz)
- Design for accessibility (comfort settings, teleportation locomotion, adjustable text size)

**Development**
- Build 3D environments using engines like Unity or Unreal Engine
- Implement adaptive branching based on learner actions
- Conduct cognitive load analysis to avoid overwhelming the learner

**Implementation**
- Deploy to headsets or via WebXR in a browser
- Provide onboarding (how to use controllers, move, interact)
- Establish session time limits to reduce fatigue

**Evaluation**
- Collect in-experience behavioral data (where learners look, what they click, how long they pause)
- Administer post-experience assessments
- Iterate on design based on learning outcomes

### Presence and Embodiment

**Presence** is the subjective sense of ""being there"" in a virtual environment. It is a key differentiator of VR from other media. Presence is increased by:
- High display resolution and refresh rate (90Hz+)
- Low-latency tracking (< 20ms)
- Consistent audio spatialization
- Realistic physics and object interaction

**Embodiment** refers to the feeling of ownership over a virtual body. When learners see a virtual hand that responds to their movements, they begin to treat virtual objects as real. This enhances:
- Procedural learning (the muscle memory component of skill acquisition)
- Empathy exercises (inhabiting the perspective of another person or culture)

### Cognitive Load Theory in VR

Cognitive Load Theory (Sweller, 1988) identifies three types of load:
- **Intrinsic**: Complexity inherent to the content itself
- **Extraneous**: Load caused by poor instructional design (cluttered UI, unclear instructions)
- **Germane**: Load that contributes to schema formation (desirable difficulty)

VR designers should:
- Minimize extraneous load (clear, unobtrusive UI overlays)
- Manage intrinsic load (sequence complex tasks, provide worked examples first)
- Maximize germane load (require active participation, problem-solving)"
            },
            new Lesson
            {
                ModuleId = module3.Id,
                Title = "Assessment in Immersive Environments",
                OrderIndex = 2,
                VideoUrl = "https://www.youtube.com/embed/5Nq9JFE8BhE",
                ContentText = @"## Assessment in Immersive Environments

Traditional assessments (multiple choice, written exams) can feel jarring within a VR experience. Effective assessment in immersive environments is integrated into the experience itself.

### Formative vs. Summative Assessment in VR

**Formative Assessment** (ongoing, during learning)
In VR, formative assessment can be invisible to the learner:
- Track whether learners correctly complete procedural steps (e.g., hand hygiene before surgery)
- Log gaze data to determine if key content was attended to
- Record response time on embedded interactive challenges

**Summative Assessment** (end of unit or course)
Summative assessment in VR can go beyond recall:
- Simulate the full procedure the learner was trained on and evaluate performance
- Use scenario-based assessments where learners must apply knowledge to novel situations
- Provide VR-based viva (oral examination) where the learner explains their actions

### Stealth Assessment

Stealth assessment (Shute, 2011) embeds assessment within gameplay or simulation without the learner being aware they are being evaluated. In VR education:
- A medical student ""explores"" a patient's symptoms — their diagnostic choices are evaluated
- An engineering student builds a virtual bridge — structural decisions are logged and scored
- A language learner navigates a social situation — vocabulary and grammar choices are recorded

This removes test anxiety and captures more authentic performance data.

### Learning Analytics in VR

VR generates rich behavioral data that traditional assessments cannot capture:
| Data Type | What it Measures |
|-----------|-----------------|
| Gaze tracking | Attention and focus |
| Head rotation | Situational awareness |
| Controller velocity | Motor skill acquisition |
| Pause duration | Cognitive processing time |
| Navigation path | Problem-solving strategy |
| Error rate by zone | Spatial understanding |

### Assessment Design Principles for VR

1. **Align with objectives**: Each assessment moment should correspond to a specific learning objective
2. **Be unobtrusive**: Don't break immersion with pop-up quiz modals — embed evaluation in simulation actions
3. **Provide immediate feedback**: Use spatial audio, visual cues, or a virtual tutor avatar to give feedback in-world
4. **Allow retries**: VR's core value is safe failure — let learners retry procedures without penalty
5. **Export data**: Ensure assessment data flows into LRS (Learning Record Store) via xAPI for analysis

### xAPI (Experience API)

xAPI is the standard for capturing learning data from diverse sources including VR:
```json
{
  ""actor"": { ""name"": ""Jane Smith"" },
  ""verb"": { ""id"": ""http://adlnet.gov/expapi/verbs/completed"" },
  ""object"": { ""id"": ""vr://surgery-sim/hand-hygiene"" },
  ""result"": { ""score"": { ""scaled"": 0.95 }, ""success"": true }
}
```
xAPI statements flow to a Learning Record Store (LRS) like SCORM Cloud or a custom backend, enabling cross-platform learning analytics."
            }
        );
        await context.SaveChangesAsync();

        var miniQuiz3 = new MiniQuiz { ModuleId = module3.Id, PassingScore = 70, IsRequired = true };
        context.MiniQuizzes.Add(miniQuiz3);
        await context.SaveChangesAsync();

        context.Questions.AddRange(
            // MCQ 1
            new Question { CourseId = vrCourse.Id, ModuleId = module3.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "What does ADDIE stand for in instructional design?", DifficultyLevel = 3, Category = "Instructional Design", Answers = new List<Answer> { new() { Text = "Apply, Define, Develop, Implement, Evaluate", IsCorrect = false }, new() { Text = "Analysis, Design, Development, Implementation, Evaluation", IsCorrect = true }, new() { Text = "Assess, Design, Deliver, Integrate, Examine", IsCorrect = false }, new() { Text = "Analyze, Draft, Develop, Integrate, Evaluate", IsCorrect = false } } },
            // MCQ 2
            new Question { CourseId = vrCourse.Id, ModuleId = module3.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "What display refresh rate is generally considered the minimum for maintaining high presence in VR?", DifficultyLevel = 4, Category = "VR Design", Answers = new List<Answer> { new() { Text = "30Hz", IsCorrect = false }, new() { Text = "60Hz", IsCorrect = false }, new() { Text = "90Hz", IsCorrect = true }, new() { Text = "120Hz only", IsCorrect = false } } },
            // MCQ 3
            new Question { CourseId = vrCourse.Id, ModuleId = module3.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "Which type of cognitive load should VR designers aim to MINIMIZE?", DifficultyLevel = 4, Category = "Cognitive Load", Answers = new List<Answer> { new() { Text = "Intrinsic load", IsCorrect = false }, new() { Text = "Germane load", IsCorrect = false }, new() { Text = "Extraneous load", IsCorrect = true }, new() { Text = "Schema load", IsCorrect = false } } },
            // MCQ 4
            new Question { CourseId = vrCourse.Id, ModuleId = module3.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "What is xAPI (Experience API) used for in VR education?", DifficultyLevel = 5, Category = "VR Assessment", Answers = new List<Answer> { new() { Text = "Rendering 3D environments in a browser", IsCorrect = false }, new() { Text = "Capturing and transmitting learning data from diverse sources", IsCorrect = true }, new() { Text = "Compressing VR video streams", IsCorrect = false }, new() { Text = "Managing VR headset firmware updates", IsCorrect = false } } },
            // MCQ 5
            new Question { CourseId = vrCourse.Id, ModuleId = module3.Id, QuizType = "miniquiz", QuestionType = "mcq", Text = "Stealth assessment in VR is characterized by:", DifficultyLevel = 5, Category = "VR Assessment", Answers = new List<Answer> { new() { Text = "Using hidden cameras to monitor learners", IsCorrect = false }, new() { Text = "Embedding evaluation within simulation without learner awareness", IsCorrect = true }, new() { Text = "Administering surprise pop-up quizzes during the experience", IsCorrect = false }, new() { Text = "Reducing the passing score threshold without telling students", IsCorrect = false } } },
            // Drag-drop 1
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module3.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each ADDIE phase to its primary VR design activity",
                DifficultyLevel = 4, Category = "Instructional Design",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Identify learning objectives and learner characteristics""},{""id"":""i2"",""text"":""Build 3D environments in Unity/Unreal""},{""id"":""i3"",""text"":""Deploy to headsets and provide onboarding""},{""id"":""i4"",""text"":""Collect behavioral data and iterate""}],""zones"":[{""id"":""z1"",""label"":""Analysis"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Development"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Implementation"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Evaluation"",""correctItemId"":""i4""}]}"
            },
            // Drag-drop 2
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module3.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each VR data type to what it measures",
                DifficultyLevel = 5, Category = "VR Assessment",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Gaze tracking data""},{""id"":""i2"",""text"":""Controller velocity data""},{""id"":""i3"",""text"":""Pause duration data""},{""id"":""i4"",""text"":""Navigation path data""}],""zones"":[{""id"":""z1"",""label"":""Attention and focus"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Motor skill acquisition"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Cognitive processing time"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Problem-solving strategy"",""correctItemId"":""i4""}]}"
            },
            // Drag-drop 3
            new Question
            {
                CourseId = vrCourse.Id, ModuleId = module3.Id, QuizType = "miniquiz", QuestionType = "dragdrop",
                Text = "Match each cognitive load type to the correct instructional strategy",
                DifficultyLevel = 6, Category = "Cognitive Load",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Sequence complex tasks and provide worked examples""},{""id"":""i2"",""text"":""Use clear, unobtrusive UI overlays""},{""id"":""i3"",""text"":""Require active participation and problem-solving""}],""zones"":[{""id"":""z1"",""label"":""Manage Intrinsic Load"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Minimize Extraneous Load"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Maximize Germane Load"",""correctItemId"":""i3""}]}"
            }
        );
        await context.SaveChangesAsync();

        // ============================
        // FINAL QUIZ: 25 questions (15 MCQ + 10 drag-drop)
        // ============================
        var finalMcq = new List<Question>
        {
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Which component of a VR system provides stereoscopic vision by displaying a different image to each eye?", DifficultyLevel = 2, Category = "VR Hardware", Answers = new List<Answer> { new() { Text = "Motion controller", IsCorrect = false }, new() { Text = "Head-Mounted Display (HMD)", IsCorrect = true }, new() { Text = "Base station", IsCorrect = false }, new() { Text = "Haptic vest", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "What term describes the subjective feeling of 'being there' in a virtual environment?", DifficultyLevel = 3, Category = "VR Fundamentals", Answers = new List<Answer> { new() { Text = "Embodiment", IsCorrect = false }, new() { Text = "Immersion", IsCorrect = false }, new() { Text = "Presence", IsCorrect = true }, new() { Text = "Telepresence", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Cybersickness in VR is estimated to affect approximately what percentage of users?", DifficultyLevel = 4, Category = "VR in Education", Answers = new List<Answer> { new() { Text = "5–10%", IsCorrect = false }, new() { Text = "20–40%", IsCorrect = true }, new() { Text = "60–80%", IsCorrect = false }, new() { Text = "Less than 1%", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "In Bayesian Knowledge Tracing, P(S) represents:", DifficultyLevel = 5, Category = "ML for Learning", Answers = new List<Answer> { new() { Text = "The prior probability of knowing a skill", IsCorrect = false }, new() { Text = "The probability of slipping (knows but answers wrong)", IsCorrect = true }, new() { Text = "The probability of guessing correctly", IsCorrect = false }, new() { Text = "The skill transition probability", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Deep Knowledge Tracing (DKT) uses which type of neural network architecture?", DifficultyLevel = 6, Category = "ML for Learning", Answers = new List<Answer> { new() { Text = "Convolutional Neural Networks (CNN)", IsCorrect = false }, new() { Text = "Long Short-Term Memory (LSTM)", IsCorrect = true }, new() { Text = "Generative Adversarial Network (GAN)", IsCorrect = false }, new() { Text = "Radial Basis Function Network", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Which instructional design model uses Analysis, Design, Development, Implementation, and Evaluation phases?", DifficultyLevel = 3, Category = "Instructional Design", Answers = new List<Answer> { new() { Text = "SAMR", IsCorrect = false }, new() { Text = "Bloom's Taxonomy", IsCorrect = false }, new() { Text = "ADDIE", IsCorrect = true }, new() { Text = "Merrill's First Principles", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Collaborative filtering in adaptive learning recommendations is most similar to which popular technology?", DifficultyLevel = 5, Category = "ML for Learning", Answers = new List<Answer> { new() { Text = "Search engines", IsCorrect = false }, new() { Text = "Netflix / Spotify recommendation algorithms", IsCorrect = true }, new() { Text = "GPS navigation", IsCorrect = false }, new() { Text = "Spam email filters", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Which VR tracking type does NOT require external base stations?", DifficultyLevel = 3, Category = "VR Hardware", Answers = new List<Answer> { new() { Text = "Outside-in tracking", IsCorrect = false }, new() { Text = "Lighthouse tracking", IsCorrect = false }, new() { Text = "Inside-out tracking", IsCorrect = true }, new() { Text = "Magnetic tracking", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "AUC-ROC is a metric used to evaluate:", DifficultyLevel = 5, Category = "ML for Learning", Answers = new List<Answer> { new() { Text = "The visual quality of VR rendering", IsCorrect = false }, new() { Text = "A binary classifier's ability to distinguish classes", IsCorrect = true }, new() { Text = "The latency of a VR headset", IsCorrect = false }, new() { Text = "The number of completed lessons per session", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Stealth assessment is best described as:", DifficultyLevel = 4, Category = "VR Assessment", Answers = new List<Answer> { new() { Text = "Unannounced pop-up quizzes during VR sessions", IsCorrect = false }, new() { Text = "Monitoring learners without their knowledge using external cameras", IsCorrect = false }, new() { Text = "Embedding evaluation within simulation without explicit test awareness", IsCorrect = true }, new() { Text = "Reducing assessment frequency to avoid learner anxiety", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "The standard protocol for capturing and transmitting learning data from VR and other sources is:", DifficultyLevel = 5, Category = "VR Assessment", Answers = new List<Answer> { new() { Text = "SCORM 1.2", IsCorrect = false }, new() { Text = "xAPI (Experience API)", IsCorrect = true }, new() { Text = "IMS Global QTI", IsCorrect = false }, new() { Text = "LTI (Learning Tools Interoperability)", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Which cognitive load type contributes POSITIVELY to schema formation and should be maximized?", DifficultyLevel = 5, Category = "Cognitive Load", Answers = new List<Answer> { new() { Text = "Intrinsic load", IsCorrect = false }, new() { Text = "Extraneous load", IsCorrect = false }, new() { Text = "Germane load", IsCorrect = true }, new() { Text = "Working memory load", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "The 3D engine most commonly used to develop VR educational experiences is:", DifficultyLevel = 3, Category = "VR Design", Answers = new List<Answer> { new() { Text = "Blender", IsCorrect = false }, new() { Text = "Photoshop", IsCorrect = false }, new() { Text = "Unity or Unreal Engine", IsCorrect = true }, new() { Text = "Maya", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Embodiment in VR enhances which two types of learning most directly?", DifficultyLevel = 6, Category = "VR Fundamentals", Answers = new List<Answer> { new() { Text = "Declarative memory and reading comprehension", IsCorrect = false }, new() { Text = "Procedural learning and empathy exercises", IsCorrect = true }, new() { Text = "Rote memorization and logical reasoning", IsCorrect = false }, new() { Text = "Mathematical problem-solving and language acquisition", IsCorrect = false } } },
            new() { CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "mcq", Text = "Which component of an adaptive learning system contains prerequisite relationships between all concepts to be learned?", DifficultyLevel = 6, Category = "Adaptive Learning Theory", Answers = new List<Answer> { new() { Text = "Learner Model", IsCorrect = false }, new() { Text = "Domain Model", IsCorrect = true }, new() { Text = "Pedagogical Model", IsCorrect = false }, new() { Text = "Interface Component", IsCorrect = false } } }
        };

        var finalDragDrop = new List<Question>
        {
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Arrange the SAMR levels in order from lowest to highest technology integration",
                DifficultyLevel = 3, Category = "Instructional Design",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Substitution""},{""id"":""i2"",""text"":""Augmentation""},{""id"":""i3"",""text"":""Modification""},{""id"":""i4"",""text"":""Redefinition""}],""zones"":[{""id"":""z1"",""label"":""Level 1 (lowest)"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Level 2"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Level 3"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Level 4 (highest)"",""correctItemId"":""i4""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Match each adaptive learning component to its correct description",
                DifficultyLevel = 5, Category = "Adaptive Learning Theory",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Domain Model""},{""id"":""i2"",""text"":""Learner Model""},{""id"":""i3"",""text"":""Pedagogical Model""},{""id"":""i4"",""text"":""Interface""}],""zones"":[{""id"":""z1"",""label"":""Structured map of concepts and prerequisites"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Dynamic profile of the individual student"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Rules for deciding what content to present next"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""The UI through which the student interacts"",""correctItemId"":""i4""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Match each VR behavioral data type to its educational measurement purpose",
                DifficultyLevel = 5, Category = "VR Assessment",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Gaze dwell time on key object""},{""id"":""i2"",""text"":""Error rate by spatial zone""},{""id"":""i3"",""text"":""Head rotation frequency""},{""id"":""i4"",""text"":""Session abandonment point""}],""zones"":[{""id"":""z1"",""label"":""Attention to critical content"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Spatial understanding gaps"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Situational awareness"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Frustration or disengagement point"",""correctItemId"":""i4""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Match each formative assessment technique to its VR implementation",
                DifficultyLevel = 6, Category = "VR Assessment",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Track procedural step completion""},{""id"":""i2"",""text"":""Log gaze data on key content areas""},{""id"":""i3"",""text"":""Record response time on interactive challenges""},{""id"":""i4"",""text"":""Evaluate diagnostic choices in simulation""}],""zones"":[{""id"":""z1"",""label"":""Procedural accuracy check"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Content attention verification"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Processing speed measurement"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Stealth assessment via scenario"",""correctItemId"":""i4""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Match each ITS (Intelligent Tutoring System) to its domain",
                DifficultyLevel = 4, Category = "Adaptive Learning Theory",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""LISP Tutor""},{""id"":""i2"",""text"":""Cognitive Tutor / MATHia""},{""id"":""i3"",""text"":""ALEKS""}],""zones"":[{""id"":""z1"",""label"":""Programming (LISP language)"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""High school algebra"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""University math placement"",""correctItemId"":""i3""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Arrange the VR consumer timeline in chronological order",
                DifficultyLevel = 3, Category = "VR History",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Oculus Rift Kickstarter""},{""id"":""i2"",""text"":""HTC Vive & Rift CV1 launch""},{""id"":""i3"",""text"":""Jaron Lanier coins 'Virtual Reality'""},{""id"":""i4"",""text"":""Meta Quest standalone headsets""}],""zones"":[{""id"":""z1"",""label"":""1st (1980s)"",""correctItemId"":""i3""},{""id"":""z2"",""label"":""2nd (2012)"",""correctItemId"":""i1""},{""id"":""z3"",""label"":""3rd (2016)"",""correctItemId"":""i2""},{""id"":""z4"",""label"":""4th (2019–present)"",""correctItemId"":""i4""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Match each challenge of VR in education to its correct mitigation strategy",
                DifficultyLevel = 5, Category = "VR in Education",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Cybersickness""},{""id"":""i2"",""text"":""High cost of HMDs""},{""id"":""i3"",""text"":""Cognitive overload""},{""id"":""i4"",""text"":""Accessibility for visual impairments""}],""zones"":[{""id"":""z1"",""label"":""Use teleportation locomotion, limit session time"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Use WebXR on shared devices or mobile-based VR"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Apply Cognitive Load Theory, chunk content"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Provide audio narration and haptic alternatives"",""correctItemId"":""i4""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Match each ML evaluation metric to what it primarily measures",
                DifficultyLevel = 6, Category = "ML for Learning",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""AUC-ROC""},{""id"":""i2"",""text"":""RMSE""},{""id"":""i3"",""text"":""Learning Gain""},{""id"":""i4"",""text"":""Precision/Recall""}],""zones"":[{""id"":""z1"",""label"":""Classifier discrimination ability"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Prediction error magnitude"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Educational effectiveness (post vs pre)"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Relevance of recommended content"",""correctItemId"":""i4""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Match each assessment type to its characteristic in VR education",
                DifficultyLevel = 4, Category = "VR Assessment",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Formative assessment""},{""id"":""i2"",""text"":""Summative assessment""},{""id"":""i3"",""text"":""Stealth assessment""}],""zones"":[{""id"":""z1"",""label"":""Ongoing, during learning, can be invisible"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""End-of-unit, evaluates full procedure performance"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Embedded in simulation, learner unaware"",""correctItemId"":""i3""}]}"
            },
            new()
            {
                CourseId = vrCourse.Id, QuizType = "finalquiz", QuestionType = "dragdrop",
                Text = "Match each presence-enhancing factor to its technical specification",
                DifficultyLevel = 5, Category = "VR Fundamentals",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""High display refresh rate""},{""id"":""i2"",""text"":""Low-latency tracking""},{""id"":""i3"",""text"":""Spatial audio""},{""id"":""i4"",""text"":""Realistic physics""}],""zones"":[{""id"":""z1"",""label"":""90Hz or higher"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Less than 20ms"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Consistent 3D audio spatialization"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Accurate object interaction and collision"",""correctItemId"":""i4""}]}"
            }
        };

        var allFinalQuestions = new List<Question>();
        allFinalQuestions.AddRange(finalMcq);
        allFinalQuestions.AddRange(finalDragDrop);
        context.Questions.AddRange(allFinalQuestions);
        await context.SaveChangesAsync();

        Console.WriteLine($"✅ VR course seeded: 3 modules, 6 lessons, 3 mini quizzes (24 questions), 1 final quiz (25 questions)");

        await SeedTestUsersAsync(context);
    }

    // ===== TEST USERS =====
    // Credentials are printed to console on first seed so you can log in immediately.
    private static async Task SeedTestUsersAsync(AppDbContext context)
    {
        var testUsers = new[]
        {
            new { Email = "student@test.com",    FirstName = "Alex",    LastName = "Student",    Role = "Student",    Password = "student123"    },
            new { Email = "instructor@test.com", FirstName = "Maria",   LastName = "Instructor", Role = "Instructor", Password = "instructor123" },
            new { Email = "admin@test.com",      FirstName = "Admin",   LastName = "User",       Role = "Admin",      Password = "admin123"      },
        };

        bool anyCreated = false;
        foreach (var u in testUsers)
        {
            if (await context.Users.AnyAsync(x => x.Email == u.Email)) continue;

            context.Users.Add(new User
            {
                Email      = u.Email,
                FirstName  = u.FirstName,
                LastName   = u.LastName,
                Role       = u.Role,
                SkillLevel = "Beginner",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(u.Password),
                CreatedAt  = DateTime.UtcNow
            });
            anyCreated = true;
        }

        if (anyCreated)
        {
            await context.SaveChangesAsync();
            Console.WriteLine("👤 Test users seeded:");
            Console.WriteLine("   student@test.com    / student123    (Student)");
            Console.WriteLine("   instructor@test.com / instructor123 (Instructor)");
            Console.WriteLine("   admin@test.com      / admin123      (Admin)");
        }
    }
}
