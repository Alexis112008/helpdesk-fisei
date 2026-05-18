using System.Threading.Tasks;

namespace MicroserviceB.API.Services
{
    public interface IEscalationService
    {
        Task CheckAndEscalateTicketsAsync();  // Para el background service
        Task ManualEscalateAsync(int ticketId);  // Para escalamiento manual
    }
}