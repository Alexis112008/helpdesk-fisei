import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { ticketAPI, catalogAPI } from '../services/api';
import { getConnection } from '../services/realtime';

/**
 * Detalle de ticket — VISTA USUARIO SOLICITANTE.
 *
 * Permite al usuario que creó el ticket:
 *   - Ver toda la información de su ticket
 *   - Ver el historial completo de acciones (timeline)
 *   - Ver en qué nivel está y quién lo atiende
 *   - Recibir actualizaciones en tiempo real (SignalR)
 *
 * No puede modificar nada — solo leer.
 */
function TicketDetailUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [actions, setActions] = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [damageName, setDamageName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await ticketAPI.get(`/ticket/${id}/detail`);
      setTicket(res.data.ticket);
      setActions(res.data.actions || []);

      // Resolver nombres de servicio y daño desde el catálogo
      if (res.data.ticket.serviceCatalogId) {
        try {
          const svc = await catalogAPI.get(`/servicecatalog/${res.data.ticket.serviceCatalogId}`);
          setServiceName(svc.data.name);
        } catch { /* opcional */ }
      }
      if (res.data.ticket.damageCatalogId) {
        try {
          const dmg = await catalogAPI.get(`/damagecatalog/${res.data.ticket.damageCatalogId}`);
          setDamageName(dmg.data.name);
        } catch { /* opcional */ }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el ticket.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Actualización en tiempo real
  useEffect(() => {
    let conn;
    (async () => {
      try {
        conn = await getConnection();
        conn.on('ticket-updated', load);
        conn.on('ticket-resolved', load);
        conn.on('ticket-closed', load);
        conn.on('ticket-escalated', load);
        conn.on('ticket-action-added', load);
      } catch { /* silencioso */ }
    })();
    return () => {
      if (conn) {
        conn.off('ticket-updated', load);
        conn.off('ticket-resolved', load);
        conn.off('ticket-closed', load);
        conn.off('ticket-escalated', load);
        conn.off('ticket-action-added', load);
      }
    };
  }, [load]);

  if (loading) {
    return (
      <Layout>
        <div style={s.page}>
          <p style={s.muted}>Cargando ticket...</p>
        </div>
      </Layout>
    );
  }

  if (error || !ticket) {
    return (
      <Layout>
        <div style={s.page}>
          <button style={s.backBtn} onClick={() => navigate('/tickets')}>← Volver</button>
          <div style={s.errorBox}>{error || 'Ticket no encontrado'}</div>
        </div>
      </Layout>
    );
  }

  const statusColor = (st) => ({
    'Abierto': '#1565c0',
    'En Proceso': '#f57f17',
    'Escalado': '#6a1b9a',
    'Resuelto': '#2e7d32',
    'Cerrado': '#424242',
    'Vencido': '#b71c1c',
  }[st] || '#333');

  const priorityColor = (p) => ({
    'Baja': '#388e3c',
    'Media': '#f57f17',
    'Alta': '#e64a19',
    'Crítica': '#b71c1c',
  }[p] || '#333');

  // Mensaje amigable según el estado
  const statusMessage = (st) => ({
    'Abierto': 'Tu ticket está en cola, pendiente de ser tomado por un técnico.',
    'En Proceso': 'Un técnico está trabajando en tu ticket.',
    'Escalado': 'Tu ticket fue escalado al siguiente nivel de soporte.',
    'Resuelto': 'Tu ticket fue marcado como resuelto. Te avisaremos al cerrarlo.',
    'Cerrado': 'Tu ticket fue cerrado. Si el problema persiste, crea uno nuevo.',
    'Vencido': 'Tu ticket superó el tiempo de atención. El administrador será notificado.',
  }[st] || '');

  const actionIcon = (type) => ({
    'Created': '🆕',
    'Accepted': '✋',
    'StatusChange': '🔄',
    'Comment': '💬',
    'Escalated': '⬆️',
    'Resolution': '✅',
    'Closure': '🔒',
  }[type] || '•');

  const actionLabel = (type) => ({
    'Created': 'Ticket creado',
    'Accepted': 'Ticket aceptado',
    'StatusChange': 'Cambio de estado',
    'Comment': 'Comentario',
    'Escalated': 'Escalamiento',
    'Resolution': 'Resolución',
    'Closure': 'Cierre',
  }[type] || type);

  return (
    <Layout>
      <div style={s.page}>
        <button style={s.backBtn} onClick={() => navigate('/tickets')}>
          ← Volver a Mis Tickets
        </button>

        {/* Encabezado */}
        <div style={s.headerCard}>
          <div style={s.headerTop}>
            <div>
              <span style={s.ticketNumber}>{ticket.ticketNumber}</span>
              <h1 style={s.title}>{ticket.title}</h1>
            </div>
            <div style={s.badgesCol}>
              <span style={{ ...s.badge, background: statusColor(ticket.status) }}>
                {ticket.status}
              </span>
              <span style={{ ...s.badge, background: priorityColor(ticket.priority), marginTop: 6 }}>
                Prioridad {ticket.priority}
              </span>
            </div>
          </div>

          <p style={s.statusMessage}>{statusMessage(ticket.status)}</p>
        </div>

        {/* Información */}
        <div style={s.grid}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Información del ticket</h3>
            <table style={s.kv}>
              <tbody>
                <tr><td style={s.kvKey}>Servicio:</td><td>{serviceName || '—'}</td></tr>
                <tr><td style={s.kvKey}>Tipo de daño:</td><td>{damageName || '—'}</td></tr>
                <tr><td style={s.kvKey}>Nivel actual:</td><td><b>{ticket.levelName}</b></td></tr>
                <tr><td style={s.kvKey}>Creado:</td><td>{new Date(ticket.createdAt).toLocaleString('es-EC')}</td></tr>
                <tr><td style={s.kvKey}>Última actualización:</td><td>{new Date(ticket.updatedAt).toLocaleString('es-EC')}</td></tr>
              </tbody>
            </table>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Descripción del problema</h3>
            <p style={s.description}>{ticket.description || 'Sin descripción.'}</p>
          </div>
        </div>

        {/* Timeline / Historial */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>📋 Historial de seguimiento</h3>
          {actions.length === 0 ? (
            <p style={s.muted}>Aún no hay actualizaciones registradas.</p>
          ) : (
            <ul style={s.timeline}>
              {actions.map((a, idx) => (
                <li key={a.id} style={s.timelineItem}>
                  <div style={s.timelineDot}>{actionIcon(a.actionType)}</div>
                  {idx < actions.length - 1 && <div style={s.timelineLine} />}
                  <div style={s.timelineBody}>
                    <div style={s.timelineHeader}>
                      <span style={s.timelineType}>{actionLabel(a.actionType)}</span>
                      <span style={s.timelineDate}>
                        {new Date(a.createdAt).toLocaleString('es-EC')}
                      </span>
                    </div>
                    <p style={s.timelineDesc}>{a.description}</p>
                    {(a.fromValue || a.toValue) && (
                      <p style={s.timelineChange}>
                        <span style={s.fromVal}>{a.fromValue || '—'}</span>
                        {' → '}
                        <span style={s.toVal}>{a.toValue || '—'}</span>
                      </p>
                    )}
                    {a.userFullName && (
                      <p style={s.timelineUser}>Por: <b>{a.userFullName}</b></p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page: { padding: 24, maxWidth: 1000, margin: '0 auto' },
  backBtn: {
    background: 'transparent', border: 'none', color: '#4361ee',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 0',
    marginBottom: 12,
  },
  headerCard: {
    background: '#fff', border: '1px solid #eaecf0', borderRadius: 14,
    padding: 24, marginBottom: 20,
  },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  ticketNumber: {
    fontSize: 12, fontWeight: 700, color: '#4361ee', textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '4px 0 0' },
  badgesCol: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  badge: {
    color: '#fff', padding: '5px 14px', borderRadius: 16,
    fontSize: 12, fontWeight: 700,
  },
  statusMessage: {
    marginTop: 16, padding: 14, background: '#f9fafb', borderRadius: 10,
    fontSize: 14, color: '#374151', borderLeft: '3px solid #4361ee',
  },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
    marginBottom: 20,
  },
  card: {
    background: '#fff', border: '1px solid #eaecf0', borderRadius: 12,
    padding: 20, marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  kv: { width: '100%', fontSize: 14, color: '#374151', borderCollapse: 'collapse' },
  kvKey: { color: '#6b7280', padding: '4px 0', width: 160, verticalAlign: 'top' },
  description: { fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 },
  muted: { color: '#9ca3af', fontStyle: 'italic' },
  errorBox: {
    background: '#fef3f2', color: '#b42318', padding: 16,
    borderRadius: 10, fontSize: 14,
  },
  timeline: { listStyle: 'none', padding: 0, margin: 0 },
  timelineItem: {
    position: 'relative', display: 'flex', gap: 14,
    paddingBottom: 18,
  },
  timelineDot: {
    width: 36, height: 36, borderRadius: '50%', background: '#eff3ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0, zIndex: 2,
  },
  timelineLine: {
    position: 'absolute', left: 17, top: 38, bottom: 0,
    width: 2, background: '#e5e7eb',
  },
  timelineBody: { flex: 1, paddingTop: 4 },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  timelineType: { fontSize: 13, fontWeight: 700, color: '#111827' },
  timelineDate: { fontSize: 11, color: '#9ca3af' },
  timelineDesc: { fontSize: 13, color: '#374151', margin: '6px 0 0', lineHeight: 1.5 },
  timelineChange: { fontSize: 12, color: '#6b7280', margin: '6px 0 0' },
  fromVal: { textDecoration: 'line-through' },
  toVal: { fontWeight: 700, color: '#111827' },
  timelineUser: { fontSize: 11, color: '#6b7280', margin: '4px 0 0' },
};

export default TicketDetailUser;
