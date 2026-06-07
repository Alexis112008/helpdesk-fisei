using MicroserviceB.API.Events;

namespace MicroserviceB.API.Messaging
{
    /// <summary>
    /// HU6 — T6.1 / T6.2: Bus de eventos.
    /// Implementaciones: RabbitMQ (producción) o InMemory (fallback).
    /// </summary>
    public interface IEventBus
    {
        Task PublishAsync<TEvent>(TEvent evt) where TEvent : TicketEvent;
    }
}
