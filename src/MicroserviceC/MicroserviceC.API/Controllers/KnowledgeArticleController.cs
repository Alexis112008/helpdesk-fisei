using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceC.API.Data;
using MicroserviceC.API.Models.DTOs;
using MicroserviceC.API.Models.Entities;

namespace MicroserviceC.API.Controllers
{
    /// <summary>
    /// HU8 — T8.2: CRUD de artículos + búsqueda.
    /// </summary>
    [ApiController]
    [Route("api/knowledge")]
    public class KnowledgeArticleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KnowledgeArticleController(AppDbContext context)
        {
            _context = context;
        }

        private static KnowledgeArticleResponseDto Map(KnowledgeArticle a) => new()
        {
            Id = a.Id,
            Title = a.Title,
            Problem = a.Problem,
            Cause = a.Cause,
            Symptoms = a.Symptoms,
            Solution = a.Solution,
            Category = a.Category,
            TicketId = a.TicketId,
            TicketNumber = a.TicketNumber,
            CreatedByUserId = a.CreatedByUserId,
            CreatedByName = a.CreatedByName,
            ViewCount = a.ViewCount,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };

        /// <summary>HU8 — T8.4: búsqueda por categoría o palabra clave.</summary>
        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string? q,
            [FromQuery] string? category)
        {
            var query = _context.KnowledgeArticles.AsQueryable();

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(a => a.Category == category);

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim().ToLower();
                query = query.Where(a =>
                    a.Title.ToLower().Contains(term) ||
                    a.Problem.ToLower().Contains(term) ||
                    a.Symptoms.ToLower().Contains(term) ||
                    a.Solution.ToLower().Contains(term));
            }

            var list = await query
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => Map(a))
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>Categorías disponibles (distinct).</summary>
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var cats = await _context.KnowledgeArticles
                .Select(a => a.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
            return Ok(cats);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var article = await _context.KnowledgeArticles.FindAsync(id);
            if (article == null) return NotFound(new { message = "Artículo no encontrado" });

            article.ViewCount++;
            await _context.SaveChangesAsync();

            return Ok(Map(article));
        }

        /// <summary>
        /// HU8 — T8.3: Búsqueda por ticket (usado por MicroserviceB
        /// para validar que existe artículo antes de cerrar).
        /// </summary>
        [HttpGet("byticket/{ticketId}")]
        public async Task<IActionResult> GetByTicket(int ticketId)
        {
            var article = await _context.KnowledgeArticles
                .FirstOrDefaultAsync(a => a.TicketId == ticketId);

            if (article == null)
                return NotFound(new { message = "No hay artículo registrado para este ticket" });

            return Ok(Map(article));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateKnowledgeArticleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Problem)
                || string.IsNullOrWhiteSpace(dto.Cause)
                || string.IsNullOrWhiteSpace(dto.Symptoms)
                || string.IsNullOrWhiteSpace(dto.Solution))
            {
                return BadRequest(new { message = "Problema, causa, síntomas y solución son obligatorios" });
            }

            // No duplicar artículo por ticket
            var exists = await _context.KnowledgeArticles
                .AnyAsync(a => a.TicketId == dto.TicketId);
            if (exists)
                return Conflict(new { message = "Este ticket ya tiene un artículo registrado" });

            var article = new KnowledgeArticle
            {
                Title = string.IsNullOrWhiteSpace(dto.Title) ? dto.Problem : dto.Title,
                Problem = dto.Problem,
                Cause = dto.Cause,
                Symptoms = dto.Symptoms,
                Solution = dto.Solution,
                Category = dto.Category,
                TicketId = dto.TicketId,
                TicketNumber = dto.TicketNumber,
                CreatedByUserId = dto.CreatedByUserId,
                CreatedByName = dto.CreatedByName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.KnowledgeArticles.Add(article);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = article.Id }, Map(article));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateKnowledgeArticleDto dto)
        {
            var article = await _context.KnowledgeArticles.FindAsync(id);
            if (article == null) return NotFound(new { message = "Artículo no encontrado" });

            if (!string.IsNullOrWhiteSpace(dto.Title)) article.Title = dto.Title;
            if (!string.IsNullOrWhiteSpace(dto.Problem)) article.Problem = dto.Problem;
            if (!string.IsNullOrWhiteSpace(dto.Cause)) article.Cause = dto.Cause;
            if (!string.IsNullOrWhiteSpace(dto.Symptoms)) article.Symptoms = dto.Symptoms;
            if (!string.IsNullOrWhiteSpace(dto.Solution)) article.Solution = dto.Solution;
            if (!string.IsNullOrWhiteSpace(dto.Category)) article.Category = dto.Category;
            article.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(Map(article));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var article = await _context.KnowledgeArticles.FindAsync(id);
            if (article == null) return NotFound(new { message = "Artículo no encontrado" });

            _context.KnowledgeArticles.Remove(article);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Artículo eliminado" });
        }
    }
}
