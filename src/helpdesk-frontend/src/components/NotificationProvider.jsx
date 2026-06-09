import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getConnection,
  disconnect,
  joinUserGroup,
  joinTechnicianGroup,
  joinLevelGroup,
  joinAdminsGroup,
  roleToLevel,
  isTechnician,
} from '../services/realtime';

/**
 * HU6 — T6.5: Sistema global de notificaciones push (toasts).
 *
 * - Crea una conexión SignalR única en toda la app.
 * - Suscribe al usuario a los grupos correspondientes según su rol.
 * - Expone showToast() para que cualquier componente lance toasts.
 * - Escucha automáticamente los eventos del hub y muestra toasts.
 */
const NotificationContext = createContext({
  showToast: () => { },
  toasts: [],
  notifications: [],
  unreadCount: 0,
  markAllRead: () => { },
  markOneRead: () => { },
  clearAll: () => { },
});

export function useNotifications() {
  return useContext(NotificationContext);
}

const STORAGE_KEY_PREFIX = 'helpdesk_notifications_v1_';

function getStorageKey() {
  const userId = localStorage.getItem('userId') || 'anon';
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications) {
  try {
    const trimmed = notifications.slice(0, 50);
    localStorage.setItem(getStorageKey(), JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const t = { id, type: 'info', duration: 5000, ...toast };
    setToasts((prev) => [...prev, t]);

    setNotifications((prev) => [
      {
        id,
        type: t.type,
        title: t.title || '',
        message: t.message || '',
        ticketNumber: t.ticketNumber || null,
        ticketId: t.ticketId || null,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    if (t.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, t.duration);
    }
  }, []);

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markOneRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const [authKey, setAuthKey] = useState(
    `${localStorage.getItem('userId') || ''}|${localStorage.getItem('role') || ''}`
  );

  useEffect(() => {
    const check = () => {
      const newKey = `${localStorage.getItem('userId') || ''}|${localStorage.getItem('role') || ''}`;
      if (newKey !== authKey) setAuthKey(newKey);
    };
    window.addEventListener('storage', check);
    const interval = setInterval(check, 1500);
    return () => {
      window.removeEventListener('storage', check);
      clearInterval(interval);
    };
  }, [authKey]);

  useEffect(() => {
    setNotifications(loadFromStorage());
  }, [authKey]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
      disconnect().catch(() => { });
      return;
    }

    let mounted = true;
    let activeConn = null;
    const handlers = {};

    async function setup() {
      try {
        await disconnect();

        const conn = await getConnection();
        if (!mounted) return;
        activeConn = conn;

        await joinUserGroup(userId);
        if (isTechnician(role)) {
          await joinTechnicianGroup(userId);
          const lvl = roleToLevel(role);
          if (lvl) await joinLevelGroup(lvl);
        }
        if (role === 'Admin') {
          await joinAdminsGroup();
        }

        handlers['ticket-created'] = (payload) => {
          if (!payload?.ticketNumber) return;
          showToast({
            type: 'info',
            title: 'Nuevo ticket',
            message: `Ticket ${payload.ticketNumber} creado.`,
            ticketNumber: payload?.ticketNumber,
            ticketId: payload?.ticketId || null,
          });
        };

        handlers['ticket-updated'] = (payload) => {
          const ticketNumber = payload?.ticketNumber;
          const fromStatus = payload?.fromStatus;
          const toStatus = payload?.toStatus;
          if (!ticketNumber || !fromStatus || !toStatus) return;
          showToast({
            type: 'info',
            title: 'Ticket actualizado',
            message: `${ticketNumber}: ${fromStatus} → ${toStatus}`,
            ticketNumber: payload?.ticketNumber,
            ticketId: payload?.ticketId || null,
          });
        };

        handlers['ticket-escalated'] = (payload) => {
          const tn = payload?.ticketNumber;
          const from = payload?.fromLevel;
          const to = payload?.toLevel;
          if (!tn || !from || !to) return;
          showToast({
            type: 'warning',
            title: 'Ticket escalado',
            message: `${tn} escalado de N${from} a N${to}`,
            ticketNumber: payload?.ticketNumber,
            ticketId: payload?.ticketId || null,
          });
        };

        handlers['ticket-resolved'] = (payload) => {
          if (!payload?.ticketNumber) return;
          showToast({
            type: 'success',
            title: 'Ticket resuelto',
            message: `${payload.ticketNumber} fue resuelto.`,
            ticketNumber: payload?.ticketNumber,
            ticketId: payload?.ticketId || null,
          });
        };

        handlers['ticket-closed'] = (payload) => {
          if (!payload?.ticketNumber) return;
          showToast({
            type: 'success',
            title: 'Ticket cerrado',
            message: `${payload.ticketNumber} fue cerrado.`,
            ticketNumber: payload?.ticketNumber,
            ticketId: payload?.ticketId || null,
          });
        };

        handlers['ticket-overdue'] = (payload) => {
          if (!payload?.ticketNumber) return;
          showToast({
            type: 'error',
            title: 'Ticket vencido',
            message: `${payload.ticketNumber} superó su SLA.`,
            ticketNumber: payload?.ticketNumber,
            ticketId: payload?.ticketId || null,
            duration: 8000,
          });
        };

        handlers['ticket-action-added'] = (payload) => {
          if (!payload?.ticketNumber) return;
          const who = payload.fromUser === 'solicitante' ? 'El solicitante' : 'El técnico';
          showToast({
            type: 'info',
            title: 'Nuevo comentario',
            message: `${who} comentó en el ticket ${payload.ticketNumber}.`,
            ticketNumber: payload?.ticketNumber,
            ticketId: payload?.ticketId || null,
          });
        };

        handlers['ticket-available'] = (payload) => {
          if (!payload?.ticketNumber) return;
          if (!isTechnician(role)) return;
          showToast({
            type: 'info',
            title: 'Nuevo ticket disponible',
            message: `${payload.ticketNumber} entró al pool de N${payload.level}.`,
            ticketNumber: payload?.ticketNumber,
            ticketId: payload?.ticketId || null,
          });
        };

        handlers['ticket-taken'] = () => { /* sin toast */ };

        for (const [evt, fn] of Object.entries(handlers)) {
          conn.on(evt, fn);
        }
      } catch (e) {
        console.error('[NotificationProvider] setup error:', e);
      }
    }

    setup();
    return () => {
      mounted = false;
      if (activeConn) {
        for (const [evt, fn] of Object.entries(handlers)) {
          try { activeConn.off(evt, fn); } catch { }
        }
      }
    };
  }, [authKey, showToast]);

  return (
    <NotificationContext.Provider value={{
      showToast,
      toasts,
      notifications,
      unreadCount,
      markAllRead,
      markOneRead,
      clearAll,
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </NotificationContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="toast-container" style={{
      ...styles.container,
      ...(isMobile && styles.containerMobile),
    }}>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => onRemove(t.id)} />
      ))}

      <style>{`
        @media (max-width: 768px) {
          .toast-container {
            top: auto !important;
            bottom: 20px !important;
            left: 12px !important;
            right: 12px !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Toast({ toast, onClose }) {
  const palette = {
    info: { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ', iconBg: '#3b82f6' },
    success: { bg: '#f0fdf4', border: '#22c55e', icon: '✓', iconBg: '#22c55e' },
    warning: { bg: '#fefce8', border: '#eab308', icon: '⚠', iconBg: '#eab308' },
    error: { bg: '#fef2f2', border: '#ef4444', icon: '!', iconBg: '#ef4444' },
  }[toast.type] || { bg: '#fff', border: '#999', icon: '·', iconBg: '#999' };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      ...styles.toast,
      background: palette.bg,
      borderLeft: `4px solid ${palette.border}`,
      ...(isMobile && styles.toastMobile),
    }}>
      <div style={{ ...styles.iconBox, background: palette.iconBg }}>{palette.icon}</div>
      <div style={{ flex: 1 }}>
        {toast.title && <div style={styles.title}>{toast.title}</div>}
        {toast.message && <div style={styles.message}>{toast.message}</div>}
      </div>
      <button style={styles.close} onClick={onClose}>×</button>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxWidth: 380,
  },
  containerMobile: {
    top: 'auto',
    bottom: 20,
    left: 12,
    right: 12,
    maxWidth: 'none',
  },
  toast: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 10,
    boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
    fontFamily: 'Segoe UI, sans-serif',
    minWidth: 300,
  },
  toastMobile: {
    minWidth: 'auto',
    width: '100%',
    padding: '12px',
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    flexShrink: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111',
    marginBottom: 2
  },
  message: {
    fontSize: 13,
    color: '#555'
  },
  close: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: '#999',
    cursor: 'pointer',
    padding: 0,
    width: 22,
    height: 22,
    lineHeight: '20px',
  },
};