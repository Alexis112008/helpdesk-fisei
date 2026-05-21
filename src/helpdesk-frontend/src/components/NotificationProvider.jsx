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
  showToast: () => {},
  toasts: [],
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markOneRead: () => {},
  clearAll: () => {},
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
    // Solo guardamos los últimos 50 para no llenar localStorage
    const trimmed = notifications.slice(0, 50);
    localStorage.setItem(getStorageKey(), JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState(() => loadFromStorage());

  // Persistir notificaciones cuando cambien
  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const t = { id, type: 'info', duration: 5000, ...toast };
    setToasts((prev) => [...prev, t]);

    // Cada toast también va al historial de la campanita
    setNotifications((prev) => [
      {
        id,
        type: t.type,
        title: t.title || '',
        message: t.message || '',
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

  // Conexión SignalR + suscripción a grupos según rol.
  // Estado interno para detectar logout/login en la misma pestaña: cuando
  // el userId cambia, desconectamos y reconectamos para que los grupos
  // se renueven (un técnico no puede quedar suscrito al level de su sesión
  // anterior cuando entra como usuario regular).
  const [authKey, setAuthKey] = useState(
    `${localStorage.getItem('userId') || ''}|${localStorage.getItem('role') || ''}`
  );

  // Vigilar cambios en localStorage (cuando se hace logout/login en la
  // misma pestaña el evento "storage" no dispara, así que revisamos en intervalos)
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

  // Cuando cambia el usuario logueado, recargar el historial desde
  // SU propio storage (es per-usuario para evitar mezcla de sesiones).
  useEffect(() => {
    setNotifications(loadFromStorage());
  }, [authKey]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
      // Sin sesión: asegurar que no quede conexión colgada
      disconnect().catch(() => {});
      return;
    }

    let mounted = true;
    let activeConn = null;
    const handlers = {};

    async function setup() {
      try {
        // Forzar desconexión previa para que la nueva conexión re-haga JoinGroup
        // limpios desde cero. Es la única forma confiable de "olvidar" los grupos
        // del usuario anterior cuando se cambia de sesión en la misma pestaña.
        await disconnect();

        const conn = await getConnection();
        if (!mounted) return;
        activeConn = conn;

        // Suscribir a grupos relevantes
        await joinUserGroup(userId);
        if (isTechnician(role)) {
          await joinTechnicianGroup(userId);
          const lvl = roleToLevel(role);
          if (lvl) await joinLevelGroup(lvl);
        }
        if (role === 'Admin') {
          await joinAdminsGroup();
        }

        // Listeners de eventos — guardamos referencia para poder limpiarlos
        handlers['ticket-created'] = (payload) => {
          if (!payload?.ticketNumber) return;
          showToast({
            type: 'info',
            title: 'Nuevo ticket',
            message: `Ticket ${payload.ticketNumber} creado.`,
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
          });
        };

        handlers['ticket-resolved'] = (payload) => {
          if (!payload?.ticketNumber) return;
          showToast({
            type: 'success',
            title: 'Ticket resuelto',
            message: `${payload.ticketNumber} fue resuelto.`,
          });
        };

        handlers['ticket-closed'] = (payload) => {
          if (!payload?.ticketNumber) return;
          showToast({
            type: 'success',
            title: 'Ticket cerrado',
            message: `${payload.ticketNumber} fue cerrado.`,
          });
        };

        handlers['ticket-overdue'] = (payload) => {
          if (!payload?.ticketNumber) return;
          showToast({
            type: 'error',
            title: 'Ticket vencido',
            message: `${payload.ticketNumber} superó su SLA.`,
            duration: 8000,
          });
        };

        handlers['ticket-action-added'] = () => { /* sin toast */ };

        // Pool de tickets — solo técnicos
        handlers['ticket-available'] = (payload) => {
          if (!payload?.ticketNumber) return;
          if (!isTechnician(role)) return;
          showToast({
            type: 'info',
            title: 'Nuevo ticket disponible',
            message: `${payload.ticketNumber} entró al pool de N${payload.level}.`,
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
      // Quitar handlers para esta sesión
      if (activeConn) {
        for (const [evt, fn] of Object.entries(handlers)) {
          try { activeConn.off(evt, fn); } catch {}
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
  return (
    <div style={styles.container}>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const palette = {
    info:    { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ', iconBg: '#3b82f6' },
    success: { bg: '#f0fdf4', border: '#22c55e', icon: '✓', iconBg: '#22c55e' },
    warning: { bg: '#fefce8', border: '#eab308', icon: '⚠', iconBg: '#eab308' },
    error:   { bg: '#fef2f2', border: '#ef4444', icon: '!', iconBg: '#ef4444' },
  }[toast.type] || { bg: '#fff', border: '#999', icon: '·', iconBg: '#999' };

  return (
    <div style={{
      ...styles.toast,
      background: palette.bg,
      borderLeft: `4px solid ${palette.border}`,
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
  title: { fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 2 },
  message: { fontSize: 13, color: '#555' },
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
