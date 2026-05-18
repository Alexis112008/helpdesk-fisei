using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroserviceA.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTechnicianServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tabla de servicios que puede atender cada técnico (muchos a muchos)
            migrationBuilder.CreateTable(
                name: "TechnicianServices",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TechnicianId = table.Column<int>(nullable: false), // ID del usuario técnico
                    ServiceCatalogId = table.Column<int>(nullable: false), // ID del servicio
                    Level = table.Column<int>(nullable: false), // Nivel 1,2,3,4
                    IsActive = table.Column<bool>(nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechnicianServices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TechnicianServices_Users_TechnicianId",
                        column: x => x.TechnicianId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TechnicianServices_ServiceCatalog_ServiceCatalogId",
                        column: x => x.ServiceCatalogId,
                        principalTable: "ServiceCatalog",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianServices_TechnicianId",
                table: "TechnicianServices",
                column: "TechnicianId");

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianServices_ServiceCatalogId",
                table: "TechnicianServices",
                column: "ServiceCatalogId");
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
