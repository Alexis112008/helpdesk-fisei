namespace MicroserviceB.API.Models.DTOs
{
    // ============================================================
    // HU5 — Panel del Técnico
    // ============================================================

    /// <summary>
    /// Representa una acción del historial del ticket.
    /// </summary>
    public class TicketActionDto
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? FromValue { get; set; }
        public string? ToValue { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Crear una acción manual (comentario, resolución, etc).
    /// </summary>
    public class CreateTicketActionDto
    {
        public string ActionType { get; set; } = "Comment";
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Detalle ampliado para el panel del técnico
    /// (ticket + historial de acciones).
    /// </summary>
    public class TicketDetailDto
    {
        public TicketResponseDto Ticket { get; set; } = new();
        public List<TicketActionDto> Actions { get; set; } = new();
    }

    // ============================================================
    // HU7 — Escalamiento
    // ============================================================

    /// <summary>
    /// Escalamiento con motivo obligatorio (HU7 — T7.2).
    /// </summary>
    public class EscalateWithReasonDto
    {
        public string Reason { get; set; } = string.Empty;
    }
}
