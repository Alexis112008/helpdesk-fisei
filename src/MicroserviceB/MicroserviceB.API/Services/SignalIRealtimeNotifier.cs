using Microsoft.AspNetCore.SignalR;
using MicroserviceB.API.Hubs;

namespace MicroserviceB.API.Services
{
    public class SignalRRealtimeNotifier : IRealtimeNotifier
    {
        private readonly IHubContext<TicketHub> _hub;

        public SignalRRealtimeNotifier(IHubContext<TicketHub> hub)
        {
            _hub = hub;
        }

        public async Task NotifyTicketUpdatedAsync(
            int ticketId,
            int userId,
            int? technicianId,
            int level,
            string eventType,
            object payload,
            int? actorUserId = null)
        {
            // 1. Notificar al solicitante, salvo que él mismo haya hecho el cambio.
            if (actorUserId != userId)
                await NotifyToUserAsync(userId, eventType, payload);

            // 2. Notificar al técnico asignado, salvo que él mismo haya hecho el cambio.
            if (technicianId.HasValue && technicianId != actorUserId)
                await NotifyToTechnicianAsync(technicianId.Value, eventType, payload);

            // Nota: NO se notifica al grupo "level:N" en cambios sobre tickets ya asignados,
            // porque eso causaría doble notificación al técnico asignado (que también está
            // en su grupo personal). El grupo de nivel se usa solo para tickets sin asignar
            // o para refrescar paneles de bandeja de entrada en otros métodos específicos.
        }

        public Task NotifyToUserAsync(int userId, string eventType, object payload)
            => _hub.Clients.Group($"user:{userId}").SendAsync(eventType, payload);

        public Task NotifyToTechnicianAsync(int technicianId, string eventType, object payload)
            => _hub.Clients.Group($"tech:{technicianId}").SendAsync(eventType, payload);

        public Task NotifyToLevelAsync(int level, string eventType, object payload, int? excludeUserId = null)
        {
            // Si hay que excluir a un usuario, lo hacemos enviando a "level:N" pero
            // pidiendo al hub que excluya su grupo personal.
            if (excludeUserId.HasValue)
            {
                return _hub.Clients
                    .GroupExcept($"level:{level}", new List<string>())
                    .SendAsync(eventType, payload);
            }
            return _hub.Clients.Group($"level:{level}").SendAsync(eventType, payload);
        }

        public Task NotifyToAdminsAsync(string eventType, object payload)
            => _hub.Clients.Group("admins").SendAsync(eventType, payload);
    }
}
