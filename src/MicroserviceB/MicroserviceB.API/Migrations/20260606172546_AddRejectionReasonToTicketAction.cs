using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroserviceB.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRejectionReasonToTicketAction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "TicketActions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "TicketActions");
        }
    }
}
