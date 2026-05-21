namespace MicroserviceB.API.Services
{
    /// <summary>
    /// Servicio que abstrae el envío de notificaciones en tiempo real
    /// vía SignalR.
    ///
    /// Cuando se notifica un cambio sobre un ticket, el evento llega a:
    ///  - El solicitante (user:{userId})
    ///  - El técnico asignado (tech:{technicianId})  → SIN duplicar con el grupo del nivel
    ///
    /// `actorUserId` es el usuario que produjo el cambio; si coincide con
    /// el solicitante o el técnico asignado, NO se le envía notificación
    /// (no tiene sentido notificarte de tu propia acción).
    /// </summary>
    public interface IRealtimeNotifier
    {
        Task NotifyTicketUpdatedAsync(
            int ticketId,
            int userId,
            int? technicianId,
            int level,
            string eventType,
            object payload,
            int? actorUserId = null);

        Task NotifyToUserAsync(int userId, string eventType, object payload);
        Task NotifyToTechnicianAsync(int technicianId, string eventType, object payload);
        Task NotifyToLevelAsync(int level, string eventType, object payload, int? excludeUserId = null);
        Task NotifyToAdminsAsync(string eventType, object payload);
    }
}
