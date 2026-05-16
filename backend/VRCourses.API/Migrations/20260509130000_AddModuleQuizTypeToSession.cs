using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VRCourses.API.Migrations
{
    [Migration("20260509130000_AddModuleQuizTypeToSession")]
    public partial class AddModuleQuizTypeToSession : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ModuleId",
                table: "QuizSessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuizType",
                table: "QuizSessions",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "ModuleId", table: "QuizSessions");
            migrationBuilder.DropColumn(name: "QuizType", table: "QuizSessions");
        }
    }
}
