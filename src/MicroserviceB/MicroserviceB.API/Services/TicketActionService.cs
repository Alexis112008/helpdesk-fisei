using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Data;
using MicroserviceB.API.Models.DTOs;
using MicroserviceB.API.Models.Entities;

namespace MicroserviceB.API.Services
{
    /// <summary>
    /// HU5 — T5.3: Persistencia del historial de acciones del técnico.
    /// </summary>
    public class TicketActionService : ITicketActionService
    {
        private readonly AppDbContext _context;

        public TicketActionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TicketAction> RegisterActionAsync(
            int ticketId,
            int userId,
            string userFullName,
            string actionType,
            string description,
            string? fromValue = null,
            string? toValue = null)
        {
            var action = new TicketAction
            {
                TicketId = ticketId,
                UserId = userId,
                UserFullName = userFullName,
                ActionType = actionType,
                Description = description,
                FromValue = fromValue,
                ToValue = toValue,
                CreatedAt = DateTime.UtcNow
            };

            _context.TicketActions.Add(action);
            await _context.SaveChangesAsync();
            return action;
        }

        public async Task<List<TicketActionDto>> GetActionsByTicketAsync(int ticketId)
        {
            return await _context.TicketActions
                .Where(a => a.TicketId == ticketId)
                .OrderBy(a => a.CreatedAt)
                .Select(a => new TicketActionDto
                {
                    Id = a.Id,
                    TicketId = a.TicketId,
                    UserId = a.UserId,
                    UserFullName = a.UserFullName,
                    ActionType = a.ActionType,
                    Description = a.Description,
                    FromValue = a.FromValue,
                    ToValue = a.ToValue,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();
        }
    }
}
