using Microsoft.EntityFrameworkCore;
using MicroserviceC.API.Models.Entities;

namespace MicroserviceC.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<DamageCatalog> DamageCatalogs { get; set; }
        public DbSet<ServiceCatalog> ServiceCatalogs { get; set; }
        public DbSet<KnowledgeArticle> KnowledgeArticles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DamageCatalog>().ToTable("DamageCatalog");
            modelBuilder.Entity<ServiceCatalog>().ToTable("ServiceCatalog");

            modelBuilder.Entity<KnowledgeArticle>(b =>
            {
                b.ToTable("KnowledgeArticles");
                b.HasIndex(a => a.TicketId);
                b.HasIndex(a => a.Category);
            });
        }
    }
}
