namespace MicroserviceB.API.Models.Entities
{
    /// <summary>
    /// Historial de acciones realizadas sobre un ticket por técnicos.
    /// HU5 — T5.3: TicketActionService guarda historial con timestamp.
    /// </summary>
    public class TicketAction
    {
        public int Id { get; set; }
        public int TicketId { get; set; }

        // Quién hizo la acción
        public int UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;

        // Tipo: StatusChange, Escalation, Comment, Resolution, Closure, Rejection
        public string ActionType { get; set; } = string.Empty;

        // Descripción legible
        public string Description { get; set; } = string.Empty;

        // Para cambios de estado guardamos el "de → a"
        public string? FromValue { get; set; }
        public string? ToValue { get; set; }

        // Para el motivo del rechazo
        public string? RejectionReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}