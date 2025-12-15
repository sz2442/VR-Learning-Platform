using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using VRCourses.API.Data;
using VRCourses.API.Services;
using VRCourses.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IQuizService, QuizService>();

// ✅ DbContext с детальным логированием
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Добавляем сервисы
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICourseService, CourseService>();

builder.Services.AddHttpClient<IMlService, MlService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MlService:BaseUrl"] ?? "http://localhost:8000");
    client.Timeout = TimeSpan.FromSeconds(5);
});

// Настройка JWT
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

// CORS для фронтенда (React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ✅ СНАЧАЛА миграции и seed (ДО app.Run())
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        Console.WriteLine("🔄 Applying database migrations...");
        await context.Database.MigrateAsync();
        Console.WriteLine("✅ Migrations applied successfully");
        
        Console.WriteLine("🌱 Seeding database...");
        await SeedData.SeedQuestionsAsync(context);
        Console.WriteLine("✅ Database seeded successfully");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "❌ An error occurred during database initialization");
        throw;
    }
}

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ✅ app.Run() в самом конце
app.Run();