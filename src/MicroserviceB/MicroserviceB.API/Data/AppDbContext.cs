using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Models.Entities;

namespace MicroserviceB.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Ticket> Tickets { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Ticket>()
                .ToTable("Tickets");

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.TicketNumber)
                .IsUnique();
        }
    }
}