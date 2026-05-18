using Microsoft.EntityFrameworkCore;
using MicroserviceA.API.Models.Entities;

namespace MicroserviceA.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<TechnicianService> TechnicianServices { get; set; } // ← NUEVO

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configurar la tabla TechnicianServices
            modelBuilder.Entity<TechnicianService>(entity =>
            {
                entity.ToTable("TechnicianServices");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TechnicianId).IsRequired();
                entity.Property(e => e.ServiceCatalogId).IsRequired();
                entity.Property(e => e.Level).IsRequired();
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                // Relación con User (técnico)
                entity.HasOne(e => e.Technician)
                    .WithMany()
                    .HasForeignKey(e => e.TechnicianId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Datos semilla para Roles (ya lo tenías)
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Usuario" },
                new Role { Id = 2, Name = "TecnicoN1" },
                new Role { Id = 3, Name = "TecnicoN2" },
                new Role { Id = 4, Name = "DITIC" },
                new Role { Id = 5, Name = "Proveedor" },
                new Role { Id = 6, Name = "Admin" }
            );
        }
    }
}