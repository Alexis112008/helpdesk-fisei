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

        /// <summary>HU7 — T7.2: Escalamiento manual con motivo, actor y su userId
        /// (para registrar la acción con el ID real del técnico).</summary>
        Task ManualEscalateAsync(int ticketId, string reason, string actorFullName, int actorUserId);
    }
}