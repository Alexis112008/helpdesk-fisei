using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Data;
using MicroserviceB.API.Dtos;
using MicroserviceB.API.Models.Entities;

namespace MicroserviceB.API.Services
{
    public class TicketAssignmentService : ITicketAssignmentService
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        public TicketAssignmentService(AppDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<int> AssignTechnicianAsync(Ticket ticket)
        {
            var authClient = _httpClientFactory.CreateClient("AuthClient");

            // Obtener TODOS los técnicos N1 del servicio
            var response = await authClient.GetAsync(
                $"/api/technicians/byservice/{ticket.ServiceCatalogId}/level/1");

            if (!response.IsSuccessStatusCode)
                throw new Exception($"No hay técnicos N1 disponibles para el servicio {ticket.ServiceCatalogId}.");

            var technicians = await response.Content.ReadFromJsonAsync<List<TechnicianDto>>();

            if (technicians == null || technicians.Count == 0)
                throw new Exception($"No hay técnicos N1 disponibles para el servicio {ticket.ServiceCatalogId}.");

            // Contar tickets activos de cada técnico en la BD local
            // "activos" = no están Cerrados ni Resueltos
            var techIds = technicians.Select(t => t.Id).ToList();

            var ticketCounts = await _context.Tickets
                .Where(t => techIds.Contains(t.AssignedTechnicianId ?? 0)
                         && t.Status != "Cerrado"
                         && t.Status != "Resuelto")
                .GroupBy(t => t.AssignedTechnicianId)
                .Select(g => new { TechnicianId = g.Key, Count = g.Count() })
                .ToListAsync();

            // Elegir el técnico con menos tickets activos
            var selected = technicians
                .OrderBy(t => ticketCounts
                    .FirstOrDefault(tc => tc.TechnicianId == t.Id)?.Count ?? 0)
                .First();

            ticket.AssignedTechnicianId = selected.Id;
            ticket.CurrentLevel = 1;
            await _context.SaveChangesAsync();

            Console.WriteLine($"Ticket {ticket.Id} asignado al técnico {selected.Id} (N1, menor carga)");
            return selected.Id;
        }
        public async Task ReassignForLevelAsync(int ticketId, int newLevel)
        {
            var ticket = await _context.Tickets.FindAsync(ticketId);
            if (ticket == null) return;

            var authClient = _httpClientFactory.CreateClient("AuthClient");
            var response = await authClient.GetAsync(
                $"/api/technicians/byservice/{ticket.ServiceCatalogId}/level/{newLevel}");

            if (!response.IsSuccessStatusCode) return;

            var technicians = await response.Content.ReadFromJsonAsync<List<TechnicianDto>>();
            if (technicians == null || technicians.Count == 0) return;

            var techIds = technicians.Select(t => t.Id).ToList();

            var ticketCounts = await _context.Tickets
                .Where(t => techIds.Contains(t.AssignedTechnicianId ?? 0)
                         && t.Status != "Cerrado"
                         && t.Status != "Resuelto")
                .GroupBy(t => t.AssignedTechnicianId)
                .Select(g => new { TechnicianId = g.Key, Count = g.Count() })
                .ToListAsync();

            var selected = technicians
                .OrderBy(t => ticketCounts
                    .FirstOrDefault(tc => tc.TechnicianId == t.Id)?.Count ?? 0)
                .First();

            ticket.AssignedTechnicianId = selected.Id;
            ticket.CurrentLevel = newLevel;
            await _context.SaveChangesAsync();
        }


    }
}