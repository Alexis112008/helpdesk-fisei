import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from './NotificationProvider';

/**
 * Campanita de notificaciones (HU6 — T6.5).
 *
 * - Muestra un badge con el contador de no leídas.
 * - Al hacer clic, despliega un panel con el historial reciente.
 * - Permite marcar todas como leídas, marcar una individualmente o
 *   limpiar el historial.
 * - El historial se persiste en localStorage (máx. 50 entradas).
 */
function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markOneRead, clearAll } =
    useNotifications();

  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const togglePanel = () => {
    if (!open && unreadCount > 0) {
      // Si abre el panel y hay no leídas, las marcamos como leídas
      // después de un pequeño delay (para que se vea el badge primero)
      setTimeout(() => markAllRead(), 1000);
    }
    setOpen(!open);
  };

  const typeColors = {
    info: { bg: '#dbeafe', color: '#1e40af', icon: '●' },
    success: { bg: '#dcfce7', color: '#15803d', icon: '✓' },
    warning: { bg: '#fef3c7', color: '#92400e', icon: '!' },
    error: { bg: '#fee2e2', color: '#991b1b', icon: '×' },
  };

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
    return d.toLocaleDateString('es-EC');
  };

  return (
    <div ref={rootRef} style={s.root}>
      <button
        style={s.bellBtn}
        onClick={togglePanel}
        title="Notificaciones"
        aria-label="Ver notificaciones"
      >
        <Bell size={18} color="#374151" />
        {unreadCount > 0 && (
          <span style={s.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <div>
              <div style={s.panelTitle}>Notificaciones</div>
              <div style={s.panelSubtitle}>
                {notifications.length === 0
                  ? 'Sin notificaciones'
                  : `${notifications.length} ${
                      notifications.length === 1 ? 'mensaje' : 'mensajes'
                    } reciente${notifications.length === 1 ? '' : 's'}`}
              </div>
            </div>
            <button
              style={s.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <X size={16} color="#6b7280" />
            </button>
          </div>

          {notifications.length > 0 && (
            <div style={s.toolbar}>
              <button style={s.toolBtn} onClick={markAllRead}>
                <Check size={12} /> Marcar todas como leídas
              </button>
              <button
                style={{ ...s.toolBtn, color: '#b91c1c' }}
                onClick={() => {
                  if (window.confirm('¿Limpiar todas las notificaciones?')) {
                    clearAll();
                  }
                }}
              >
                <Trash2 size={12} /> Limpiar
              </button>
            </div>
          )}

          <div style={s.list}>
            {notifications.length === 0 ? (
              <div style={s.empty}>
                <Bell size={32} color="#d1d5db" />
                <p style={s.emptyText}>
                  No tienes notificaciones aún.
                </p>
                <p style={s.emptySub}>
                  Aquí verás los cambios de estado de tus tickets, escalamientos
                  y avisos del sistema.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const palette = typeColors[n.type] || typeColors.info;
                return (
                  <div
                    key={n.id}
                    style={{
                      ...s.item,
                      backgroundColor: n.read ? '#fff' : '#fafbff',
                    }}
                    onClick={() => markOneRead(n.id)}
                  >
                    <div
                      style={{
                        ...s.iconBubble,
                        background: palette.bg,
                        color: palette.color,
                      }}
                    >
                      {palette.icon}
                    </div>

                    <div style={s.itemBody}>
                      <div style={s.itemHeader}>
                        <span style={s.itemTitle}>
                          {n.title || 'Notificación'}
                        </span>
                        {!n.read && <span style={s.unreadDot} />}
                      </div>
                      {n.message && (
                        <p style={s.itemMessage}>{n.message}</p>
                      )}
                      <span style={s.itemTime}>{formatTime(n.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: enlace a la página completa */}
          <button
            style={s.viewAllBtn}
            onClick={() => {
              setOpen(false);
              navigate('/notificaciones');
            }}
          >
            Ver todas las notificaciones →
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  root: {
    position: 'relative',
    display: 'inline-block',
  },
  bellBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 8,
    border: '1px solid #eaecf0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    cursor: 'pointer',
    padding: 0,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: 9,
    background: '#ef4444',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
    fontFamily: 'system-ui, sans-serif',
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 380,
    maxHeight: 520,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
    border: '1px solid #eaecf0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1000,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 18px 12px',
    borderBottom: '1px solid #f3f4f6',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 18px',
    background: '#f9fafb',
    borderBottom: '1px solid #f3f4f6',
  },
  toolBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 12,
    color: '#4361ee',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  list: {
    overflowY: 'auto',
    flex: 1,
    maxHeight: 400,
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#374151',
    margin: 0,
    fontWeight: 600,
  },
  emptySub: {
    fontSize: 12,
    color: '#9ca3af',
    margin: 0,
    lineHeight: 1.5,
    maxWidth: 260,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 18px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#4361ee',
    flexShrink: 0,
  },
  itemMessage: {
    fontSize: 12,
    color: '#6b7280',
    margin: '3px 0 6px',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  itemTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  viewAllBtn: {
    background: '#f9fafb',
    border: 'none',
    borderTop: '1px solid #f3f4f6',
    color: '#4361ee',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '12px 18px',
    textAlign: 'center',
    width: '100%',
  },
};

export default NotificationBell;