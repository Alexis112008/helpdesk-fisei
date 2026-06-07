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

            // ✅ Configurar calidad de servicio (prefetch)
            _channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

            _channel.ExchangeDeclare(_exchange, ExchangeType.Topic, durable: true);
            _channel.QueueDeclare(_queue, durable: true, exclusive: false, autoDelete: false);

            // Suscribirse a todos los eventos de ticket
            _channel.QueueBind(_queue, _exchange, routingKey: "ticket-#");

            // ✅ Usar EventingBasicConsumer (versión síncrona pero funciona)
            var consumer = new EventingBasicConsumer(_channel);

            consumer.Received += (model, ea) =>
            {
                Task.Run(async () =>
                {
                    try
                    {
                        var type = ea.BasicProperties.Type ?? string.Empty;
                        var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                        _logger.LogInformation("[RabbitMQ] Mensaje recibido - Tipo: {Type}", type);
                        await DispatchAsync(type, json);
                        _channel.BasicAck(ea.DeliveryTag, multiple: false);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error procesando mensaje de RabbitMQ");
                        _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                    }
                });
            };

            _channel.BasicConsume(_queue, autoAck: false, consumer);
            _logger.LogInformation("[RabbitMQ] Consumer escuchando en cola {Queue}", _queue);
            return Task.CompletedTask;
        }

        private async Task DispatchAsync(string type, string json)
        {
            // ✅ LOG 1: Evento recibido
            _logger.LogInformation("[Consumer] Procesando evento tipo: {Type}", type);

            using var scope = _provider.CreateScope();
            var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

            // ✅ LOG 2: EmailService resuelto correctamente
            _logger.LogInformation("[Consumer] EmailService resuelto OK");

            switch (type)
            {
                case "ticket-created":
                    // ✅ LOG 3: Enviando correo específico
                    _logger.LogInformation("[Consumer] Enviando correo ticket-created");
                    var created = JsonSerializer.Deserialize<TicketCreatedEvent>(json);
                    if (created != null) await email.SendTicketCreatedAsync(created);
                    break;
                case "ticket-updated":
                    _logger.LogInformation("[Consumer] Enviando correo ticket-updated");
                    var updated = JsonSerializer.Deserialize<TicketUpdatedEvent>(json);
                    if (updated != null) await email.SendTicketUpdatedAsync(updated);
                    break;
                case "ticket-escalated":
                    _logger.LogInformation("[Consumer] Enviando correo ticket-escalated");
                    var escalated = JsonSerializer.Deserialize<TicketEscalatedEvent>(json);
                    if (escalated != null) await email.SendTicketEscalatedAsync(escalated);
                    break;
                case "ticket-resolved":
                    _logger.LogInformation("[Consumer] Enviando correo ticket-resolved");
                    var resolved = JsonSerializer.Deserialize<TicketResolvedEvent>(json);
                    if (resolved != null) await email.SendTicketResolvedAsync(resolved);
                    break;
                case "ticket-closed":
                    _logger.LogInformation("[Consumer] Enviando correo ticket-closed");
                    var closed = JsonSerializer.Deserialize<TicketClosedEvent>(json);
                    if (closed != null) await email.SendTicketClosedAsync(closed);
                    break;
                case "ticket-overdue":
                    _logger.LogInformation("[Consumer] Enviando correo ticket-overdue");
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