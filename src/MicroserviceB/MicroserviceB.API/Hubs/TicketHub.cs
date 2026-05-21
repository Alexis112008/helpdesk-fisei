using Microsoft.AspNetCore.SignalR;

namespace MicroserviceB.API.Hubs
{
    /// <summary>
    /// HU5 — T5.4 y HU6 — T6.5:
    /// Hub de SignalR que emite eventos a clientes conectados.
    ///
    /// Clientes se suscriben a grupos:
    ///   - "user:{userId}"     → solicitantes (notificaciones sobre sus tickets)
    ///   - "tech:{userId}"     → técnico (su panel)
    ///   - "level:{n}"         → todos los técnicos de un nivel
    ///   - "admins"            → administradores
    /// </summary>
    public class TicketHub : Hub
    {
        /// <summary>Suscribe la conexión a un grupo.</summary>
        public Task JoinGroup(string groupName)
            => Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        /// <summary>Quita la conexión de un grupo.</summary>
        public Task LeaveGroup(string groupName)
            => Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }
}
