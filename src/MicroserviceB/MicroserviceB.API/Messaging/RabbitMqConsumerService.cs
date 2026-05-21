using System.Text;
using System.Text.Json;
using MicroserviceB.API.Events;
using MicroserviceB.API.Services;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace MicroserviceB.API.Messaging
{
    /// <summary>
    /// HU6 — T6.3: Consumer RabbitMQ.
    /// Escucha la cola "helpdesk.notifications", deserializa el evento
    /// según el header "type" y dispara el envío de correo mediante
    /// EmailService.
    /// </summary>
    public class RabbitMqConsumerService : BackgroundService
    {
        private readonly IConnection _connection;
        private readonly IServiceProvider _provider;
        private readonly ILogger<RabbitMqConsumerService> _logger;
        private readonly string _exchange;
        private readonly string _queue = "helpdesk.notifications";
        private IModel? _channel;

        public RabbitMqConsumerService(
            IConnection connection,
            IServiceProvider provider,
            ILogger<RabbitMqConsumerService> logger,
            string exchange)
        {
            _connection = connection;
            _provider = provider;
            _logger = logger;
            _exchange = exchange;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _channel = _connection.CreateModel();

            _channel.ExchangeDeclare(_exchange, ExchangeType.Topic, durable: true);
            _channel.QueueDeclare(_queue, durable: true, exclusive: false, autoDelete: false);

            // Suscribirse a todos los eventos de ticket
            _channel.QueueBind(_queue, _exchange, routingKey: "ticket-#");

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (model, ea) =>
            {
                try
                {
                    var type = ea.BasicProperties.Type ?? string.Empty;
                    var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                    await DispatchAsync(type, json);
                    _channel.BasicAck(ea.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error procesando mensaje de RabbitMQ");
                    _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                }
            };

            _channel.BasicConsume(_queue, autoAck: false, consumer);
            _logger.LogInformation("[RabbitMQ] Consumer escuchando en cola {Queue}", _queue);
            return Task.CompletedTask;
        }

        private async Task DispatchAsync(string type, string json)
        {
            using var scope = _provider.CreateScope();
            var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

            switch (type)
            {
                case "ticket-created":
                    var created = JsonSerializer.Deserialize<TicketCreatedEvent>(json);
                    if (created != null) await email.SendTicketCreatedAsync(created);
                    break;
                case "ticket-updated":
                    var updated = JsonSerializer.Deserialize<TicketUpdatedEvent>(json);
                    if (updated != null) await email.SendTicketUpdatedAsync(updated);
                    break;
                case "ticket-escalated":
                    var escalated = JsonSerializer.Deserialize<TicketEscalatedEvent>(json);
                    if (escalated != null) await email.SendTicketEscalatedAsync(escalated);
                    break;
                case "ticket-resolved":
                    var resolved = JsonSerializer.Deserialize<TicketResolvedEvent>(json);
                    if (resolved != null) await email.SendTicketResolvedAsync(resolved);
                    break;
                case "ticket-closed":
                    var closed = JsonSerializer.Deserialize<TicketClosedEvent>(json);
                    if (closed != null) await email.SendTicketClosedAsync(closed);
                    break;
                case "ticket-overdue":
                    var overdue = JsonSerializer.Deserialize<TicketOverdueEvent>(json);
                    if (overdue != null) await email.SendTicketOverdueAsync(overdue);
                    break;
                default:
                    _logger.LogWarning("Tipo de evento desconocido: {Type}", type);
                    break;
            }
        }

        public override void Dispose()
        {
            try { _channel?.Close(); } catch { }
            base.Dispose();
        }
    }
}
