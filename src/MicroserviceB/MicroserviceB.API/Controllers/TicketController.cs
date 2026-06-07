using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Data;
using MicroserviceB.API.Events;
using MicroserviceB.API.Messaging;
using MicroserviceB.API.Models.DTOs;
using MicroserviceB.API.Models.Entities;
using MicroserviceB.API.Services;
using Microsoft.AspNetCore.Http;

namespace MicroserviceB.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITicketAssignmentService _assignmentService;
        private readonly IEscalationService _escalationService;
        private readonly ITicketActionService _actionService;
        private readonly IEventBus _eventBus;
        private readonly IUserLookupService _userLookup;
        private readonly IRealtimeNotifier _realtime;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<TicketController> _logger;

        public TicketController(
            AppDbContext context,
            ITicketAssignmentService assignmentService,
            IEscalationService escalationService,
            ITicketActionService actionService,
            IEventBus eventBus,
            IUserLookupService userLookup,
            IRealtimeNotifier realtime,
            IFileStorageService fileStorage,
            ILogger<TicketController> logger)
        {
            _context = context;
            _assignmentService = assignmentService;
            _escalationService = escalationService;
            _actionService = actionService;
            _eventBus = eventBus;
            _userLookup = userLookup;
            _realtime = realtime;
            _fileStorage = fileStorage;
            _logger = logger;
        }

        // ---------- Helpers ----------
        private static string GetLevelName(int level) => level switch
        {
            1 => "Técnico Básico",
            2 => "Técnico Profesional",
            3 => "DITIC",
            4 => "Proveedor Externo",
            _ => "Desconocido"
        };

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
            Location = t.Location,
            AssetCode = t.AssetCode,
            AssignedTechnicianId = t.AssignedTechnicianId,
            ServiceCatalogId = t.ServiceCatalogId
        };

        /// <summary>Lee userId, nombre y rol del JWT.</summary>
        private (int userId, string fullName, string role) GetCurrentUser()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
            int.TryParse(idStr, out var userId);
            var fullName = User.FindFirstValue(ClaimTypes.Name) ?? "Usuario";
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "";
            return (userId, fullName, role);
        }

        /// <summary>Mapea rol → nivel técnico.</summary>
        private static int? RoleToLevel(string role) => role switch
        {
            "TecnicoN1" => 1,
            "TecnicoN2" => 2,
            "DITIC" => 3,
            "Proveedor" => 4,
            _ => null
        };

        // ============================================================
        // CRUD básico (existente) - MODIFICADO CON FILTROS
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? technicianId)
        {
            var query = _context.Tickets.AsQueryable();

            // Aplicar filtros
            if (startDate.HasValue)
                query = query.Where(t => t.CreatedAt >= startDate.Value);
            
            if (endDate.HasValue)
                query = query.Where(t => t.CreatedAt <= endDate.Value);
            
            if (technicianId.HasValue)
                query = query.Where(t => t.AssignedTechnicianId == technicianId.Value);

            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => MapToDto(t))
                .ToListAsync();

            return Ok(tickets);
        }

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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null) return NotFound(new { message = "Ticket no encontrado" });
            return Ok(MapToDto(ticket));
        }

        // ============================================================
        // HU5 — Panel del Técnico
        // ============================================================

        /// <summary>
        /// HU5 — T5.1: Tickets ASIGNADOS al técnico autenticado.
        /// Filtrado opcional por estado.
        /// </summary>
        [Authorize]
        [HttpGet("assigned")]
        public async Task<IActionResult> GetAssigned([FromQuery] string? status)
        {
            var (userId, _, role) = GetCurrentUser();
            var level = RoleToLevel(role);
            if (level == null)
                return Forbid();

            var query = _context.Tickets
                .Where(t => t.AssignedTechnicianId == userId);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.Status == status);

            var list = await query
                .OrderByDescending(t => t.UpdatedAt)
                .Select(t => MapToDto(t))
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// HU5 — Tickets DISPONIBLES (sin asignar) en el nivel del técnico
        /// y que correspondan a alguno de los servicios que él atiende.
        /// Es el "pool" del nivel que el técnico puede aceptar.
        /// </summary>
        [Authorize]
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable(
            [FromServices] IHttpClientFactory httpFactory)
        {
            var (userId, _, role) = GetCurrentUser();
            var level = RoleToLevel(role);
            if (level == null)
                return Forbid();

            // 1. Pedir a Microservicio A los IDs de servicios que atiende este técnico.
            var serviceIds = await GetMyServiceIdsAsync(httpFactory, userId);

            var query = _context.Tickets
                .Where(t =>
                    t.AssignedTechnicianId == null
                    && t.CurrentLevel == level
                    && t.Status == "Abierto");

            if (serviceIds != null && serviceIds.Count > 0)
                query = query.Where(t => serviceIds.Contains(t.ServiceCatalogId));

            var list = await query
                .OrderBy(t => t.CreatedAt)
                .Select(t => MapToDto(t))
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// HU5 — El técnico autenticado acepta un ticket disponible del pool.
        /// </summary>
        [Authorize]
        [HttpPost("{id}/accept")]
        public async Task<IActionResult> AcceptTicket(int id)
        {
            var (userId, fullName, role) = GetCurrentUser();
            var level = RoleToLevel(role);
            if (level == null)
                return Forbid();

            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound(new { message = "Ticket no encontrado" });

            if (ticket.AssignedTechnicianId != null)
                return UnprocessableEntity(new { message = "Este ticket ya fue aceptado por otro técnico." });

            if (ticket.CurrentLevel != level)
                return UnprocessableEntity(new { message = $"El ticket está en N{ticket.CurrentLevel} y tú eres N{level}." });

            if (ticket.Status != "Abierto")
                return UnprocessableEntity(new { message = $"Solo se pueden aceptar tickets en estado 'Abierto' (actual: {ticket.Status})." });

            ticket.AssignedTechnicianId = userId;
            ticket.Status = "En Proceso";
            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _actionService.RegisterActionAsync(
                ticketId: ticket.Id, userId: userId, userFullName: fullName,
                actionType: "Accepted",
                description: $"Ticket aceptado por {fullName}.",
                fromValue: "Abierto", toValue: "En Proceso");

            await _realtime.NotifyToUserAsync(
                ticket.UserId,
                "ticket-updated",
                new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    fromStatus = "Abierto",
                    toStatus = "En Proceso",
                    changedBy = fullName
                });

            await _realtime.NotifyToLevelAsync(
                ticket.CurrentLevel,
                "ticket-taken",
                new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    takenBy = userId
                });

            return Ok(new
            {
                message = "Ticket aceptado correctamente",
                ticketId = ticket.Id,
                status = ticket.Status
            });
        }

        // Helper: obtiene los IDs de servicios que atiende un técnico
        private async Task<List<int>?> GetMyServiceIdsAsync(IHttpClientFactory httpFactory, int technicianId)
        {
            try
            {
                var client = httpFactory.CreateClient("AuthClient");
                var resp = await client.GetAsync($"/api/technicians/assignments?technicianId={technicianId}");
                if (!resp.IsSuccessStatusCode) return null;

                using var stream = await resp.Content.ReadAsStreamAsync();
                using var doc = await System.Text.Json.JsonDocument.ParseAsync(stream);

                var ids = new List<int>();
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    if (el.TryGetProperty("isActive", out var act) && !act.GetBoolean())
                        continue;
                    if (el.TryGetProperty("serviceCatalogId", out var sid))
                        ids.Add(sid.GetInt32());
                }
                return ids;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TicketController] No se pudieron obtener servicios del técnico: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// ADMIN: Asignar ticket manualmente a un técnico
        /// </summary>
        [HttpPost("{id}/assign-to-technician")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignToTechnician(int id, [FromBody] AssignTicketDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound(new { message = "Ticket no encontrado" });

            if (ticket.AssignedTechnicianId != null)
                return BadRequest(new { message = "El ticket ya está asignado a un técnico" });

            if (ticket.Status != "Abierto")
                return BadRequest(new { message = "El ticket debe estar en estado 'Abierto' para ser asignado" });

            ticket.AssignedTechnicianId = dto.TechnicianId;
            ticket.Status = "En Proceso";
            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var (adminId, adminName, _) = GetCurrentUser();
            await _actionService.RegisterActionAsync(
                ticketId: id,
                userId: adminId,
                userFullName: adminName,
                actionType: "Assigned",
                description: $"Ticket asignado manualmente por administrador al técnico ID: {dto.TechnicianId}",
                fromValue: "Abierto",
                toValue: "En Proceso");

            await _realtime.NotifyToUserAsync(
                dto.TechnicianId,
                "ticket-assigned",
                new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    title = ticket.Title
                });

            return Ok(new { message = $"Ticket asignado correctamente al técnico ID: {dto.TechnicianId}" });
        }

        /// <summary>
        /// HU5 — T5.1: Detalle del ticket + historial de acciones.
        /// </summary>
        [Authorize]
        [HttpGet("{id}/detail")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null) return NotFound(new { message = "Ticket no encontrado" });

            var (userId, _, role) = GetCurrentUser();
            var isOwner = ticket.UserId == userId;
            var isAssignedTech = ticket.AssignedTechnicianId == userId;
            var isAdmin = role == "Admin";
            var isAnyTechnician = RoleToLevel(role) != null;

            if (!isOwner && !isAssignedTech && !isAdmin && !isAnyTechnician)
                return Forbid();

            var actions = await _actionService.GetActionsByTicketAsync(id);

            return Ok(new TicketDetailDto
            {
                Ticket = MapToDto(ticket),
                Actions = actions
            });
        }

        /// <summary>
        /// HU5 — T5.3: Registrar comentario/acción sobre un ticket.
        /// </summary>
        [Authorize]
        [HttpPost("{id}/actions")]
        public async Task<IActionResult> AddAction(int id, [FromBody] CreateTicketActionDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null) return NotFound(new { message = "Ticket no encontrado" });

            var (userId, fullName, role) = GetCurrentUser();
            var isOwner = ticket.UserId == userId;
            var isAssignedTech = ticket.AssignedTechnicianId == userId;
            var isAdmin = role == "Admin";

            if (!isOwner && !isAssignedTech && !isAdmin)
                return Forbid();

            var requestedType = string.IsNullOrWhiteSpace(dto.ActionType) ? "Comment" : dto.ActionType;
            var allowedForOwner = new[] { "Comment", "Acceptance" };
            
            if (isOwner && !isAssignedTech && !isAdmin && !allowedForOwner.Contains(requestedType))
                return UnprocessableEntity(new { message = "Como solicitante solo puedes registrar comentarios o aceptar la solución." });

            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest(new { message = "La descripción del comentario es obligatoria." });

            if (ticket.Status == "Cerrado")
                return UnprocessableEntity(new { message = "No se puede comentar un ticket cerrado." });

            var action = await _actionService.RegisterActionAsync(
                ticketId: id,
                userId: userId,
                userFullName: fullName,
                actionType: requestedType,
                description: dto.Description);

            await _realtime.NotifyTicketUpdatedAsync(
                ticketId: ticket.Id,
                userId: ticket.UserId,
                technicianId: ticket.AssignedTechnicianId,
                level: ticket.CurrentLevel,
                eventType: "ticket-action-added",
                payload: new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    action,
                    fromUser = isOwner ? "solicitante" : "tecnico"
                },
                actorUserId: userId);

            return Ok(new { message = "Acción registrada", actionId = action.Id });
        }

        /// <summary>
        /// HU5 — T5.2: Actualizar estado con validación de transiciones permitidas.
        /// </summary>
        [Authorize]
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> PatchStatus(int id, [FromBody] UpdateTicketStatusDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null) return NotFound(new { message = "Ticket no encontrado" });

            var (userId, fullName, _) = GetCurrentUser();
            var from = ticket.Status;
            var to = dto.Status;

            if (!IsTransitionAllowed(from, to))
            {
                return UnprocessableEntity(new
                {
                    message = "Transición de estado no permitida",
                    from,
                    to
                });
            }

            if (to == "Cerrado")
            {
                return UnprocessableEntity(new
                {
                    message = "Para cerrar el ticket use POST /api/ticket/{id}/close"
                });
            }

            ticket.Status = to;
            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _actionService.RegisterActionAsync(
                ticketId: id, userId: userId, userFullName: fullName,
                actionType: "StatusChange",
                description: $"Estado cambiado de '{from}' a '{to}'",
                fromValue: from, toValue: to);

            var user = await _userLookup.GetByIdAsync(ticket.UserId);
            await _eventBus.PublishAsync(new TicketUpdatedEvent
            {
                TicketId = ticket.Id,
                TicketNumber = ticket.TicketNumber,
                UserId = ticket.UserId,
                UserEmail = user?.Email ?? "",
                UserFullName = user?.FullName ?? "",
                Title = ticket.Title,
                AssignedTechnicianId = ticket.AssignedTechnicianId,
                CurrentLevel = ticket.CurrentLevel,
                FromStatus = from,
                ToStatus = to,
                ChangedByName = fullName
            });

            if (to == "Resuelto")
            {
                await _eventBus.PublishAsync(new TicketResolvedEvent
                {
                    TicketId = ticket.Id,
                    TicketNumber = ticket.TicketNumber,
                    UserId = ticket.UserId,
                    UserEmail = user?.Email ?? "",
                    UserFullName = user?.FullName ?? "",
                    Title = ticket.Title,
                    AssignedTechnicianId = ticket.AssignedTechnicianId,
                    CurrentLevel = ticket.CurrentLevel,
                    Solution = "Solución registrada por el técnico.",
                    ResolvedByName = fullName
                });

                await _realtime.NotifyTicketUpdatedAsync(
                    ticketId: ticket.Id,
                    userId: ticket.UserId,
                    technicianId: ticket.AssignedTechnicianId,
                    level: ticket.CurrentLevel,
                    eventType: "ticket-resolved",
                    payload: new
                    {
                        ticketId = ticket.Id,
                        ticketNumber = ticket.TicketNumber,
                        resolvedBy = fullName
                    },
                    actorUserId: userId);
            }

            await _realtime.NotifyTicketUpdatedAsync(
                ticketId: ticket.Id,
                userId: ticket.UserId,
                technicianId: ticket.AssignedTechnicianId,
                level: ticket.CurrentLevel,
                eventType: "ticket-updated",
                payload: new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    fromStatus = from,
                    toStatus = to,
                    changedBy = fullName
                },
                actorUserId: userId);

            return Ok(new { message = "Estado actualizado", status = to });
        }

        /// <summary>
        /// Cerrar un ticket (el usuario aceptó la solución)
        /// </summary>
        [HttpPost("{id}/close")]
        [Authorize]
        public async Task<IActionResult> Close(int id)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null) return NotFound(new { message = "Ticket no encontrado" });

            if (ticket.Status != "Resuelto")
                return UnprocessableEntity(new { message = "Solo se pueden cerrar tickets en estado 'Resuelto'." });

            var (userId, fullName, role) = GetCurrentUser();

            var from = ticket.Status;
            ticket.Status = "Cerrado";
            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _actionService.RegisterActionAsync(
                ticketId: id, userId: userId, userFullName: fullName,
                actionType: "Closure",
                description: "Ticket cerrado por el usuario.",
                fromValue: from, toValue: "Cerrado");

            var user = await _userLookup.GetByIdAsync(ticket.UserId);
            await _eventBus.PublishAsync(new TicketClosedEvent
            {
                TicketId = ticket.Id,
                TicketNumber = ticket.TicketNumber,
                UserId = ticket.UserId,
                UserEmail = user?.Email ?? "",
                UserFullName = user?.FullName ?? "",
                Title = ticket.Title,
                AssignedTechnicianId = ticket.AssignedTechnicianId,
                CurrentLevel = ticket.CurrentLevel,
                Solution = "Ticket cerrado por el usuario"
            });

            await _realtime.NotifyTicketUpdatedAsync(
                ticketId: ticket.Id,
                userId: ticket.UserId,
                technicianId: ticket.AssignedTechnicianId,
                level: ticket.CurrentLevel,
                eventType: "ticket-closed",
                payload: new { ticketId = ticket.Id, ticketNumber = ticket.TicketNumber },
                actorUserId: userId);

            return Ok(new { message = "Ticket cerrado correctamente" });
        }

        private static bool IsTransitionAllowed(string from, string to)
        {
            var validStates = new[] { "Abierto", "En Proceso", "Escalado", "Resuelto", "Cerrado", "Vencido" };
            if (!validStates.Contains(to)) return false;

            var allowed = new Dictionary<string, string[]>
            {
                ["Abierto"] = new[] { "En Proceso", "Escalado" },
                ["En Proceso"] = new[] { "Escalado", "Resuelto" },
                ["Escalado"] = new[] { "En Proceso", "Resuelto" },
                ["Resuelto"] = new[] { "Cerrado", "En Proceso" },
                ["Vencido"] = new[] { "En Proceso" },
                ["Cerrado"] = Array.Empty<string>()
            };

            return allowed.TryGetValue(from, out var dests) && dests.Contains(to);
        }

        // ============================================================
        // POST (crear) — refactor para emitir evento
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateTicketDto dto, [FromForm] List<IFormFile>? files)
        {
            _logger.LogInformation("=== CREANDO TICKET ===");
            _logger.LogInformation($"DTO: Title={dto.Title}, UserId={dto.UserId}, DamageCatalogId={dto.DamageCatalogId}, ServiceCatalogId={dto.ServiceCatalogId}");
            _logger.LogInformation($"Files recibidos: {files?.Count ?? 0}");

            if (files != null && files.Any())
            {
                foreach (var file in files)
                {
                    _logger.LogInformation($"Archivo: {file.FileName}, Tamaño: {file.Length} bytes, Tipo: {file.ContentType}");
                }
            }
            else
            {
                _logger.LogWarning("⚠️ NO se recibieron archivos en la petición");
            }

            var count = await _context.Tickets.CountAsync();
            var ticketNumber = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

            var ticket = new Ticket
            {
                Location = dto.Location,
                AssetCode = dto.AssetCode,
                TicketNumber = ticketNumber,
                Title = dto.Title,
                Description = dto.Description,
                Priority = dto.Priority,
                Status = "Abierto",
                CurrentLevel = 1,
                AssignedTechnicianId = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UserId = dto.UserId,
                DamageCatalogId = dto.DamageCatalogId,
                ServiceCatalogId = dto.ServiceCatalogId
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Ticket creado con ID: {ticket.Id}, Número: {ticket.TicketNumber}");

            if (files != null && files.Any())
            {
                _logger.LogInformation($"Procesando {files.Count} archivos para el ticket {ticket.Id}");

                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp" };
                var savedCount = 0;

                foreach (var file in files)
                {
                    _logger.LogInformation($"Procesando archivo: {file.FileName}");

                    if (file.Length > 5 * 1024 * 1024)
                    {
                        _logger.LogWarning($"Archivo {file.FileName} excede 5MB, ignorado");
                        continue;
                    }

                    if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    {
                        _logger.LogWarning($"Tipo no permitido: {file.ContentType}, ignorado");
                        continue;
                    }

                    using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);
                    var fileData = memoryStream.ToArray();

                    _logger.LogInformation($"Archivo leído: {fileData.Length} bytes");

                    var attachment = new TicketAttachment
                    {
                        TicketId = ticket.Id,
                        UserId = dto.UserId,
                        FileName = file.FileName,
                        FileSize = (int)file.Length,
                        FileType = file.ContentType,
                        FileData = fileData,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.TicketAttachments.Add(attachment);
                    savedCount++;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Archivos guardados: {savedCount} de {files.Count}");
            }
            else
            {
                _logger.LogInformation("No hay archivos para guardar");
            }

            try
            {
                await _actionService.RegisterActionAsync(
                    ticketId: ticket.Id, userId: dto.UserId, userFullName: "Solicitante",
                    actionType: "Created",
                    description: "Ticket creado. Pendiente de aceptación por un técnico.");
                _logger.LogInformation("Acción inicial registrada");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo registrar acción inicial");
            }

            try
            {
                var user = await _userLookup.GetByIdAsync(dto.UserId);
                await _eventBus.PublishAsync(new TicketCreatedEvent
                {
                    TicketId = ticket.Id,
                    TicketNumber = ticket.TicketNumber,
                    UserId = ticket.UserId,
                    UserEmail = user?.Email ?? "",
                    UserFullName = user?.FullName ?? "",
                    Title = ticket.Title,
                    AssignedTechnicianId = null,
                    CurrentLevel = ticket.CurrentLevel,
                    Priority = ticket.Priority,
                    Description = ticket.Description
                });

                await _realtime.NotifyToUserAsync(
                    ticket.UserId,
                    "ticket-created",
                    new
                    {
                        ticketId = ticket.Id,
                        ticketNumber = ticket.TicketNumber,
                        title = ticket.Title
                    });

                await _realtime.NotifyToLevelAsync(
                    ticket.CurrentLevel,
                    "ticket-available",
                    new
                    {
                        ticketId = ticket.Id,
                        ticketNumber = ticket.TicketNumber,
                        title = ticket.Title,
                        level = ticket.CurrentLevel
                    });

                _logger.LogInformation("Eventos y notificaciones publicados");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publicando eventos");
            }

            return CreatedAtAction(nameof(GetById), new { id = ticket.Id },
                new { message = "Ticket creado", ticketNumber, id = ticket.Id });
        }

        // ============================================================
        // HU7 — Escalamiento con motivo
        // ============================================================

        /// <summary>HU7 — T7.2: Escalamiento con motivo.</summary>
        [Authorize]
        [HttpPost("{id}/escalate")]
        public async Task<IActionResult> EscalateWithReason(int id, [FromBody] EscalateWithReasonDto dto)
        {
            try
            {
                var (userId, fullName, _) = GetCurrentUser();
                
                var ticket = await _context.Tickets.FindAsync(id);
                if (ticket == null)
                    return NotFound(new { message = "Ticket no encontrado" });
                
                if (ticket.AssignedTechnicianId != userId)
                    return UnprocessableEntity(new { message = "No tienes este ticket asignado" });
                
                ticket.AssignedTechnicianId = null;
                
                await _escalationService.ManualEscalateAsync(id, dto.Reason, fullName);
                
                return Ok(new { message = "Ticket escalado correctamente" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return UnprocessableEntity(new { message = ex.Message });
            }
        }

        // ============================================================
        // NUEVOS ENDPOINTS PARA ARCHIVOS ADJUNTOS
        // ============================================================

        /// <summary>
        /// Subir archivos adjuntos a un ticket
        /// </summary>
        [HttpPost("{ticketId}/attachments")]
        [Authorize]
        public async Task<IActionResult> UploadAttachments(int ticketId, [FromForm] List<IFormFile> files)
        {
            try
            {
                _logger.LogInformation($"=== INICIO UploadAttachments ===");
                _logger.LogInformation($"TicketId: {ticketId}");
                _logger.LogInformation($"Files count: {files?.Count ?? 0}");

                var ticket = await _context.Tickets.FindAsync(ticketId);
                if (ticket == null)
                {
                    return NotFound(new { message = "Ticket no encontrado" });
                }

                var (userId, fullName, role) = GetCurrentUser();
                bool isOwner = ticket.UserId == userId;
                bool isAssignedTech = ticket.AssignedTechnicianId == userId;
                bool isAdmin = role == "Admin";

                if (!isOwner && !isAssignedTech && !isAdmin)
                {
                    return Forbid();
                }

                var currentCount = await _context.TicketAttachments.CountAsync(a => a.TicketId == ticketId);
                if (currentCount + files.Count > 5)
                {
                    return BadRequest(new { message = $"Máximo 5 archivos por ticket. Actualmente tienes {currentCount}" });
                }

                var uploadedFiles = new List<object>();
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp" };

                foreach (var file in files)
                {
                    if (file.Length > 5 * 1024 * 1024)
                    {
                        _logger.LogWarning($"Archivo {file.FileName} excede 5MB");
                        continue;
                    }

                    if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    {
                        _logger.LogWarning($"Tipo no permitido: {file.ContentType}");
                        continue;
                    }

                    using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);
                    var fileData = memoryStream.ToArray();

                    var attachment = new TicketAttachment
                    {
                        TicketId = ticketId,
                        UserId = userId,
                        FileName = file.FileName,
                        FileSize = (int)file.Length,
                        FileType = file.ContentType,
                        FileData = fileData,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.TicketAttachments.Add(attachment);
                    await _context.SaveChangesAsync();

                    uploadedFiles.Add(new
                    {
                        id = attachment.Id,
                        fileName = attachment.FileName,
                        fileSize = attachment.FileSize,
                        fileType = attachment.FileType
                    });
                }

                if (uploadedFiles.Count > 0)
                {
                    var actorName = isOwner ? "El solicitante" : fullName;

                    await _actionService.RegisterActionAsync(
                        ticketId: ticket.Id,
                        userId: userId,
                        userFullName: fullName,
                        actionType: "Comment",
                        description: $"{actorName} agregó {uploadedFiles.Count} archivo(s) adjunto(s).",
                        fromValue: null,
                        toValue: null);

                    await _realtime.NotifyTicketUpdatedAsync(
                        ticketId: ticket.Id,
                        userId: ticket.UserId,
                        technicianId: ticket.AssignedTechnicianId,
                        level: ticket.CurrentLevel,
                        eventType: "ticket-attachments-added",
                        payload: new
                        {
                            ticketId = ticket.Id,
                            ticketNumber = ticket.TicketNumber,
                            attachmentsCount = uploadedFiles.Count,
                            newAttachments = uploadedFiles
                        },
                        actorUserId: userId);

                    _logger.LogInformation($"Notificación enviada: {uploadedFiles.Count} archivos agregados al ticket {ticketId}");
                }

                return Ok(new { message = $"{uploadedFiles.Count} archivos subidos", files = uploadedFiles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ERROR en UploadAttachments");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Obtener todos los archivos adjuntos de un ticket
        /// </summary>
        [Authorize]
        [HttpGet("{ticketId}/attachments")]
        public async Task<IActionResult> GetTicketAttachments(int ticketId)
        {
            var attachments = await _context.TicketAttachments
                .Where(a => a.TicketId == ticketId)
                .Select(a => new
                {
                    a.Id,
                    a.FileName,
                    a.FileSize,
                    a.FileType,
                    a.CreatedAt,
                    a.UserId
                })
                .ToListAsync();

            return Ok(attachments);
        }

        /// <summary>
        /// Descargar un archivo adjunto
        /// </summary>
        [Authorize]
        [HttpGet("attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            var attachment = await _context.TicketAttachments.FindAsync(attachmentId);

            if (attachment == null)
                return NotFound(new { message = "Archivo no encontrado" });

            if (attachment.FileData == null || attachment.FileData.Length == 0)
                return NotFound(new { message = "El archivo no contiene datos" });

            var (userId, _, role) = GetCurrentUser();
            var ticket = await _context.Tickets.FindAsync(attachment.TicketId);

            if (ticket != null)
            {
                bool isOwner = ticket.UserId == userId;
                bool isAssignedTech = ticket.AssignedTechnicianId == userId;
                bool isAdmin = role == "Admin";

                if (!isOwner && !isAssignedTech && !isAdmin)
                    return Forbid();
            }

            return File(attachment.FileData, attachment.FileType, attachment.FileName);
        }

        /// <summary>
        /// Eliminar un archivo adjunto
        /// </summary>
        [Authorize]
        [HttpDelete("attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            var attachment = await _context.TicketAttachments.FindAsync(attachmentId);
            if (attachment == null)
                return NotFound(new { message = "Archivo no encontrado" });

            var (userId, fullName, role) = GetCurrentUser();

            bool isOwner = attachment.UserId == userId;
            bool isAdmin = role == "Admin";

            if (!isOwner && !isAdmin)
                return Forbid();

            var ticket = await _context.Tickets.FindAsync(attachment.TicketId);
            if (ticket == null)
                return NotFound(new { message = "Ticket no encontrado" });

            await _actionService.RegisterActionAsync(
                ticketId: ticket.Id,
                userId: userId,
                userFullName: fullName,
                actionType: "Comment",
                description: $"Se eliminó el archivo: {attachment.FileName}",
                fromValue: null,
                toValue: null);

            _context.TicketAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            await _realtime.NotifyTicketUpdatedAsync(
                ticketId: ticket.Id,
                userId: ticket.UserId,
                technicianId: ticket.AssignedTechnicianId,
                level: ticket.CurrentLevel,
                eventType: "ticket-attachment-deleted",
                payload: new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    attachmentId = attachmentId,
                    fileName = attachment.FileName,
                    deletedBy = fullName
                },
                actorUserId: userId);

            return Ok(new { message = "Archivo eliminado" });
        }

        /// <summary>
        /// Rechazar la solución de un ticket (solo usuarios - solicitantes)
        /// </summary>
        [HttpPost("{id}/reject-solution")]
        [Authorize]
        public async Task<IActionResult> RejectSolution(int id, [FromBody] RejectSolutionDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound(new { message = "Ticket no encontrado" });

            if (ticket.Status != "Resuelto")
                return BadRequest(new { message = "Solo se puede rechazar la solución de un ticket en estado 'Resuelto'" });

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { message = "Debes especificar el motivo del rechazo" });

            var (userId, fullName, role) = GetCurrentUser();

            if (ticket.UserId != userId && role != "Admin")
                return Forbid("Solo el solicitante puede rechazar la solución");

            var fromStatus = ticket.Status;
            ticket.Status = "En Proceso";
            ticket.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            await _actionService.RegisterActionAsync(
                ticketId: id,
                userId: userId,
                userFullName: fullName,
                actionType: "Rejection",
                description: $"Solución rechazada por {fullName}. Motivo: {dto.Reason}",
                fromValue: fromStatus,
                toValue: "En Proceso");

            if (ticket.AssignedTechnicianId.HasValue)
            {
                await _realtime.NotifyToUserAsync(
                    ticket.AssignedTechnicianId.Value,
                    "solution-rejected",
                    new
                    {
                        ticketId = ticket.Id,
                        ticketNumber = ticket.TicketNumber,
                        reason = dto.Reason,
                        rejectedBy = fullName
                    });
            }

            await _realtime.NotifyTicketUpdatedAsync(
                ticketId: ticket.Id,
                userId: ticket.UserId,
                technicianId: ticket.AssignedTechnicianId,
                level: ticket.CurrentLevel,
                eventType: "ticket-updated",
                payload: new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    fromStatus = fromStatus,
                    toStatus = "En Proceso",
                    rejectionReason = dto.Reason,
                    changedBy = fullName
                },
                actorUserId: userId);

            return Ok(new
            {
                message = "Solución rechazada. El ticket vuelve a estado 'En Proceso'",
                reason = dto.Reason,
                ticketStatus = ticket.Status
            });
        }

        /// <summary>
        /// Obtener el motivo del último rechazo de solución de un ticket
        /// </summary>
        [HttpGet("{id}/rejection-reason")]
        [Authorize]
        public async Task<IActionResult> GetRejectionReason(int id)
        {
            var lastRejection = await _context.TicketActions
                .Where(a => a.TicketId == id && a.ActionType == "Rejection")
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync();

            if (lastRejection == null)
                return Ok(new { hasRejection = false, reason = (string?)null });

            string description = lastRejection.Description;
            string reason = "";
            
            var reasonIndex = description.IndexOf("Motivo: ");
            if (reasonIndex != -1)
            {
                reason = description.Substring(reasonIndex + 8);
            }
            else
            {
                reason = description;
            }

            return Ok(new
            {
                hasRejection = true,
                reason = reason,
                rejectedAt = lastRejection.CreatedAt,
                rejectedBy = description.Contains("por") ? 
                    description.Substring(description.IndexOf("por") + 4, 
                    description.IndexOf(".") - (description.IndexOf("por") + 4)) : "Usuario"
            });
        }
    }
}