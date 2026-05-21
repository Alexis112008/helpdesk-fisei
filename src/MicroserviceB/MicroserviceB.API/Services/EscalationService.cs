using Microsoft.EntityFrameworkCore;
using MicroserviceB.API.Data;
using MicroserviceB.API.Events;
using MicroserviceB.API.Messaging;
using MicroserviceB.API.Models.Entities;

namespace MicroserviceB.API.Services
{
    /// <summary>
    /// HU7 — T7.1, T7.2, T7.3:
    /// - Escalamiento progresivo N1 → N2 → N3 → N4 (sin saltos).
    /// - Registra acción en historial.
    /// - Publica eventos al bus.
    /// - Job de vencidos (CheckAndEscalateTicketsAsync) marca como "Vencido"
    ///   los tickets que superan el SLA del nivel.
    /// </summary>
    public class EscalationService : IEscalationService
    {
        private readonly AppDbContext _context;
        private readonly ITicketAssignmentService _assignmentService;
        private readonly ITicketActionService _actionService;
        private readonly IEventBus _eventBus;
        private readonly IUserLookupService _userLookup;
        private readonly IRealtimeNotifier _realtime;
        private readonly ILogger<EscalationService> _logger;

        // Reglas SLA: horas máximas por nivel según prioridad (RN-014)
        private readonly Dictionary<string, Dictionary<int, int>> _slaRules = new()
        {
            ["Baja"]    = new() { { 1, 24 }, { 2, 12 }, { 3, 8 }, { 4, 4 } },
            ["Media"]   = new() { { 1, 12 }, { 2, 8 },  { 3, 4 }, { 4, 2 } },
            ["Alta"]    = new() { { 1, 6 },  { 2, 4 },  { 3, 2 }, { 4, 1 } },
            ["Crítica"] = new() { { 1, 2 },  { 2, 1 },  { 3, 1 }, { 4, 1 } }
        };

        public EscalationService(
            AppDbContext context,
            ITicketAssignmentService assignmentService,
            ITicketActionService actionService,
            IEventBus eventBus,
            IUserLookupService userLookup,
            IRealtimeNotifier realtime,
            ILogger<EscalationService> logger)
        {
            _context = context;
            _assignmentService = assignmentService;
            _actionService = actionService;
            _eventBus = eventBus;
            _userLookup = userLookup;
            _realtime = realtime;
            _logger = logger;
        }

        public async Task CheckAndEscalateTicketsAsync()
        {
            var open = await _context.Tickets
                .Where(t => t.Status != "Cerrado" && t.Status != "Resuelto" && t.Status != "Vencido")
                .ToListAsync();

            foreach (var ticket in open)
            {
                var lastCheck = ticket.LastEscalationCheck ?? ticket.CreatedAt;
                var hoursSince = (DateTime.UtcNow - lastCheck).TotalHours;
                var slaHours = GetSlaHours(ticket.Priority, ticket.CurrentLevel);

                if (hoursSince < slaHours) continue;

                if (ticket.CurrentLevel < 4)
                {
                    await EscalateInternalAsync(
                        ticket,
                        reason: $"Escalamiento automático por SLA vencido ({slaHours}h).",
                        actor: "Sistema");
                }
                else
                {
                    ticket.Status = "Vencido";
                    ticket.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    await _actionService.RegisterActionAsync(
                        ticketId: ticket.Id, userId: 0, userFullName: "Sistema",
                        actionType: "Overdue",
                        description: $"Ticket marcado como vencido tras superar SLA en N{ticket.CurrentLevel}.");

                    var user = await _userLookup.GetByIdAsync(ticket.UserId);
                    await _eventBus.PublishAsync(new TicketOverdueEvent
                    {
                        TicketId = ticket.Id,
                        TicketNumber = ticket.TicketNumber,
                        UserId = ticket.UserId,
                        UserEmail = user?.Email ?? "",
                        UserFullName = user?.FullName ?? "",
                        Title = ticket.Title,
                        AssignedTechnicianId = ticket.AssignedTechnicianId,
                        CurrentLevel = ticket.CurrentLevel,
                        Reason = $"SLA superado en N{ticket.CurrentLevel}"
                    });

                    await _realtime.NotifyToAdminsAsync("ticket-overdue", new
                    {
                        ticketId = ticket.Id,
                        ticketNumber = ticket.TicketNumber,
                        currentLevel = ticket.CurrentLevel
                    });
                }
            }
        }

        public Task ManualEscalateAsync(int ticketId)
            => ManualEscalateAsync(ticketId, "Escalamiento manual sin motivo registrado.", "Técnico");

        public async Task ManualEscalateAsync(int ticketId, string reason, string actorFullName)
        {
            var ticket = await _context.Tickets.FindAsync(ticketId)
                ?? throw new InvalidOperationException("Ticket no encontrado");

            if (ticket.CurrentLevel >= 4)
                throw new InvalidOperationException("El ticket ya está en el nivel máximo (N4).");

            if (string.IsNullOrWhiteSpace(reason))
                throw new ArgumentException("Debe indicar un motivo para escalar.", nameof(reason));

            await EscalateInternalAsync(ticket, reason, actorFullName);
        }

        private async Task EscalateInternalAsync(Ticket ticket, string reason, string actor)
        {
            var fromLevel = ticket.CurrentLevel;
            var toLevel = fromLevel + 1; // PROGRESIVO, sin saltos
            var previousTech = ticket.AssignedTechnicianId; // para notificar al pool anterior

            // Al escalar, el ticket vuelve al pool del nuevo nivel:
            //   - Sube de nivel (N+1)
            //   - Se desasigna del técnico actual (cualquier técnico del nuevo nivel
            //     que atienda el servicio podrá aceptarlo desde su bandeja de "Disponibles")
            //   - Estado vuelve a "Abierto" (mismo estado inicial que un ticket nuevo)
            ticket.CurrentLevel = toLevel;
            ticket.Status = "Abierto";
            ticket.AssignedTechnicianId = null;
            ticket.LastEscalationCheck = DateTime.UtcNow;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _actionService.RegisterActionAsync(
                ticketId: ticket.Id, userId: 0, userFullName: actor,
                actionType: "Escalation",
                description: $"Escalado de N{fromLevel} a N{toLevel}. Motivo: {reason}",
                fromValue: $"N{fromLevel}",
                toValue: $"N{toLevel}");

            var user = await _userLookup.GetByIdAsync(ticket.UserId);
            await _eventBus.PublishAsync(new TicketEscalatedEvent
            {
                TicketId = ticket.Id,
                TicketNumber = ticket.TicketNumber,
                UserId = ticket.UserId,
                UserEmail = user?.Email ?? "",
                UserFullName = user?.FullName ?? "",
                Title = ticket.Title,
                AssignedTechnicianId = null,
                CurrentLevel = ticket.CurrentLevel,
                FromLevel = fromLevel,
                ToLevel = toLevel,
                Reason = reason,
                EscalatedByName = actor
            });

            // Notificar al solicitante (le interesa saber que su ticket subió de nivel)
            await _realtime.NotifyToUserAsync(
                ticket.UserId,
                "ticket-escalated",
                new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    fromLevel,
                    toLevel,
                    reason
                });

            // Notificar al técnico que tenía el ticket: para que desaparezca de "Mis tickets"
            if (previousTech.HasValue)
            {
                await _realtime.NotifyToTechnicianAsync(
                    previousTech.Value,
                    "ticket-escalated",
                    new
                    {
                        ticketId = ticket.Id,
                        ticketNumber = ticket.TicketNumber,
                        fromLevel,
                        toLevel,
                        reason
                    });
            }

            // Notificar al pool del NUEVO nivel: el ticket está disponible para aceptar.
            // Todos los técnicos del nivel toLevel verán el ticket en su bandeja de
            // "Disponibles" (igual que cuando se crea un ticket nuevo).
            await _realtime.NotifyToLevelAsync(
                toLevel,
                "ticket-available",
                new
                {
                    ticketId = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    title = ticket.Title,
                    level = toLevel
                });
        }

        private int GetSlaHours(string priority, int level)
        {
            if (!_slaRules.TryGetValue(priority, out var levelRules))
                levelRules = _slaRules["Media"];
            return levelRules.GetValueOrDefault(level, 24);
        }
    }
}
