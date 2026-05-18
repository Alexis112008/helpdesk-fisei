using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Data;
using MicroserviceB.API.Models.DTOs;
using MicroserviceB.API.Models.Entities;
using MicroserviceB.API.Services;

namespace MicroserviceB.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITicketAssignmentService _assignmentService;
        private readonly IEscalationService _escalationService;
        public TicketController(
        AppDbContext context,
        ITicketAssignmentService assignmentService,
        IEscalationService escalationService)  
        {
            _context = context;
            _assignmentService = assignmentService;
            _escalationService = escalationService;  
        }

        // Nombre del nivel según número
        private static string GetLevelName(int level) => level switch
        {
            1 => "Técnico Básico",
            2 => "Técnico Profesional",
            3 => "DITIC",
            4 => "Proveedor Externo",
            _ => "Desconocido"
        };

        // Mapear ticket a DTO
        private static TicketResponseDto MapToDto(Ticket t) => new()
        {
            Id = t.Id,
            TicketNumber = t.TicketNumber,
            Title = t.Title,
            Description = t.Description,
            Status = t.Status,
            Priority = t.Priority,
            CurrentLevel = t.CurrentLevel,
            LevelName = GetLevelName(t.CurrentLevel),
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            UserId = t.UserId,
            DamageCatalogId = t.DamageCatalogId,
            ServiceCatalogId = t.ServiceCatalogId
        };

        // GET: api/ticket — todos los tickets
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tickets = await _context.Tickets
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => MapToDto(t))
                .ToListAsync();

            return Ok(tickets);
        }

        // GET: api/ticket/user/5 — tickets de un usuario
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var tickets = await _context.Tickets
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => MapToDto(t))
                .ToListAsync();

            return Ok(tickets);
        }

        // GET: api/ticket/5 — un ticket por id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound(new { message = "Ticket no encontrado" });

            return Ok(MapToDto(ticket));
        }

        // POST: api/ticket — crear ticket
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTicketDto dto)
        {
            // Generar número único de ticket
            var count = await _context.Tickets.CountAsync();
            var ticketNumber = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

            var ticket = new Ticket
            {
                TicketNumber = ticketNumber,
                Title = dto.Title,
                Description = dto.Description,
                Priority = dto.Priority,
                Status = "Abierto",
                CurrentLevel = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UserId = dto.UserId,
                DamageCatalogId = dto.DamageCatalogId,
                ServiceCatalogId = dto.ServiceCatalogId
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = ticket.Id },
                new { message = "Ticket creado", ticketNumber, id = ticket.Id });
        }

        // PUT: api/ticket/5/status — cambiar estado
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id,
            [FromBody] UpdateTicketStatusDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound(new { message = "Ticket no encontrado" });

            var validStatuses = new[]
                { "Abierto", "En Proceso", "Escalado", "Resuelto", "Cerrado" };

            if (!validStatuses.Contains(dto.Status))
                return BadRequest(new { message = "Estado no válido" });

            ticket.Status = dto.Status;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Estado actualizado", status = dto.Status });
        }

        // PUT: api/ticket/5/escalate — escalar al siguiente nivel
        [HttpPut("{id}/escalate")]
        public async Task<IActionResult> Escalate(int id,
            [FromBody] EscalateTicketDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound(new { message = "Ticket no encontrado" });

            if (ticket.CurrentLevel >= 4)
                return BadRequest(new { message = "El ticket ya está en el nivel máximo (Proveedor Externo)" });

            ticket.CurrentLevel++;
            ticket.Status = "Escalado";
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Ticket escalado al nivel {ticket.CurrentLevel}",
                currentLevel = ticket.CurrentLevel,
                levelName = GetLevelName(ticket.CurrentLevel)
            });
        }

        [HttpPost("{id}/escalate")]
        public async Task<IActionResult> EscalateTicket(int id)
        {
            try
            {
                await _escalationService.ManualEscalateAsync(id);
                return Ok(new { message = "Ticket escalado correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}