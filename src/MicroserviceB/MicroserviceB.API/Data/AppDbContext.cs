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
        public DbSet<TicketAttachment> TicketAttachments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configurar Ticket
            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.ToTable("Tickets");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.TicketNumber).IsUnique();

                // Relación con TicketAttachments
                entity.HasMany(e => e.TicketAttachments)
                      .WithOne(e => e.Ticket)
                      .HasForeignKey(e => e.TicketId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configurar TicketAction
            modelBuilder.Entity<TicketAction>(entity =>
            {
                entity.ToTable("TicketActions");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.TicketId);
            });

            // Configurar TicketAttachment
            modelBuilder.Entity<TicketAttachment>(entity =>
            {
                entity.ToTable("TicketAttachments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).UseIdentityColumn(); 
                entity.HasOne(e => e.Ticket)
                      .WithMany(e => e.TicketAttachments)
                      .HasForeignKey(e => e.TicketId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}