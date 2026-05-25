using MicroserviceB.API.Events;

namespace MicroserviceB.API.Services
{
    /// <summary>
    /// HU6 — T6.4: Servicio de envío de correos con plantillas HTML.
    /// </summary>
    public interface IEmailService
    {
        Task SendTicketCreatedAsync(TicketCreatedEvent evt);
        Task SendTicketUpdatedAsync(TicketUpdatedEvent evt);
        Task SendTicketEscalatedAsync(TicketEscalatedEvent evt);
        Task SendTicketResolvedAsync(TicketResolvedEvent evt);
        Task SendTicketClosedAsync(TicketClosedEvent evt);
        Task SendTicketOverdueAsync(TicketOverdueEvent evt);
    }
}
