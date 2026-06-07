using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroserviceC.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveToKnowledgeArticles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "KnowledgeArticles",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "KnowledgeArticles");
        }
    }
}
