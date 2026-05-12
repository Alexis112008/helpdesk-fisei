namespace MicroserviceB.API.Models.DTOs
{
    public class CreateTicketDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Media";
        public int UserId { get; set; }
        public int DamageCatalogId { get; set; }
        public int ServiceCatalogId { get; set; }
    }

    public class TicketResponseDto
    {
        public int Id { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int CurrentLevel { get; set; }
        public string LevelName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int UserId { get; set; }
        public int DamageCatalogId { get; set; }
        public int ServiceCatalogId { get; set; }
    }

    public class UpdateTicketStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class EscalateTicketDto
    {
        public string Reason { get; set; } = string.Empty;
    }
}