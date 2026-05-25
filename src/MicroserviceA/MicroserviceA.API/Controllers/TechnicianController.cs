using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceA.API.Data;
using MicroserviceA.API.Models.DTOs;
using MicroserviceA.API.Models.Entities;

namespace MicroserviceA.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TechniciansController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TechniciansController(AppDbContext context)
        {
            _context = context;
        }

        // ------------------------------------------------------------
        // Mapeo único: rol → nivel de atención
        // (mismo que usa MicroserviceB en TicketController)
        // ------------------------------------------------------------
        private static int? RoleToLevel(string role) => role switch
        {
            "TecnicoN1" => 1,
            "TecnicoN2" => 2,
            "DITIC"     => 3,
            "Proveedor" => 4,
            _           => null
        };

        // ============================================================
        // CONSULTA (usado por MicroserviceB)
        // ============================================================

        [HttpGet("byservice/{serviceCatalogId}")]
        public async Task<IActionResult> GetTechniciansByService(int serviceCatalogId)
        {
            var technicians = await _context.TechnicianServices
                .Where(ts => ts.ServiceCatalogId == serviceCatalogId && ts.IsActive)
                .Join(_context.Users.Where(u => u.IsActive),
                    ts => ts.TechnicianId,
                    u => u.Id,
                    (ts, u) => new
                    {
                        Id = u.Id,
                        FullName = u.FullName,
                        Level = ts.Level,
                        CurrentTicketCount = 0
                    })
                .ToListAsync();

            return Ok(technicians);
        }

        /// <summary>
        /// HU7 — Reasignación al escalar: técnico del servicio y nivel solicitado.
        /// </summary>
        [HttpGet("byservice/{serviceCatalogId}/level/{level}")]
        public async Task<IActionResult> GetTechniciansByServiceAndLevel(int serviceCatalogId, int level)
        {
            var technicians = await _context.TechnicianServices
                .Where(ts => ts.ServiceCatalogId == serviceCatalogId
                          && ts.Level == level
                          && ts.IsActive)
                .Join(_context.Users.Where(u => u.IsActive),
                    ts => ts.TechnicianId,
                    u => u.Id,
                    (ts, u) => new
                    {
                        Id = u.Id,
                        FullName = u.FullName,
                        Level = ts.Level
                    })
                .ToListAsync();

            if (!technicians.Any())
                return NotFound(new { message = $"No hay técnicos activos para el servicio {serviceCatalogId} en nivel N{level}" });

            return Ok(technicians);
        }

        // ============================================================
        // GESTIÓN DE ASIGNACIONES (Admin)
        // ============================================================

        /// <summary>
        /// Listar todos los técnicos del sistema (usuarios con rol técnico).
        /// El campo Level se calcula a partir del rol.
        /// </summary>
        [HttpGet("list")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllTechnicians()
        {
            var techRoles = new[] { "TecnicoN1", "TecnicoN2", "DITIC", "Proveedor" };

            var technicians = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.IsActive && techRoles.Contains(u.Role.Name))
                .Select(u => new
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role.Name
                })
                .ToListAsync();

            // Calcular el nivel en memoria (el switch no se traduce a SQL)
            var result = technicians.Select(t => new
            {
                t.Id,
                t.FullName,
                t.Email,
                t.Role,
                Level = RoleToLevel(t.Role) ?? 1
            });

            return Ok(result);
        }

        /// <summary>
        /// Listar todas las asignaciones técnico → servicio.
        /// Opcional: filtrar por technicianId.
        /// </summary>
        [HttpGet("assignments")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAssignments([FromQuery] int? technicianId = null)
        {
            var query = _context.TechnicianServices.AsQueryable();
            if (technicianId.HasValue)
                query = query.Where(ts => ts.TechnicianId == technicianId.Value);

            var list = await query
                .Join(_context.Users.Include(u => u.Role),
                    ts => ts.TechnicianId,
                    u => u.Id,
                    (ts, u) => new TechnicianServiceResponseDto
                    {
                        Id = ts.Id,
                        TechnicianId = ts.TechnicianId,
                        TechnicianName = u.FullName,
                        TechnicianEmail = u.Email,
                        TechnicianRole = u.Role.Name,
                        ServiceCatalogId = ts.ServiceCatalogId,
                        Level = ts.Level,
                        IsActive = ts.IsActive
                    })
                .OrderBy(x => x.TechnicianName)
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// Asignar un servicio a un técnico.
        /// El nivel de atención se deriva automáticamente del rol del técnico
        /// (TecnicoN1=1, TecnicoN2=2, DITIC=3, Proveedor=4), según HU7.
        /// </summary>
        [HttpPost("assignments")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAssignment([FromBody] TechnicianServiceDto dto)
        {
            // Validar que el técnico exista
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == dto.TechnicianId);

            if (user == null)
                return NotFound(new { message = "Técnico no encontrado" });

            // El nivel se DERIVA del rol — no se permite editarlo manualmente
            // para garantizar el escalamiento progresivo de HU7.
            var level = RoleToLevel(user.Role.Name);
            if (level == null)
                return BadRequest(new
                {
                    message = $"El usuario tiene rol '{user.Role.Name}', que no es un rol técnico. " +
                              "Solo TecnicoN1, TecnicoN2, DITIC o Proveedor pueden tener servicios asignados."
                });

            // Verificar duplicado (mismo técnico + servicio)
            // Como el nivel viene del rol, no permite duplicar técnico↔servicio.
            var exists = await _context.TechnicianServices.AnyAsync(ts =>
                ts.TechnicianId == dto.TechnicianId &&
                ts.ServiceCatalogId == dto.ServiceCatalogId);

            if (exists)
                return Conflict(new { message = "Este técnico ya tiene asignado ese servicio" });

            var assignment = new TechnicianService
            {
                TechnicianId = dto.TechnicianId,
                ServiceCatalogId = dto.ServiceCatalogId,
                Level = level.Value,
                IsActive = true
            };

            _context.TechnicianServices.Add(assignment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAssignmentById), new { id = assignment.Id }, new
            {
                message = "Asignación creada correctamente",
                id = assignment.Id
            });
        }

        [HttpGet("assignments/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAssignmentById(int id)
        {
            var ts = await _context.TechnicianServices.FindAsync(id);
            if (ts == null) return NotFound(new { message = "Asignación no encontrada" });
            return Ok(ts);
        }

        /// <summary>
        /// Activar / desactivar una asignación (no se borra: histórico).
        /// </summary>
        [HttpPatch("assignments/{id}/active")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleActive(int id, [FromBody] bool isActive)
        {
            var ts = await _context.TechnicianServices.FindAsync(id);
            if (ts == null) return NotFound(new { message = "Asignación no encontrada" });

            ts.IsActive = isActive;
            await _context.SaveChangesAsync();

            return Ok(new { message = isActive ? "Asignación activada" : "Asignación desactivada" });
        }

        /// <summary>
        /// Eliminar una asignación de la base de datos.
        /// </summary>
        [HttpDelete("assignments/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAssignment(int id)
        {
            var ts = await _context.TechnicianServices.FindAsync(id);
            if (ts == null) return NotFound(new { message = "Asignación no encontrada" });

            _context.TechnicianServices.Remove(ts);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Asignación eliminada" });
        }
    }
}
