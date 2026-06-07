using System.Threading.Tasks;
using MicroserviceB.API.Models.Entities;

namespace MicroserviceB.API.Services
{
    public interface ITicketAssignmentService
    {
        Task<int> AssignTechnicianAsync(Ticket ticket);
        Task ReassignForLevelAsync(int ticketId, int newLevel);
    }
}