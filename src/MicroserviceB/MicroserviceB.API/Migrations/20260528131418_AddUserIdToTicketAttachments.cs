using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroserviceB.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToTicketAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "TicketAttachments",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "TicketAttachments");
        }
    }
}
