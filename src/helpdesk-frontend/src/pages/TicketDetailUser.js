import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { ticketAPI, catalogAPI } from '../services/api';
import { getConnection } from '../services/realtime';

/**
 * Detalle de ticket — VISTA USUARIO SOLICITANTE.
 */
function TicketDetailUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/tickets';

  const [ticket, setTicket] = useState(null);
  const [actions, setActions] = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [damageName, setDamageName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // NUEVO: Estado para la solución y modal
  const [solution, setSolution] = useState('');
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  const myUserId = parseInt(localStorage.getItem('userId') || '0');

  const load = useCallback(async () => {
    try {
      const res = await ticketAPI.get(`/ticket/${id}/detail`);
      setTicket(res.data.ticket);
      setActions(res.data.actions || []);
      
      // Buscar la solución en el historial de acciones
      const closureAction = res.data.actions?.find(a => 
        a.actionType === 'Closure' || a.actionType === 'Resolution'
      );
      if (closureAction && closureAction.description) {
        setSolution(closureAction.description);
      }

      // Resolver nombres de servicio y daño
      if (res.data.ticket.serviceCatalogId) {
        try {
          const svc = await catalogAPI.get(`/servicecatalog/${res.data.ticket.serviceCatalogId}`);
          setServiceName(svc.data.name);
        } catch { }
      }
      if (res.data.ticket.damageCatalogId) {
        try {
          const dmg = await catalogAPI.get(`/damagecatalog/${res.data.ticket.damageCatalogId}`);
          setDamageName(dmg.data.name);
        } catch { }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el ticket.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Enviar comentario del solicitante
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [commentError, setCommentError] = useState('');

  const sendComment = async () => {
    const text = comment.trim();
    if (!text) {
      setCommentError('Escribe un mensaje antes de enviar.');
      return;
    }
    setSending(true);
    setCommentError('');
    try {
      await ticketAPI.post(`/ticket/${id}/actions`, {
        actionType: 'Comment',
        description: text,
      });
      setComment('');
      await load();
    } catch (err) {
      setCommentError(err.response?.data?.message || 'No se pudo enviar tu comentario.');
    } finally {
      setSending(false);
    }
  };

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
      } catch { }
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
          <button style={s.backBtn} onClick={() => navigate(from)}>← Volver</button>
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
        <button style={s.backBtn} onClick={() => navigate(from)}>
          ← Volver
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

        {/* NUEVO: Botón "Ver solución" solo si el ticket está cerrado y hay solución */}
        {(ticket.status === 'Cerrado' || ticket.status === 'Resuelto') && solution && (
          <div style={s.solutionButtonContainer}>
            <button style={s.solutionBtn} onClick={() => setShowSolutionModal(true)}>
              🔍 Ver solución aplicada
            </button>
          </div>
        )}

        {/* Información */}
        <div style={s.grid}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Información del ticket</h3>
            <table style={s.kv}>
              <tbody>
                <tr>
                  <td style={s.kvKey}>Servicio:</td>
                  <td style={s.kvValue}>{serviceName || '—'}</td>
                </tr>
                <tr>
                  <td style={s.kvKey}>Tipo de daño:</td>
                  <td style={s.kvValue}>{damageName || '—'}</td>
                </tr>
                <tr>
                  <td style={s.kvKey}>Ubicación:</td>
                  <td style={s.kvValue}>{ticket.location || '—'}</td>
                </tr>
                <tr>
                  <td style={s.kvKey}>Equipo/Activo:</td>
                  <td style={s.kvValue}>{ticket.assetCode || '—'}</td>
                </tr>
                <tr>
                  <td style={s.kvKey}>Nivel actual:</td>
                  <td style={s.kvValue}><b>{ticket.levelName}</b></td>
                </tr>
                <tr>
                  <td style={s.kvKey}>Creado:</td>
                  <td style={s.kvValue}>{new Date(ticket.createdAt).toLocaleString('es-EC')}</td>
                </tr>
                <tr>
                  <td style={s.kvKey}>Última actualización:</td>
                  <td style={s.kvValue}>{new Date(ticket.updatedAt).toLocaleString('es-EC')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Descripción del problema</h3>
            <p style={s.description}>{ticket.description || 'Sin descripción.'}</p>
          </div>
        </div>

        {/* Conversación y seguimiento */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>💬 Conversación y seguimiento</h3>
          {actions.length === 0 ? (
            <p style={s.muted}>Aún no hay actualizaciones registradas.</p>
          ) : (
            <ul style={s.timeline}>
              {actions.map((a, idx) => {
                const isMine = a.userId === myUserId;
                const isSystem = a.userId === 0 || a.actionType === 'Created';
                return (
                  <li key={a.id} style={s.timelineItem}>
                    <div style={{
                      ...s.timelineDot,
                      background: isMine ? '#dbeafe'
                                 : isSystem ? '#f3f4f6'
                                 : '#e0f2fe',
                    }}>
                      {actionIcon(a.actionType)}
                    </div>
                    {idx < actions.length - 1 && <div style={s.timelineLine} />}
                    <div style={{
                      ...s.timelineBody,
                      background: isMine ? '#eff6ff' : '#fff',
                      border: isMine ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}>
                      <div style={s.timelineHeader}>
                        <span style={s.timelineType}>
                          {actionLabel(a.actionType)}
                          {isMine && <span style={s.youTag}> (tú)</span>}
                        </span>
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
                      {a.userFullName && !isSystem && (
                        <p style={s.timelineUser}>
                          {isMine ? 'Tú' : <>Por: <b>{a.userFullName}</b></>}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Formulario para responder */}
          {ticket.status !== 'Cerrado' ? (
            <div style={s.replyBox}>
              <label style={s.replyLabel}>
                Tu mensaje al técnico:
              </label>
              <textarea
                style={s.replyTextarea}
                placeholder="Escribe aquí cualquier información adicional o respuesta para el técnico que atiende tu caso..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                disabled={sending}
              />
              {commentError && <p style={s.replyError}>{commentError}</p>}
              <div style={s.replyActions}>
                <span style={s.replyHint}>
                  El técnico recibirá una notificación cuando envíes el mensaje.
                </span>
                <button
                  style={{ ...s.replyBtn, opacity: sending ? 0.6 : 1 }}
                  onClick={sendComment}
                  disabled={sending}
                >
                  {sending ? 'Enviando…' : '📤 Enviar mensaje'}
                </button>
              </div>
            </div>
          ) : (
            <div style={s.closedNotice}>
              🔒 Este ticket está cerrado. Si tu problema persiste, crea uno nuevo.
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA MOSTRAR LA SOLUCIÓN */}
      {showSolutionModal && (
        <div style={s.modalOverlay} onClick={() => setShowSolutionModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalIcon}>✅</span>
              <h3 style={s.modalTitle}>Solución aplicada</h3>
              <button style={s.modalClose} onClick={() => setShowSolutionModal(false)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p style={s.solutionText}>{solution}</p>
            </div>
            <div style={s.modalFooter}>
              <button style={s.modalButton} onClick={() => setShowSolutionModal(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
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
  
  // NUEVO: Botón para ver solución
  solutionButtonContainer: {
    marginBottom: 20,
  },
  solutionBtn: {
    background: '#e8f5e9',
    border: '1px solid #a5d6a7',
    borderRadius: 10,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: '#2e7d32',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: 'fit-content',
  },
  
  // NUEVO: Estilos del Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    width: 480,
    maxWidth: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 24px',
    borderBottom: '1px solid #eaecf0',
    background: '#e8f5e9',
  },
  modalIcon: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2e7d32',
    margin: 0,
    flex: 1,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#6b7280',
    padding: 4,
  },
  modalBody: {
    padding: '24px',
  },
  solutionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 1.6,
    margin: 0,
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #eaecf0',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  modalButton: {
    background: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
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
  kvValue: { color: '#374151', padding: '4px 0' },
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
  youTag: { color: '#4361ee', fontWeight: 700, fontSize: 11 },

  replyBox: {
    marginTop: 20,
    padding: 16,
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 12,
  },
  replyLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 8,
  },
  replyTextarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 10,
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
  },
  replyError: {
    margin: '8px 0 0',
    color: '#b42318',
    fontSize: 12,
  },
  replyActions: {
    marginTop: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  replyHint: { fontSize: 12, color: '#9ca3af' },
  replyBtn: {
    background: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
  },
  closedNotice: {
    marginTop: 20,
    padding: 14,
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
};

export default TicketDetailUser;