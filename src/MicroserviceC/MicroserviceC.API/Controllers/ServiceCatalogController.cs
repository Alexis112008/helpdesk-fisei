using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceC.API.Data;
using MicroserviceC.API.Models.DTOs;
using MicroserviceC.API.Models.Entities;

namespace MicroserviceC.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceCatalogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServiceCatalogController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.ServiceCatalogs
                .Include(s => s.DamageCatalog)
                .Where(s => s.IsActive)
                .Select(s => new ServiceCatalogDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    Category = s.Category,
                    AttentionLevel = s.AttentionLevel,
                    IsActive = s.IsActive,
                    DamageCatalogId = s.DamageCatalogId,
                    DamageName = s.DamageCatalog.Name
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("by-damage/{damageId}")]
        public async Task<IActionResult> GetByDamage(int damageId)
        {
            var items = await _context.ServiceCatalogs
                .Include(s => s.DamageCatalog)
                .Where(s => s.DamageCatalogId == damageId && s.IsActive)
                .Select(s => new ServiceCatalogDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    Category = s.Category,
                    AttentionLevel = s.AttentionLevel,
                    IsActive = s.IsActive,
                    DamageCatalogId = s.DamageCatalogId,
                    DamageName = s.DamageCatalog.Name
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateServiceDto dto)
        {
            var damage = await _context.DamageCatalogs.FindAsync(dto.DamageCatalogId);
            if (damage == null)
                return BadRequest(new { message = "Categoría de daño no válida" });

            var item = new ServiceCatalog
            {
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                AttentionLevel = dto.AttentionLevel,
                DamageCatalogId = dto.DamageCatalogId,
                IsActive = true
            };

            _context.ServiceCatalogs.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Servicio creado", id = item.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateServiceDto dto)
        {
            var item = await _context.ServiceCatalogs.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Servicio no encontrado" });

            item.Name = dto.Name;
            item.Description = dto.Description;
            item.Category = dto.Category;
            item.AttentionLevel = dto.AttentionLevel;
            item.DamageCatalogId = dto.DamageCatalogId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Servicio actualizado" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var item = await _context.ServiceCatalogs.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Servicio no encontrado" });

            item.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Servicio desactivado" });
        }
    }
}