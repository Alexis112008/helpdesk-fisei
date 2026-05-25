using System.Text;
using System.Text.Json;
using MicroserviceB.API.Events;
using RabbitMQ.Client;

namespace MicroserviceB.API.Messaging
{
    /// <summary>
    /// HU6 — T6.1 + T6.2: Bus de eventos con RabbitMQ.
    /// Publica cada evento en un exchange tipo "topic" usando
    /// el routing key igual al EventType (ticket-created, ticket-updated, etc.).
    ///
    /// Si la conexión a RabbitMQ falla en arranque, el sistema cae al
    /// InMemoryEventBus (decidido en Program.cs), de modo que el servicio
    /// sigue corriendo aunque no haya RabbitMQ disponible.
    /// </summary>
    public class RabbitMqEventBus : IEventBus, IDisposable
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly string _exchange;
        private readonly ILogger<RabbitMqEventBus> _logger;

        public RabbitMqEventBus(IConnection connection, string exchange, ILogger<RabbitMqEventBus> logger)
        {
            _connection = connection;
            _exchange = exchange;
            _logger = logger;

            _channel = _connection.CreateModel();
            _channel.ExchangeDeclare(exchange: _exchange, type: ExchangeType.Topic, durable: true);
        }

        public Task PublishAsync<TEvent>(TEvent evt) where TEvent : TicketEvent
        {
            var json = JsonSerializer.Serialize(evt, evt.GetType());
            var body = Encoding.UTF8.GetBytes(json);

            var props = _channel.CreateBasicProperties();
            props.ContentType = "application/json";
            props.DeliveryMode = 2; // persistente
            props.Type = evt.EventType;

            _channel.BasicPublish(
                exchange: _exchange,
                routingKey: evt.EventType,
                basicProperties: props,
                body: body);

            _logger.LogInformation(
                "[RabbitMQ] Publicado {EventType} ticket={TicketNumber}",
                evt.EventType, evt.TicketNumber);

            return Task.CompletedTask;
        }

        public void Dispose()
        {
            try { _channel?.Close(); } catch { }
            try { _connection?.Close(); } catch { }
        }
    }
}
