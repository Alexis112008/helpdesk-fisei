using MicroserviceB.API.Events;

namespace MicroserviceB.API.Messaging
{
    /// <summary>
    /// HU6 — Bus en memoria. Útil para desarrollo y pruebas
    /// cuando no hay RabbitMQ disponible.
    /// Despacha cada evento de forma asíncrona a los consumidores
    /// registrados en el mismo proceso.
    /// </summary>
    public class InMemoryEventBus : IEventBus
    {
        private readonly IServiceProvider _provider;
        private readonly ILogger<InMemoryEventBus> _logger;

        public InMemoryEventBus(IServiceProvider provider, ILogger<InMemoryEventBus> logger)
        {
            _provider = provider;
            _logger = logger;
        }

        /// <summary>
        /// Publica el evento de forma fire-and-forget: encola la entrega a los
        /// consumers en background y retorna inmediatamente. Esto evita que un
        /// consumer lento (p.ej. envío de email con timeout SMTP) bloquee la
        /// respuesta HTTP del endpoint que originó el evento.
        ///
        /// Si un consumer falla, el error se loguea pero no propaga.
        /// </summary>
        public Task PublishAsync<TEvent>(TEvent evt) where TEvent : TicketEvent
        {
            _logger.LogInformation(
                "[InMemoryEventBus] Publicando evento {EventType} para ticket {TicketNumber}",
                evt.EventType, evt.TicketNumber);

            // Despachar en background sin esperar.
            // Cada consumer usa SU propio scope para que los servicios scoped
            // (DbContext, EmailService) funcionen correctamente y no se cierren
            // antes de tiempo.
            _ = Task.Run(async () =>
            {
                using var scope = _provider.CreateScope();
                var consumers = scope.ServiceProvider.GetServices<IEventConsumer<TEvent>>();

                foreach (var consumer in consumers)
                {
                    try
                    {
                        await consumer.HandleAsync(evt);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "Error en consumer {Consumer} para evento {EventType}. " +
                            "El error NO bloquea al solicitante porque la publicación es asíncrona.",
                            consumer.GetType().Name, evt.EventType);
                    }
                }
            });

            return Task.CompletedTask;
        }
    }

    /// <summary>Contrato de consumer in-process.</summary>
    public interface IEventConsumer<in TEvent> where TEvent : TicketEvent
    {
        Task HandleAsync(TEvent evt);
    }
}
