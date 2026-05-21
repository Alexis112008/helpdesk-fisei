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
            Console.WriteLine($"Asignando ticket {ticket.Id} para servicio {ticket.ServiceCatalogId}");

            // Los tickets nuevos siempre empiezan en N1: usamos el endpoint de nivel específico
            var authClient = _httpClientFactory.CreateClient("AuthClient");
            var response = await authClient.GetAsync(
                $"/api/technicians/byservice/{ticket.ServiceCatalogId}/level/1");

            if (!response.IsSuccessStatusCode)
            {
                // Fallback: intentar con el endpoint general y filtrar N1 manualmente
                var fallbackResponse = await authClient.GetAsync(
                    $"/api/technicians/byservice/{ticket.ServiceCatalogId}");

                if (!fallbackResponse.IsSuccessStatusCode)
                    throw new Exception("No se pudo obtener la lista de técnicos");

                var allTechnicians = await fallbackResponse.Content.ReadFromJsonAsync<List<TechnicianDto>>();
                var n1Technicians = allTechnicians?.Where(t => t.Level == 1).ToList();

                if (n1Technicians == null || n1Technicians.Count == 0)
                    throw new Exception($"No hay técnicos N1 disponibles para el servicio {ticket.ServiceCatalogId}. " +
                        "Asegúrese de que existan técnicos con rol TecnicoN1 asignados a este servicio.");

                var selectedFromFallback = n1Technicians.OrderBy(t => t.CurrentTicketCount).First();
                ticket.AssignedTechnicianId = selectedFromFallback.Id;
                ticket.CurrentLevel = 1; // Siempre nivel 1 al crear
                await _context.SaveChangesAsync();
                Console.WriteLine($"Ticket {ticket.Id} asignado (fallback) al técnico {selectedFromFallback.Id} (N1)");
                return selectedFromFallback.Id;
            }

            var technician = await response.Content.ReadFromJsonAsync<TechnicianDto>();

            if (technician == null)
                throw new Exception($"No hay técnicos N1 disponibles para el servicio {ticket.ServiceCatalogId}. " +
                    "Asegúrese de que existan técnicos con rol TecnicoN1 asignados a este servicio.");

            // Asignar siempre a nivel 1
            ticket.AssignedTechnicianId = technician.Id;
            ticket.CurrentLevel = 1;

            await _context.SaveChangesAsync();
            Console.WriteLine($"Ticket {ticket.Id} asignado al técnico {technician.Id} (N1)");

            return technician.Id;
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