using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceC.API.Data;
using MicroserviceC.API.Models.DTOs;
using MicroserviceC.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;

namespace MicroserviceC.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DamageCatalogController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DamageCatalogController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.DamageCatalogs
                .Select(d => new DamageCatalogDto
                {
                    Id = d.Id,
                    Code = d.Code,
                    Name = d.Name,
                    Description = d.Description,
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
                Code = item.Code,
                Name = item.Name,
                Description = item.Description,
                IsActive = item.IsActive
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateDamageDto dto)
        {
            // Verificar código único
            bool codeExists = await _context.DamageCatalogs
                .AnyAsync(d => d.Code == dto.Code.ToUpper());
            if (codeExists)
                return BadRequest(new { message = "Ya existe una categoría con ese código" });

            var item = new DamageCatalog
            {
                Code = dto.Code.ToUpper().Trim(),
                Name = dto.Name,
                Description = dto.Description,
                IsActive = true
            };
            _context.DamageCatalogs.Add(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Categoría creada", id = item.Id });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateDamageDto dto)
        {
            var item = await _context.DamageCatalogs.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Categoría no encontrada" });

            // Verificar código único (excepto el actual)
            bool codeExists = await _context.DamageCatalogs
                .AnyAsync(d => d.Code == dto.Code.ToUpper() && d.Id != id);
            if (codeExists)
                return BadRequest(new { message = "Ya existe otra categoría con ese código" });

            item.Code = dto.Code.ToUpper().Trim();
            item.Name = dto.Name;
            item.Description = dto.Description;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Categoría actualizada" });
        }

        // DELETE: api/damagecatalog/5 - Eliminación física
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.DamageCatalogs.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "Categoría no encontrada" });

            // ✅ Eliminación física (borrar de la base de datos)
            _context.DamageCatalogs.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Categoría eliminada permanentemente" });
        }

        // GET: api/damagecatalog/active - Solo activos (para selects)
        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var items = await _context.DamageCatalogs
                .Where(d => d.IsActive)
                .Select(d => new { d.Id, d.Name, d.Code })
                .ToListAsync();
            return Ok(items);
        }
    }
}