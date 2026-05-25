using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroserviceB.API.Migrations
{
    /// <summary>
    /// Sprint 2 - HU5: anade tabla TicketActions + columnas AssignedTechnicianId
    /// y LastEscalationCheck al Ticket (introducidas por HU3 y reforzadas en Sprint 2).
    /// </summary>
    public partial class AddTicketActions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Asegurar columnas en Tickets
            migrationBuilder.AddColumn<int>(
                name: "AssignedTechnicianId",
                table: "Tickets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastEscalationCheck",
                table: "Tickets",
                type: "datetime2",
                nullable: true);

            // Tabla nueva TicketActions
            migrationBuilder.CreateTable(
                name: "TicketActions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    UserFullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FromValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ToValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketActions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TicketActions_TicketId",
                table: "TicketActions",
                column: "TicketId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "TicketActions");
            migrationBuilder.DropColumn(name: "LastEscalationCheck", table: "Tickets");
            migrationBuilder.DropColumn(name: "AssignedTechnicianId", table: "Tickets");
        }
    }
}
