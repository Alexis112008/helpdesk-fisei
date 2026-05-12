using Microsoft.EntityFrameworkCore;
using MicroserviceC.API.Models.Entities;

namespace MicroserviceC.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<DamageCatalog> DamageCatalogs { get; set; }
        public DbSet<ServiceCatalog> ServiceCatalogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.Entity<DamageCatalog>()
                .ToTable("DamageCatalog");

            modelBuilder.Entity<ServiceCatalog>()
                .ToTable("ServiceCatalog");
        }
    }
}