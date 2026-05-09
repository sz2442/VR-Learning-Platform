using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VRCourses.API.Migrations
{
    [Migration("20260510000000_AddUserIsActive")]
    public partial class AddUserIsActive : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "IsActive", table: "Users");
        }
    }
}
