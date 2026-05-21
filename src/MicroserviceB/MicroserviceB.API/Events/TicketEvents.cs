namespace MicroserviceB.API.Events
{
    /// <summary>
    /// HU6 — Eventos de dominio publicados al bus.
    /// </summary>
    public abstract class TicketEvent
    {
        public int TicketId { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string UserFullName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int? AssignedTechnicianId { get; set; }
        public int CurrentLevel { get; set; }
        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
        public abstract string EventType { get; }
    }

    public class TicketCreatedEvent : TicketEvent
    {
        public override string EventType => "ticket-created";
        public string Priority { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class TicketUpdatedEvent : TicketEvent
    {
        public override string EventType => "ticket-updated";
        public string FromStatus { get; set; } = string.Empty;
        public string ToStatus { get; set; } = string.Empty;
        public string ChangedByName { get; set; } = string.Empty;
    }

    public class TicketEscalatedEvent : TicketEvent
    {
        public override string EventType => "ticket-escalated";
        public int FromLevel { get; set; }
        public int ToLevel { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string EscalatedByName { get; set; } = string.Empty;
    }

    public class TicketResolvedEvent : TicketEvent
    {
        public override string EventType => "ticket-resolved";
        public string Solution { get; set; } = string.Empty;
        public string ResolvedByName { get; set; } = string.Empty;
    }

    public class TicketClosedEvent : TicketEvent
    {
        public override string EventType => "ticket-closed";
        public string Solution { get; set; } = string.Empty;
    }

    public class TicketOverdueEvent : TicketEvent
    {
        public override string EventType => "ticket-overdue";
        public string Reason { get; set; } = string.Empty;
    }
}
