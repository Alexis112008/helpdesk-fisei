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
            // 1. Llamar a MicroserviceA para obtener técnicos que pueden atender este servicio
            var authClient = _httpClientFactory.CreateClient("AuthClient");
            var response = await authClient.GetAsync($"/api/technicians/byservice/{ticket.ServiceCatalogId}");

            if (!response.IsSuccessStatusCode)
                throw new Exception("No se pudo obtener la lista de técnicos");

            var technicians = await response.Content.ReadFromJsonAsync<List<TechnicianDto>>();

            if (technicians == null || technicians.Count == 0)
                throw new Exception("No hay técnicos disponibles para este servicio");

            // 2. Seleccionar el técnico con menos tickets activos
            var selected = technicians
                .OrderBy(t => t.CurrentTicketCount)
                .FirstOrDefault();

            if (selected == null)
                throw new Exception("No se pudo asignar un técnico");

            // 3. Guardar la asignación
            ticket.AssignedTechnicianId = selected.Id;
            ticket.CurrentLevel = selected.Level;

            // Podrías guardar en una tabla AssignmentHistory si quieres historial

            return selected.Id;
        }

        public async Task ReassignForLevelAsync(int ticketId, int newLevel)
        {
            var ticket = await _context.Tickets.FindAsync(ticketId);
            if (ticket == null) return;

            // Buscar técnico del nuevo nivel
            var authClient = _httpClientFactory.CreateClient("AuthClient");
            var response = await authClient.GetAsync($"/api/technicians/byservice/{ticket.ServiceCatalogId}/level/{newLevel}");

            if (!response.IsSuccessStatusCode) return;

            var technician = await response.Content.ReadFromJsonAsync<TechnicianDto>();
            if (technician == null) return;

            ticket.AssignedTechnicianId = technician.Id;
            ticket.CurrentLevel = newLevel;

            await _context.SaveChangesAsync();
        }


    }
}