using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroserviceC.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCodeAndEstimatedTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttentionLevel",
                table: "DamageCatalog");

            migrationBuilder.AddColumn<int>(
                name: "EstimatedTimeHours",
                table: "ServiceCatalog",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "DamageCatalog",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstimatedTimeHours",
                table: "ServiceCatalog");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "DamageCatalog");

            migrationBuilder.AddColumn<int>(
                name: "AttentionLevel",
                table: "DamageCatalog",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
