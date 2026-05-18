using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Data;
using MicroserviceB.API.Models.Entities;

namespace MicroserviceB.API.Services
{
    public class EscalationService : IEscalationService
    {
        private readonly AppDbContext _context;
        private readonly ITicketAssignmentService _assignmentService;

        // Reglas SLA: horas máximas por nivel según prioridad
        private readonly Dictionary<string, Dictionary<int, int>> _slaRules = new()
        {
            ["Baja"] = new() { { 1, 24 }, { 2, 12 }, { 3, 8 }, { 4, 4 } },
            ["Media"] = new() { { 1, 12 }, { 2, 8 }, { 3, 4 }, { 4, 2 } },
            ["Alta"] = new() { { 1, 6 }, { 2, 4 }, { 3, 2 }, { 4, 1 } },
            ["Crítica"] = new() { { 1, 2 }, { 2, 1 }, { 3, 1 }, { 4, 1 } }
        };

        public EscalationService(AppDbContext context, ITicketAssignmentService assignmentService)
        {
            _context = context;
            _assignmentService = assignmentService;
        }

        public async Task CheckAndEscalateTicketsAsync()
        {
            var ticketsToCheck = await _context.Tickets
                .Where(t => t.Status != "Cerrado" && t.Status != "Resuelto")
                .ToListAsync();

            foreach (var ticket in ticketsToCheck)
            {
                var lastCheck = ticket.LastEscalationCheck ?? ticket.CreatedAt;
                var hoursSinceLastCheck = (DateTime.UtcNow - lastCheck).TotalHours;
                var slaHours = GetSlaHours(ticket.Priority, ticket.CurrentLevel);

                if (hoursSinceLastCheck >= slaHours && ticket.CurrentLevel < 4)
                {
                    await EscalateToNextLevel(ticket);
                }
            }
        }

        public async Task ManualEscalateAsync(int ticketId)
        {
            var ticket = await _context.Tickets.FindAsync(ticketId);
            if (ticket == null)
                throw new Exception("Ticket no encontrado");

            if (ticket.CurrentLevel >= 4)
                throw new Exception("El ticket ya está en el nivel máximo");

            await EscalateToNextLevel(ticket);
        }

        private async Task EscalateToNextLevel(Ticket ticket)
        {
            // Incrementar nivel
            ticket.CurrentLevel++;
            ticket.LastEscalationCheck = DateTime.UtcNow;
            ticket.UpdatedAt = DateTime.UtcNow;

            // Reasignar a técnico del nuevo nivel
            await _assignmentService.ReassignForLevelAsync(ticket.Id, ticket.CurrentLevel);

            await _context.SaveChangesAsync();

            // Aquí luego puedes agregar notificación al técnico asignado
        }

        private int GetSlaHours(string priority, int level)
        {
            if (!_slaRules.ContainsKey(priority))
                priority = "Media";

            var levelRules = _slaRules[priority];
            return levelRules.GetValueOrDefault(level, 24);
        }
    }
}