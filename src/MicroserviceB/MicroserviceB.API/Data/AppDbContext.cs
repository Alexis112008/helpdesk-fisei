using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Models.Entities;

namespace MicroserviceB.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<TicketAction> TicketActions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Ticket>()
                .ToTable("Tickets");

            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.TicketNumber)
                .IsUnique();

            modelBuilder.Entity<TicketAction>()
                .ToTable("TicketActions");

            modelBuilder.Entity<TicketAction>()
                .HasIndex(a => a.TicketId);
        }
    }
}