namespace MicroserviceB.API.Services
{
    public interface IEscalationService
    {
        /// <summary>HU7 — T7.3: Job de revisión periódica.</summary>
        Task CheckAndEscalateTicketsAsync();

        /// <summary>HU7 — T7.2: Escalamiento manual sin motivo (compat).</summary>
        Task ManualEscalateAsync(int ticketId);

        /// <summary>HU7 — T7.2: Escalamiento manual con motivo y actor.</summary>
        Task ManualEscalateAsync(int ticketId, string reason, string actorFullName);
    }
}
