using MicroserviceC.API.Data;
using MicroserviceC.API.Models.DTOs;
using MicroserviceC.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            UpdatedAt = a.UpdatedAt,
            IsActive = a.IsActive 
        };

        /// <summary>HU8 — T8.4: búsqueda por categoría o palabra clave.</summary>
        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string? q,
            [FromQuery] string? category,
             [FromQuery] bool includeInactive = false) 
        {
            var query = _context.KnowledgeArticles.AsQueryable();

            if (!includeInactive)
                query = query.Where(a => a.IsActive);

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(a => a.Category == category);

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim().ToLower();
                query = query.Where(a =>
                    a.Title.ToLower().Contains(term) ||
                    a.Problem.ToLower().Contains(term) ||   // ← Buscar en Problem (problema+síntomas)
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
            // Validación: ahora solo Problem (que incluye síntomas), Cause y Solution
            if (string.IsNullOrWhiteSpace(dto.Problem)
                || string.IsNullOrWhiteSpace(dto.Cause)
                || string.IsNullOrWhiteSpace(dto.Solution))
            {
                return BadRequest(new { message = "Problema y síntomas, causa y solución son obligatorios" });
            }

            // No duplicar artículo por ticket
            var exists = await _context.KnowledgeArticles
                .AnyAsync(a => a.TicketId == dto.TicketId);
            if (exists)
                return Conflict(new { message = "Este ticket ya tiene un artículo registrado" });

            var article = new KnowledgeArticle
            {
                Title = string.IsNullOrWhiteSpace(dto.Title) ? dto.Problem : dto.Title,
                Problem = dto.Problem,      // ← Guarda el texto completo (problema + síntomas)
                Symptoms = dto.Problem,     // ← Guarda el MISMO texto en Symptoms (para mantener compatibilidad)
                Cause = dto.Cause,
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
            if (!string.IsNullOrWhiteSpace(dto.Problem))
            {
                article.Problem = dto.Problem;
                article.Symptoms = dto.Problem;  // ← Mantener sincronizado
            }
            if (!string.IsNullOrWhiteSpace(dto.Cause)) article.Cause = dto.Cause;
            if (!string.IsNullOrWhiteSpace(dto.Solution)) article.Solution = dto.Solution;
            if (!string.IsNullOrWhiteSpace(dto.Category)) article.Category = dto.Category;
            article.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(Map(article));
        }

[HttpDelete("{id}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> Delete(int id)
{
    var article = await _context.KnowledgeArticles.FindAsync(id);
    if (article == null)
        return NotFound(new { message = "Artículo no encontrado" });

    // ✅ Soft delete: solo desactivar, no eliminar
    article.IsActive = false;
    await _context.SaveChangesAsync();

    return Ok(new { message = "Artículo desactivado correctamente" });
}

[HttpPost("{id}/reactivate")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> Reactivate(int id)
{
    var article = await _context.KnowledgeArticles.FindAsync(id);
    if (article == null)
        return NotFound(new { message = "Artículo no encontrado" });

    article.IsActive = true;
    await _context.SaveChangesAsync();

    return Ok(new { message = "Artículo reactivado correctamente" });
}

        /// <summary>
        /// Subir imágenes asociadas a un artículo de conocimiento
        /// </summary>
        [HttpPost("attachments")]
        [Authorize]
        public async Task<IActionResult> UploadSolutionAttachments([FromForm] List<IFormFile> files, [FromForm] int articleId)
        {
            Console.WriteLine($"=== UploadSolutionAttachments llamado ===");
            Console.WriteLine($"articleId: {articleId}");
            Console.WriteLine($"files count: {files?.Count ?? 0}");

            try
            {
                if (files == null || files.Count == 0)
                {
                    Console.WriteLine("No se enviaron archivos");
                    return BadRequest(new { message = "No se enviaron archivos" });
                }

                var article = await _context.KnowledgeArticles.FindAsync(articleId);
                if (article == null)
                {
                    Console.WriteLine($"Artículo {articleId} no encontrado");
                    return NotFound(new { message = "Artículo no encontrado" });
                }

                Console.WriteLine($"Artículo encontrado: {article.Id}");

                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp" };
                var uploadedFiles = new List<object>();

                foreach (var file in files)
                {
                    Console.WriteLine($"Procesando archivo: {file.FileName}, tamaño: {file.Length}");

                    if (file.Length > 5 * 1024 * 1024)
                    {
                        Console.WriteLine($"Archivo {file.FileName} excede 5MB, ignorado");
                        continue;
                    }

                    if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    {
                        Console.WriteLine($"Tipo no permitido: {file.ContentType}");
                        continue;
                    }

                    using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);

                    var attachment = new KnowledgeArticleAttachment
                    {
                        KnowledgeArticleId = articleId,
                        FileName = file.FileName,
                        FileSize = (int)file.Length,
                        FileType = file.ContentType,
                        FileData = memoryStream.ToArray(),
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.KnowledgeArticleAttachments.Add(attachment);
                    uploadedFiles.Add(new { id = attachment.Id, fileName = attachment.FileName });
                    Console.WriteLine($"Archivo guardado con ID: {attachment.Id}");
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"Total guardados: {uploadedFiles.Count}");

                return Ok(new { message = $"{uploadedFiles.Count} imágenes subidas", files = uploadedFiles });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: {ex.Message}");
                Console.WriteLine($"STACK: {ex.StackTrace}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Obtener imágenes de un artículo de conocimiento
        /// </summary>
        [HttpGet("{articleId}/attachments")]
        [Authorize]
        public async Task<IActionResult> GetSolutionAttachments(int articleId)
        {
            var attachments = await _context.KnowledgeArticleAttachments
                .Where(a => a.KnowledgeArticleId == articleId)
                .Select(a => new
                {
                    a.Id,
                    a.FileName,
                    a.FileSize,
                    a.FileType,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(attachments);
        }

        /// <summary>
        /// Descargar una imagen de solución
        /// </summary>
        [HttpGet("attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadSolutionAttachment(int attachmentId)
        {
            var attachment = await _context.KnowledgeArticleAttachments.FindAsync(attachmentId);

            if (attachment == null)
                return NotFound();

            return File(attachment.FileData, attachment.FileType, attachment.FileName);
        }
    }
}
