namespace MicroserviceC.API.Models.Entities
{
    /// <summary>
    /// HU8 — T8.1: Artículo de la base de conocimiento.
    /// Se crea al cerrar un ticket con su solución documentada.
    /// </summary>
    public class KnowledgeArticle
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;

        // Campos obligatorios al cerrar ticket (HU8 validación 1)
        public string Problem { get; set; } = string.Empty;
        public string Cause { get; set; } = string.Empty;
        public string Symptoms { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;

        // Categoría libre (Hardware, Software, Red, Correo, Cuentas, etc.)
        public string Category { get; set; } = string.Empty;

        // Relación con el ticket cerrado (FK lógica con Microservicio B)
        public int TicketId { get; set; }
        public string TicketNumber { get; set; } = string.Empty;

        // Autor (FK lógica con Microservicio A)
        public int CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;

        public int ViewCount { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
