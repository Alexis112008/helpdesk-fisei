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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
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