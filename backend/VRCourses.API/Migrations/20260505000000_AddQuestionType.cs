using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VRCourses.API.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QuestionType",
                table: "Questions",
                type: "text",
                nullable: false,
                defaultValue: "mcq");

            migrationBuilder.AddColumn<string>(
                name: "DragDropDataJson",
                table: "Questions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DragDropDataJson",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "QuestionType",
                table: "Questions");
        }
    }
}
