using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration; 

namespace MicroserviceB.API.Services
{
    public class TimedEscalationService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<TimedEscalationService> _logger;
        private readonly IConfiguration _configuration; 

        public TimedEscalationService(
            IServiceProvider services,
            ILogger<TimedEscalationService> logger,
            IConfiguration configuration) 
        {
            _services = services;
            _logger = logger;
            _configuration = configuration; 
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Servicio de escalamiento automático iniciado");

            // Leer intervalo desde configuración (default: 15 minutos)
            var intervalMinutes = _configuration.GetValue<int>("EscalationSettings:CheckIntervalMinutes", 15);
            _logger.LogInformation($"Intervalo configurado: {intervalMinutes} minutos");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);

                    _logger.LogInformation("Revisando tickets para escalamiento automático...");

                    using (var scope = _services.CreateScope())
                    {
                        var escalationService = scope.ServiceProvider
                            .GetRequiredService<IEscalationService>();

                        await escalationService.CheckAndEscalateTicketsAsync();
                    }

                    _logger.LogInformation("Revisión de escalamiento completada");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error en el servicio de escalamiento automático");
                }
            }
        }
    }
}