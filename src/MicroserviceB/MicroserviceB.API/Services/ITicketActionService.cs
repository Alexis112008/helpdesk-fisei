using MicroserviceB.API.Models.Entities;
using MicroserviceB.API.Models.DTOs;

namespace MicroserviceB.API.Services
{
    /// <summary>
    /// HU5 — T5.3: Registrar acciones del técnico sobre un ticket.
    /// </summary>
    public interface ITicketActionService
    {
        Task<TicketAction> RegisterActionAsync(
            int ticketId,
            int userId,
            string userFullName,
            string actionType,
            string description,
            string? fromValue = null,
            string? toValue = null);

        Task<List<TicketActionDto>> GetActionsByTicketAsync(int ticketId);
    }
}
