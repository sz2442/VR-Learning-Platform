// file: VRCourses.API/Data/SeedData.cs
using Microsoft.EntityFrameworkCore;
using VRCourses.API.Models.Entities;

namespace VRCourses.API.Data;

public static class SeedData
{
    public static async Task SeedQuestionsAsync(AppDbContext context)
    {
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
            return;
        }

        Console.WriteLine("📝 Creating История Казахстана questions...");

        // ----- 12 MCQ вопросов -----
        var kazakhMcq = new List<Question>
        {
            // Level 1
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
            // Level 2
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
            // Level 3
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
            // Level 4
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
            // Level 5
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
            // Level 6
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
            // Level 8
            new Question
            {
                CourseId = kazakhCourse.Id,
                QuestionType = "mcq",
                Text = "Какое массовое народное выступление произошло в Алма-Ате в декабре 1986 года в ответ на смену первого секретаря ЦК КП Казахстана?",
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

        // ----- 8 DragDrop вопросов -----
        var kazakhDragDrop = new List<Question>
        {
            // DD1 (Level 2): Хронология главных событий
            new Question
            {
                CourseId = kazakhCourse.Id,
                QuestionType = "dragdrop",
                Text = "Расставьте события истории Казахстана в хронологическом порядке (от раннего к позднему)",
                DifficultyLevel = 2,
                Category = "Хронология",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Основание Казахского ханства""},{""id"":""i2"",""text"":""Присоединение Младшего жуза к Российской империи""},{""id"":""i3"",""text"":""Провозглашение Казахской ССР""},{""id"":""i4"",""text"":""Независимость Казахстана""}],""zones"":[{""id"":""z1"",""label"":""1-е (самое раннее)"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""2-е"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""3-е"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""4-е (самое позднее)"",""correctItemId"":""i4""}]}"
            },
            // DD2 (Level 2): Год → Событие
            new Question
            {
                CourseId = kazakhCourse.Id,
                QuestionType = "dragdrop",
                Text = "Соотнесите год с историческим событием",
                DifficultyLevel = 2,
                Category = "Хронология",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""1465""},{""id"":""i2"",""text"":""1731""},{""id"":""i3"",""text"":""1991""},{""id"":""i4"",""text"":""1997""}],""zones"":[{""id"":""z1"",""label"":""Основание Казахского ханства"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Присоединение Младшего жуза к России"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Провозглашение независимости Казахстана"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Перенос столицы в Астану"",""correctItemId"":""i4""}]}"
            },
            // DD3 (Level 3): Ханы в хронологическом порядке правления
            new Question
            {
                CourseId = kazakhCourse.Id,
                QuestionType = "dragdrop",
                Text = "Расставьте казахских ханов в хронологическом порядке их правления (от раннего к позднему)",
                DifficultyLevel = 3,
                Category = "Казахское ханство",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Керей-хан""},{""id"":""i2"",""text"":""Касым-хан""},{""id"":""i3"",""text"":""Тауке-хан""},{""id"":""i4"",""text"":""Аблай-хан""}],""zones"":[{""id"":""z1"",""label"":""1-й (1459–1474)"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""2-й (1511–1523)"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""3-й (1680–1715)"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""4-й (1771–1781)"",""correctItemId"":""i4""}]}"
            },
            // DD4 (Level 3): Хан → Достижение
            new Question
            {
                CourseId = kazakhCourse.Id,
                QuestionType = "dragdrop",
                Text = "Соотнесите казахского хана с его главным историческим достижением",
                DifficultyLevel = 3,
                Category = "Казахское ханство",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Касым-хан""},{""id"":""i2"",""text"":""Тауке-хан""},{""id"":""i3"",""text"":""Аблай-хан""},{""id"":""i4"",""text"":""Кенесары-хан""}],""zones"":[{""id"":""z1"",""label"":""Расширил ханство до наибольших границ, создал «Қасым ханның қасқа жолы»"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Объединил три жуза и создал свод законов «Жеті жарғы»"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Балансировал между Россией и Цинским Китаем, объединитель жузов"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Возглавил национально-освободительное движение 1837–1847 гг."",""correctItemId"":""i4""}]}"
            },
            // DD5 (Level 4): Хронология вхождения жузов в состав России
            new Question
            {
                CourseId = kazakhCourse.Id,
                QuestionType = "dragdrop",
                Text = "Расставьте в хронологическом порядке вхождение казахских жузов в состав России и следующее за этим событие",
                DifficultyLevel = 4,
                Category = "Присоединение к России",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Младший жуз""},{""id"":""i2"",""text"":""Средний жуз""},{""id"":""i3"",""text"":""Старший жуз""},{""id"":""i4"",""text"":""Провозглашение Казахской АССР""}],""zones"":[{""id"":""z1"",""label"":""1-е (1731)"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""2-е (1740-е)"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""3-е (1846)"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""4-е (1920)"",""correctItemId"":""i4""}]}"
            },
            // DD6 (Level 4): Личность → Роль в истории
            new Question
            {
                CourseId = kazakhCourse.Id,
                QuestionType = "dragdrop",
                Text = "Соотнесите выдающуюся личность с её ролью в истории Казахстана",
                DifficultyLevel = 4,
                Category = "Выдающиеся личности",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""Нурсултан Назарбаев""},{""id"":""i2"",""text"":""Абай Кунанбаев""},{""id"":""i3"",""text"":""Мухтар Ауэзов""},{""id"":""i4"",""text"":""Динмухамед Кунаев""}],""zones"":[{""id"":""z1"",""label"":""Первый Президент независимого Казахстана"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Великий казахский поэт и просветитель XIX века"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Автор романа-эпопеи «Путь Абая»"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Первый секретарь ЦК КП Казахстана (1960–1986)"",""correctItemId"":""i4""}]}"
            },
            // DD7 (Level 5): Дата → Событие (советский и новейший период)
            new Question
            {
                CourseId = kazakhCourse.Id,
                QuestionType = "dragdrop",
                Text = "Соотнесите дату с историческим событием советского и постсоветского периода",
                DifficultyLevel = 5,
                Category = "Хронология",
                DragDropDataJson = @"{""items"":[{""id"":""i1"",""text"":""1949""},{""id"":""i2"",""text"":""1986""},{""id"":""i3"",""text"":""1995""},{""id"":""i4"",""text"":""1997""}],""zones"":[{""id"":""z1"",""label"":""Первое ядерное испытание на Семипалатинском полигоне"",""correctItemId"":""i1""},{""id"":""z2"",""label"":""Декабрьские события (Желтоқсан) в Алма-Ате"",""correctItemId"":""i2""},{""id"":""z3"",""label"":""Принятие Конституции Казахстана"",""correctItemId"":""i3""},{""id"":""z4"",""label"":""Перенос столицы в Астану"",""correctItemId"":""i4""}]}"
            },
            // DD8 (Level 6): Казахский термин → Значение
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
}
