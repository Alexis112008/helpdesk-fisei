using MicroserviceB.API.Events;
using MicroserviceB.API.Services;

namespace MicroserviceB.API.Messaging
{
    /// <summary>
    /// HU6 — Consumer in-memory: cuando el bus es InMemoryEventBus,
    /// estos consumers son invocados directamente para mantener el
    /// mismo flujo (publicar → consumer → email).
    /// </summary>
    public class NotificationConsumer :
        IEventConsumer<TicketCreatedEvent>,
        IEventConsumer<TicketUpdatedEvent>,
        IEventConsumer<TicketEscalatedEvent>,
        IEventConsumer<TicketResolvedEvent>,
        IEventConsumer<TicketClosedEvent>,
        IEventConsumer<TicketOverdueEvent>
    {
        private readonly IEmailService _email;

        public NotificationConsumer(IEmailService email)
        {
            _email = email;
        }

        public Task HandleAsync(TicketCreatedEvent evt) => _email.SendTicketCreatedAsync(evt);
        public Task HandleAsync(TicketUpdatedEvent evt) => _email.SendTicketUpdatedAsync(evt);
        public Task HandleAsync(TicketEscalatedEvent evt) => _email.SendTicketEscalatedAsync(evt);
        public Task HandleAsync(TicketResolvedEvent evt) => _email.SendTicketResolvedAsync(evt);
        public Task HandleAsync(TicketClosedEvent evt) => _email.SendTicketClosedAsync(evt);
        public Task HandleAsync(TicketOverdueEvent evt) => _email.SendTicketOverdueAsync(evt);
    }
}
