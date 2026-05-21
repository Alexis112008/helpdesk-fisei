import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ticketAPI, catalogAPI } from '../services/api';
import { useNotifications } from '../components/NotificationProvider';
import KnowledgeForm from '../components/KnowledgeForm';
import { getConnection } from '../services/realtime';

/**
 * HU5 — T5.6: Detalle del ticket para el técnico.
 * Incluye:
 * - Historial de estados y acciones.
 * - Cambio de estado (PATCH /api/ticket/{id}/status).
 * - Botón escalar (HU7 — T7.4).
 * - Botón cerrar → abre KnowledgeForm obligatorio (HU8 — T8.5).
 */
function TicketDetailTech() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [closeFormOpen, setCloseFormOpen] = useState(false);

  const fullName = localStorage.getItem('fullName');

  const load = useCallback(() => {
    setLoading(true);
    ticketAPI
      .get(`/ticket/${id}/detail`)
      .then((res) => {
        setDetail(res.data);
        setNewStatus(res.data.ticket.status);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Refrescar al recibir eventos del ticket
  useEffect(() => {
    let conn;
    const refresh = (p) => {
      if (!p || String(p.ticketId) === String(id)) load();
    };
    (async () => {
      try {
        conn = await getConnection();
        conn.on('ticket-updated', refresh);
        conn.on('ticket-escalated', refresh);
        conn.on('ticket-action-added', refresh);
      } catch (e) {}
    })();
    return () => {
      if (conn) {
        conn.off('ticket-updated', refresh);
        conn.off('ticket-escalated', refresh);
        conn.off('ticket-action-added', refresh);
      }
    };
  }, [id, load]);

  const changeStatus = async () => {
    if (!newStatus || newStatus === detail.ticket.status) return;

    if (newStatus === 'Cerrado') {
      showToast({
        type: 'info',
        title: 'Cierre',
        message: 'Use el botón "Cerrar Ticket" para registrar la solución.'
      });
      return;
    }

    try {
      await ticketAPI.patch(`/ticket/${id}/status`, { status: newStatus });
      if (comment.trim()) {
        await ticketAPI.post(`/ticket/${id}/actions`, {
          actionType: 'Comment',
          description: comment.trim(),
        });
        setComment('');
      }
      showToast({ type: 'success', title: 'Listo', message: 'Estado actualizado.' });
      load();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Error actualizando estado';
      showToast({ type: 'error', title: 'Error', message: msg });
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      await ticketAPI.post(`/ticket/${id}/actions`, {
        actionType: 'Comment',
        description: comment.trim(),
      });
      setComment('');
      load();
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo registrar el comentario' });
    }
  };

  const doEscalate = async () => {
    if (!escalateReason.trim()) {
      showToast({ type: 'warning', title: 'Motivo requerido', message: 'Indique el motivo del escalamiento.' });
      return;
    }
    try {
      await ticketAPI.post(`/ticket/${id}/escalate`, { reason: escalateReason.trim() });
      setEscalateOpen(false);
      setEscalateReason('');
      showToast({ type: 'success', title: 'Escalado', message: 'Ticket escalado al siguiente nivel.' });
      load();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Error escalando ticket';
      showToast({ type: 'error', title: 'Error', message: msg });
    }
  };

  const onKnowledgeSaved = async () => {
    // Tras registrar el artículo, cerramos el ticket
    try {
      await ticketAPI.post(`/ticket/${id}/close`);
      showToast({ type: 'success', title: 'Cerrado', message: 'Ticket cerrado correctamente.' });
      setCloseFormOpen(false);
      load();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Error cerrando ticket';
      showToast({ type: 'error', title: 'Error', message: msg });
    }
  };

  const statusColor = (s) => ({
    'Abierto': '#1565c0',
    'En Proceso': '#f57f17',
    'Escalado': '#6a1b9a',
    'Resuelto': '#2e7d32',
    'Cerrado': '#424242',
    'Vencido': '#b71c1c',
  }[s] || '#333');

  if (loading || !detail) {
    return (
      <Layout>
        <div style={st.empty}>Cargando detalle del ticket...</div>
      </Layout>
    );
  }

  const t = detail.ticket;
  const canEscalate = t.currentLevel < 4 && t.status !== 'Cerrado' && t.status !== 'Resuelto';
  const canClose = t.status === 'Resuelto';

  return (
    <Layout>
      <div style={st.topRow}>
        <button style={st.backBtn} onClick={() => navigate(-1)}>← Volver</button>
        <div style={st.topInfo}>
          <span style={st.tno}>{t.ticketNumber}</span>
          <span style={{ ...st.badge, background: statusColor(t.status) }}>{t.status}</span>
          <span style={st.level}>{t.levelName}</span>
        </div>
      </div>

      <h1 style={st.title}>{t.title}</h1>
      <p style={st.desc}>{t.description}</p>

      <div style={st.grid}>
        {/* Columna izquierda — info y historial */}
        <div style={st.col}>
          <div style={st.card}>
            <h3 style={st.cardTitle}>Información</h3>
            <div style={st.row}><span style={st.lbl}>Solicitante (ID)</span><span>{t.userId}</span></div>
            <div style={st.row}><span style={st.lbl}>Prioridad</span><span>{t.priority}</span></div>
            <div style={st.row}><span style={st.lbl}>Servicio</span><span>{t.serviceCatalogId}</span></div>
            <div style={st.row}><span style={st.lbl}>Daño</span><span>{t.damageCatalogId}</span></div>
            <div style={st.row}><span style={st.lbl}>Creado</span><span>{new Date(t.createdAt).toLocaleString('es-EC')}</span></div>
            <div style={st.row}><span style={st.lbl}>Actualizado</span><span>{new Date(t.updatedAt).toLocaleString('es-EC')}</span></div>
          </div>

          <div style={st.card}>
            <h3 style={st.cardTitle}>Historial de acciones</h3>
            {detail.actions.length === 0 ? (
              <div style={st.empty}>Sin acciones registradas todavía.</div>
            ) : (
              <ul style={st.timeline}>
                {detail.actions.map((a) => (
                  <li key={a.id} style={st.tline}>
                    <div style={st.tlineDot} />
                    <div style={st.tlineBody}>
                      <div style={st.tlineHead}>
                        <b>{a.userFullName}</b> · <span style={st.atype}>{a.actionType}</span>
                      </div>
                      <div style={st.tlineDesc}>{a.description}</div>
                      <div style={st.tlineDate}>
                        {new Date(a.createdAt).toLocaleString('es-EC')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Columna derecha — acciones */}
        <div style={st.col}>
          <div style={st.card}>
            <h3 style={st.cardTitle}>Acciones rápidas</h3>

            <label style={st.lblTop}>Cambiar estado</label>
            <select
              style={st.select}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option>Abierto</option>
              <option>En Proceso</option>
              <option>Escalado</option>
              <option>Resuelto</option>
            </select>

            <label style={st.lblTop}>Comentario (opcional)</label>
            <textarea
              style={st.textarea}
              placeholder="Describe lo que hiciste sobre este ticket..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button style={st.btnPrimary} onClick={changeStatus}>
              ↻ Actualizar Estado
            </button>
            <button style={st.btnSecondary} onClick={addComment} disabled={!comment.trim()}>
              + Registrar comentario
            </button>

            <div style={st.divider} />

            <button
              style={{ ...st.btnWarning, opacity: canEscalate ? 1 : 0.5 }}
              onClick={() => setEscalateOpen(true)}
              disabled={!canEscalate}
            >
              ⚠ Escalar Ticket
            </button>

            <button
              style={{ ...st.btnDanger, opacity: canClose ? 1 : 0.5 }}
              onClick={() => setCloseFormOpen(true)}
              disabled={!canClose}
              title={canClose ? '' : 'Primero marca el ticket como Resuelto'}
            >
              ✕ Cerrar Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Modal de escalamiento (HU7 — T7.4) */}
      {escalateOpen && (
        <div style={st.modalOverlay} onClick={() => setEscalateOpen(false)}>
          <div style={st.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={st.modalTitle}>Escalar Ticket</h2>
            <p style={st.modalText}>
              Este ticket pasará de <b>N{t.currentLevel}</b> a <b>N{t.currentLevel + 1}</b>.
              Indica el motivo:
            </p>
            <textarea
              style={st.textarea}
              placeholder="Motivo del escalamiento..."
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              autoFocus
            />
            <div style={st.modalActions}>
              <button style={st.btnGhost} onClick={() => setEscalateOpen(false)}>Cancelar</button>
              <button style={st.btnWarning} onClick={doEscalate}>Escalar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal KnowledgeForm (HU8 — T8.5) */}
      {closeFormOpen && (
        <KnowledgeForm
          ticket={t}
          fullName={fullName}
          onClose={() => setCloseFormOpen(false)}
          onSaved={onKnowledgeSaved}
        />
      )}
    </Layout>
  );
}

const st = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: {
    background: 'none', border: 'none', color: '#4361ee',
    cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: 0,
  },
  topInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  tno: { fontWeight: 700, color: '#4361ee', fontSize: 14 },
  level: { fontSize: 13, color: '#6b7280' },
  badge: { color: '#fff', padding: '4px 12px', borderRadius: 14, fontSize: 12, fontWeight: 700 },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 6px 0', color: '#111827' },
  desc: { color: '#4b5563', fontSize: 14, marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  col: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fff', borderRadius: 14, border: '1px solid #eaecf0', padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 14px 0' },
  row: {
    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
    borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#374151',
  },
  lbl: { color: '#6b7280' },
  lblTop: { display: 'block', fontSize: 13, color: '#374151', marginTop: 14, marginBottom: 6, fontWeight: 600 },
  select: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', minHeight: 90, padding: 12, borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
  },
  btnPrimary: {
    width: '100%', marginTop: 14, padding: '11px 14px',
    background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  btnSecondary: {
    width: '100%', marginTop: 8, padding: '10px 14px',
    background: '#fff', color: '#374151', border: '1px solid #d1d5db',
    borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
  },
  btnWarning: {
    width: '100%', padding: '11px 14px',
    background: '#f59e0b', color: '#fff', border: 'none',
    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  btnDanger: {
    width: '100%', marginTop: 10, padding: '11px 14px',
    background: '#dc2626', color: '#fff', border: 'none',
    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  btnGhost: {
    padding: '10px 16px', background: '#fff', color: '#374151',
    border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600,
    fontSize: 13, cursor: 'pointer',
  },
  divider: { height: 1, background: '#eaecf0', margin: '18px 0' },
  timeline: { listStyle: 'none', padding: 0, margin: 0 },
  tline: { display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
  tlineDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: '#4361ee', marginTop: 6, flexShrink: 0,
  },
  tlineBody: { flex: 1 },
  tlineHead: { fontSize: 13, color: '#111' },
  atype: {
    background: '#eef2ff', color: '#3730a3', fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 10, marginLeft: 4,
  },
  tlineDesc: { fontSize: 13, color: '#4b5563', marginTop: 4 },
  tlineDate: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  empty: { padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 13 },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalBox: {
    background: '#fff', borderRadius: 14, padding: 28, width: 460, maxWidth: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
  },
  modalTitle: { fontSize: 20, fontWeight: 700, margin: '0 0 8px 0' },
  modalText: { fontSize: 14, color: '#4b5563', marginBottom: 14 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
};

export default TicketDetailTech;
