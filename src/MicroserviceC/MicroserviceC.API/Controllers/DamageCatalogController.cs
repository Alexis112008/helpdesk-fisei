using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceC.API.Data;
using MicroserviceC.API.Models.DTOs;
using MicroserviceC.API.Models.Entities;

namespace MicroserviceC.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DamageCatalogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DamageCatalogController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.DamageCatalogs
                .Where(d => d.IsActive)
                .Select(d => new DamageCatalogDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    AttentionLevel = d.AttentionLevel,
                    IsActive = d.IsActive
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.DamageCatalogs.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Categoría no encontrada" });

            return Ok(new DamageCatalogDto
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                AttentionLevel = item.AttentionLevel,
                IsActive = item.IsActive
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDamageDto dto)
        {
            var item = new DamageCatalog
            {
                Name = dto.Name,
                Description = dto.Description,
                AttentionLevel = dto.AttentionLevel,
                IsActive = true
            };

            _context.DamageCatalogs.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Categoría creada", id = item.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateDamageDto dto)
        {
            var item = await _context.DamageCatalogs.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Categoría no encontrada" });

            item.Name = dto.Name;
            item.Description = dto.Description;
            item.AttentionLevel = dto.AttentionLevel;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Categoría actualizada" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var item = await _context.DamageCatalogs.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Categoría no encontrada" });

            item.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Categoría desactivada" });
        }
    }
}