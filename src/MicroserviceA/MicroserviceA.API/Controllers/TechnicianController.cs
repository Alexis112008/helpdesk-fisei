using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceA.API.Data;
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

        [HttpGet("byservice/{serviceCatalogId}")]
        public async Task<IActionResult> GetTechniciansByService(int serviceCatalogId)
        {
            // Obtener técnicos que tienen este servicio en TechnicianServices
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
                        // Aquí podrías consultar cuántos tickets activos tiene
                        // Eso viene de MicroserviceB, por ahora solo 0
                        CurrentTicketCount = 0
                    })
                .ToListAsync();

            return Ok(technicians);
        }
    }
}