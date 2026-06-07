namespace MicroserviceB.API.Models.Entities
{
    public class Ticket
    {
        public int Id { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Abierto";
        public string Priority { get; set; } = "Media";
        public int CurrentLevel { get; set; } = 1;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int UserId { get; set; }
        public int DamageCatalogId { get; set; }
        public int ServiceCatalogId { get; set; }
        public int? AssignedTechnicianId { get; set; }
        public DateTime? LastEscalationCheck { get; set; }
        public string Location { get; set; } = string.Empty;
        public string AssetCode { get; set; } = string.Empty;
        public virtual ICollection<TicketAttachment> TicketAttachments { get; set; } = new List<TicketAttachment>();
    }
}