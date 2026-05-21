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

        public TicketController(
            AppDbContext context,
            ITicketAssignmentService assignmentService,
            IEscalationService escalationService,
            ITicketActionService actionService,
            IEventBus eventBus,
            IUserLookupService userLookup,
            IRealtimeNotifier realtime)
        {
            _context = context;
            _assignmentService = assignmentService;
            _escalationService = escalationService;
            _actionService = actionService;
            _eventBus = eventBus;
            _userLookup = userLookup;
            _realtime = realtime;
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
        // CRUD básico (existente)
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tickets = await _context.Tickets
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
        /// HU5 — T5.1: Tickets asignados al técnico autenticado.
        /// Filtros: ?status=...  (opcional)
        /// </summary>
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
            //    Si no podemos consultarlos (servicio caído), mostramos TODOS los del nivel
            //    para no bloquear al técnico.
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
        /// Reglas:
        ///   - El ticket debe estar sin asignar.
        ///   - Debe estar en el mismo nivel que el rol del técnico.
        ///   - Su estado debe ser "Abierto".
        /// Al aceptar: se asigna al técnico, se cambia el estado a "En Proceso"
        /// y se notifica al solicitante y al pool (para que el ticket desaparezca
        /// de la bandeja de los demás técnicos del nivel).
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
                return UnprocessableEntity(new
                {
                    message = "Este ticket ya fue aceptado por otro técnico."
                });

            if (ticket.CurrentLevel != level)
                return UnprocessableEntity(new
                {
                    message = $"El ticket está en N{ticket.CurrentLevel} y tú eres N{level}."
                });

            if (ticket.Status != "Abierto")
                return UnprocessableEntity(new
                {
                    message = $"Solo se pueden aceptar tickets en estado 'Abierto' (actual: {ticket.Status})."
                });

            // Asignar y pasar a "En Proceso"
            ticket.AssignedTechnicianId = userId;
            ticket.Status = "En Proceso";
            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _actionService.RegisterActionAsync(
                ticketId: ticket.Id, userId: userId, userFullName: fullName,
                actionType: "Accepted",
                description: $"Ticket aceptado por {fullName}.",
                fromValue: "Abierto", toValue: "En Proceso");

            // Notificar al solicitante (le interesa saber que su ticket fue tomado)
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

            // Notificar al pool: ticket ya no está disponible (los otros técnicos lo
            // quitan de su bandeja de "Disponibles" automáticamente).
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

        // Helper: obtiene los IDs de servicios que atiende un técnico,
        // consultando a Microservicio A.
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
        /// HU5 — Detalle ampliado: ticket + historial de acciones.
        /// </summary>
        /// <summary>
        /// HU5 — T5.1: Detalle del ticket + historial de acciones.
        /// Accesible para:
        ///   - El solicitante (dueño del ticket)
        ///   - El técnico asignado
        ///   - Cualquier técnico de soporte (para ver tickets disponibles del pool)
        ///   - Administradores
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
        ///
        /// Pueden comentar:
        ///   - El solicitante (dueño del ticket) — para responder al técnico
        ///   - El técnico asignado — para preguntar/informar al solicitante
        ///   - Admin
        ///
        /// Los usuarios regulares (no técnicos) SOLO pueden enviar acciones de tipo
        /// "Comment". No pueden cambiar estados ni hacer otras acciones administrativas
        /// para mantener la lógica de control del flujo en el técnico (RN-007, RN-008).
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

            // El solicitante solo puede registrar comentarios, no cambios de estado.
            var requestedType = string.IsNullOrWhiteSpace(dto.ActionType) ? "Comment" : dto.ActionType;
            if (isOwner && !isAssignedTech && !isAdmin && requestedType != "Comment")
                return UnprocessableEntity(new { message = "Como solicitante solo puedes registrar comentarios." });

            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest(new { message = "La descripción del comentario es obligatoria." });

            // No permitir comentar tickets cerrados
            if (ticket.Status == "Cerrado")
                return UnprocessableEntity(new { message = "No se puede comentar un ticket cerrado." });

            var action = await _actionService.RegisterActionAsync(
                ticketId: id,
                userId: userId,
                userFullName: fullName,
                actionType: requestedType,
                description: dto.Description);

            // Notificar al solicitante y al técnico asignado (excluyendo al actor)
            // para que vean el comentario en tiempo real.
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

            return Ok(new { message = "Comentario registrado", actionId = action.Id });
        }

        /// <summary>
        /// HU5 — T5.2: Actualizar estado con validación de transiciones permitidas.
        /// Transiciones válidas:
        ///   Abierto      → En Proceso, Escalado
        ///   En Proceso   → Escalado, Resuelto
        ///   Escalado     → En Proceso, Resuelto
        ///   Resuelto     → Cerrado, En Proceso (reapertura)
        ///   Vencido      → En Proceso
        ///   Cerrado      → (terminal)
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

            // HU8 — RN: no se puede pasar a "Cerrado" sin artículo registrado.
            // (Aquí sólo lo bloqueamos; el endpoint dedicado /close maneja el flujo correcto)
            if (to == "Cerrado")
            {
                return UnprocessableEntity(new
                {
                    message = "Para cerrar el ticket use POST /api/ticket/{id}/close con la solución registrada."
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

            // Evento general de actualización
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

            // Evento adicional cuando el estado nuevo es "Resuelto"
            // (HU6: notificación específica de resolución al solicitante)
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
                    Solution = "Solución registrada por el técnico. Detalle disponible en el ticket.",
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

            // Tiempo real (cambio de estado general)
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

        private static bool IsTransitionAllowed(string from, string to)
        {
            var validStates = new[] { "Abierto", "En Proceso", "Escalado", "Resuelto", "Cerrado", "Vencido" };
            if (!validStates.Contains(to)) return false;

            var allowed = new Dictionary<string, string[]>
            {
                ["Abierto"]    = new[] { "En Proceso", "Escalado" },
                ["En Proceso"] = new[] { "Escalado", "Resuelto" },
                ["Escalado"]   = new[] { "En Proceso", "Resuelto" },
                ["Resuelto"]   = new[] { "Cerrado", "En Proceso" },
                ["Vencido"]    = new[] { "En Proceso" },
                ["Cerrado"]    = Array.Empty<string>()
            };

            return allowed.TryGetValue(from, out var dests) && dests.Contains(to);
        }

        // ============================================================
        // POST (crear) — refactor para emitir evento
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTicketDto dto)
        {
            var count = await _context.Tickets.CountAsync();
            var ticketNumber = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

            // RN-005: Todos los tickets inician en el Nivel 1.
            // El ticket queda en el "pool" del nivel: sin asignar (AssignedTechnicianId = null).
            // Cualquier técnico N1 del servicio podrá aceptarlo desde su bandeja.
            var ticket = new Ticket
            {
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

            // Historial inicial
            try
            {
                await _actionService.RegisterActionAsync(
                    ticketId: ticket.Id, userId: dto.UserId, userFullName: "Solicitante",
                    actionType: "Created",
                    description: "Ticket creado. Pendiente de aceptación por un técnico de Nivel 1.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TicketController] No se pudo registrar acción inicial: {ex.Message}");
            }

            // Evento de creación (errores no deben tumbar la respuesta)
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

                // Notificar al solicitante (confirmación) y al pool del nivel
                // (todos los técnicos N1 conectados a su grupo de nivel reciben el aviso
                // para refrescar su bandeja).
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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TicketController] Error publicando eventos: {ex.Message}");
            }

            return CreatedAtAction(nameof(GetById), new { id = ticket.Id },
                new { message = "Ticket creado y pendiente de aceptación", ticketNumber, id = ticket.Id });
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
                var (_, fullName, _) = GetCurrentUser();
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
        // HU8 — Cierre con artículo obligatorio (gateway)
        // ============================================================

        /// <summary>
        /// HU8 — T8.3 / RN: Cerrar un ticket. Sólo permitido si:
        ///   - Existe al menos un KnowledgeArticle vinculado al ticket (FK ticketId).
        ///   - El ticket está en estado "Resuelto".
        /// El registro del artículo se hace contra Microservicio C antes
        /// de invocar este endpoint.
        /// </summary>
        [Authorize]
        [HttpPost("{id}/close")]
        public async Task<IActionResult> Close(int id, [FromServices] IHttpClientFactory httpFactory)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null) return NotFound(new { message = "Ticket no encontrado" });

            if (ticket.Status != "Resuelto")
                return UnprocessableEntity(new { message = "Solo se pueden cerrar tickets en estado 'Resuelto'." });

            // Verificar artículo asociado en Microservicio C
            try
            {
                var client = httpFactory.CreateClient("CatalogClient");
                var resp = await client.GetAsync($"/api/knowledge/byticket/{id}");
                if (!resp.IsSuccessStatusCode)
                {
                    return UnprocessableEntity(new
                    {
                        message = "Debe registrar la solución antes de cerrar el ticket."
                    });
                }
            }
            catch
            {
                return UnprocessableEntity(new
                {
                    message = "No se pudo verificar la solución registrada. Intente nuevamente."
                });
            }

            var (userId, fullName, _) = GetCurrentUser();
            var from = ticket.Status;
            ticket.Status = "Cerrado";
            ticket.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _actionService.RegisterActionAsync(
                ticketId: id, userId: userId, userFullName: fullName,
                actionType: "Closure",
                description: "Ticket cerrado con solución documentada.",
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
                Solution = "Ver base de conocimiento vinculada"
            });

            await _realtime.NotifyTicketUpdatedAsync(
                ticketId: ticket.Id,
                userId: ticket.UserId,
                technicianId: ticket.AssignedTechnicianId,
                level: ticket.CurrentLevel,
                eventType: "ticket-closed",
                payload: new { ticketId = ticket.Id, ticketNumber = ticket.TicketNumber },
                actorUserId: userId);

            return Ok(new { message = "Ticket cerrado" });
        }
    }
}
