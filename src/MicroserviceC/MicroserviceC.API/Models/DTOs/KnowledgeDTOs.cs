namespace MicroserviceC.API.Models.DTOs
{
    public class CreateKnowledgeArticleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Problem { get; set; } = string.Empty;
        public string Cause { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TicketId { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
    }

    public class UpdateKnowledgeArticleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Problem { get; set; } = string.Empty;
        public string Cause { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class KnowledgeArticleResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Problem { get; set; } = string.Empty;
        public string Cause { get; set; } = string.Empty;
        public string Symptoms { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TicketId { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public int ViewCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
