import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useNotifications } from '../components/NotificationProvider';

/**
 * Página dedicada de notificaciones. Lee del historial global que mantiene
 * NotificationProvider (persistido en localStorage). Permite filtrar por
 * tipo y por rango de tiempo, abrir el ticket relacionado, y marcar como
 * leídas individual o globalmente.
 *
 * No hace llamadas al backend: todo lo que ve aquí ya está en el historial
 * que el provider acumula desde que el usuario inicia sesión.
 */
function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    markAllRead,
    markOneRead,
    clearAll,
  } = useNotifications();

  // Filtros
  const [typeFilter, setTypeFilter] = useState('Todas'); // Todas | info | success | warning | error
  const [rangeFilter, setRangeFilter] = useState('24h'); // 24h | 7d | 30d | all
  // No usamos un estado de "refrescar" porque las notificaciones vienen del
  // contexto: cuando llega una nueva, este componente se re-renderiza solo.
  // El botón "Actualizar" simplemente fuerza un re-cálculo visual (no hace daño).
  const [tick, setTick] = useState(0);

  const role = (localStorage.getItem('role') || '').trim();
  const isTechnician = ['TecnicoN1', 'TecnicoN2', 'DITIC', 'Proveedor'].includes(role);

  const filtered = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d':  7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    const windowMs = ranges[rangeFilter] ?? Infinity;
    // tick se incluye para que el memo se re-evalúe cuando el usuario pulsa
    // "Actualizar" (no afecta el resultado de otra forma).
    void tick;
    return notifications.filter((n) => {
      if (typeFilter !== 'Todas' && n.type !== typeFilter) return false;
      if (windowMs !== Infinity) {
        const t = n.createdAt ? new Date(n.createdAt).getTime() : 0;
        if (now - t > windowMs) return false;
      }
      return true;
    });
  }, [notifications, typeFilter, rangeFilter, tick]);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Hace ${diffHr} h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Ayer';
    if (diffDay < 7) return `Hace ${diffDay} días`;
    return d.toLocaleDateString('es-EC');
  };

  const typePalette = {
    info:    { bg: '#dbeafe', dot: '#3b82f6' },
    success: { bg: '#dcfce7', dot: '#22c55e' },
    warning: { bg: '#fef3c7', dot: '#eab308' },
    error:   { bg: '#fee2e2', dot: '#ef4444' },
  };

  const openTicket = (notif) => {
    if (!notif.ticketId) return;
    markOneRead(notif.id);
    // Los técnicos ven su detalle propio; el solicitante ve la vista de usuario.
    if (isTechnician) {
      navigate(`/tecnico/ticket/${notif.ticketId}`);
    } else {
      navigate(`/tickets/${notif.ticketId}`);
    }
  };

  const unreadInView = filtered.filter((n) => !n.read).length;

  return (
    <Layout>
      <div style={s.page}>
        <h1 style={s.title}>Notificaciones</h1>
        <p style={s.subtitle}>Todas tus notificaciones recientes</p>

        {/* Barra de controles */}
        <div style={s.toolbar}>
          <select
            style={s.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="info">Información</option>
            <option value="success">Éxito</option>
            <option value="warning">Advertencia</option>
            <option value="error">Error</option>
          </select>

          <select
            style={s.select}
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
          >
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="all">Todo el historial</option>
          </select>

          <button
            style={s.refreshBtn}
            onClick={() => setTick((x) => x + 1)}
            title="Actualizar vista"
          >
            ↻ Actualizar
          </button>

          <div style={{ flex: 1 }} />

          <button
            style={{ ...s.primaryBtn, opacity: unreadInView === 0 ? 0.5 : 1 }}
            onClick={markAllRead}
            disabled={unreadInView === 0}
          >
            ✓ Marcar todas como leídas
          </button>

          {notifications.length > 0 && (
            <button
              style={s.ghostBtn}
              onClick={() => {
                if (window.confirm('¿Limpiar todo el historial de notificaciones?')) {
                  clearAll();
                }
              }}
              title="Borrar todo el historial"
            >
              🗑 Limpiar
            </button>
          )}
        </div>

        {/* Lista */}
        <div style={s.list}>
          {filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🔔</div>
              <p style={s.emptyTitle}>No hay notificaciones</p>
              <p style={s.emptyText}>
                {notifications.length === 0
                  ? 'Aquí verás los cambios de estado de tus tickets, escalamientos y avisos del sistema.'
                  : 'No hay notificaciones que coincidan con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              const palette = typePalette[n.type] || typePalette.info;
              return (
                <div
                  key={n.id}
                  style={{
                    ...s.card,
                    background: n.read ? '#fff' : '#fafbff',
                  }}
                >
                  <div style={{ ...s.dot, background: n.read ? '#d1d5db' : palette.dot }} />
                  <div style={s.cardBody}>
                    <div style={s.cardTitle}>{n.title || 'Notificación'}</div>
                    {n.message && <div style={s.cardMsg}>{n.message}</div>}
                    <div style={s.cardTime}>{formatTime(n.createdAt)}</div>
                  </div>
                  <div style={s.cardActions}>
                    {n.ticketId && (
                      <button
                        style={s.actionBtn}
                        onClick={() => openTicket(n)}
                        title="Abrir el ticket relacionado"
                      >
                        Ver Ticket
                      </button>
                    )}
                    {!n.read && (
                      <button
                        style={{ ...s.actionBtn, color: '#6b7280' }}
                        onClick={() => markOneRead(n.id)}
                        title="Marcar como leído"
                      >
                        Marcar como leído
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page: { padding: 0 },
  title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 20 },

  toolbar: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 13,
    background: '#fff',
    outline: 'none',
    minWidth: 150,
    cursor: 'pointer',
  },
  refreshBtn: {
    background: '#fff',
    border: '1px solid #d1d5db',
    color: '#374151',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  primaryBtn: {
    background: '#4361ee',
    border: 'none',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  ghostBtn: {
    background: '#fff',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '16px 18px',
    border: '1px solid #eaecf0',
    borderRadius: 12,
    background: '#fff',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    marginTop: 6,
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#111827' },
  cardMsg: {
    fontSize: 13, color: '#4b5563',
    marginTop: 4, lineHeight: 1.5, wordBreak: 'break-word',
  },
  cardTime: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: '#4361ee',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },

  empty: {
    padding: '60px 20px',
    textAlign: 'center',
    background: '#fff',
    border: '1px dashed #e5e7eb',
    borderRadius: 14,
  },
  emptyIcon: { fontSize: 38, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16, fontWeight: 700,
    color: '#374151', margin: '0 0 6px',
  },
  emptyText: {
    fontSize: 13, color: '#9ca3af',
    margin: 0, maxWidth: 380,
    marginLeft: 'auto', marginRight: 'auto',
    lineHeight: 1.5,
  },
};

export default Notifications;