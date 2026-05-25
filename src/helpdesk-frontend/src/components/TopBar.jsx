import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { disconnect } from '../services/realtime';

function Topbar({ buttonText, buttonAction }) {
  const navigate = useNavigate();

  const fullName = localStorage.getItem('fullName');
  const role = localStorage.getItem('role');

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'US';

  const handleLogout = async () => {
    // Desconectar SignalR antes de limpiar localStorage para que el cliente
    // salga de los grupos correctamente y no reciba eventos de la sesión
    // anterior al volver a entrar.
    try { await disconnect(); } catch {}

    // Limpiar solo las claves de la sesión actual. El historial de
    // notificaciones se guarda por usuario (key helpdesk_notifications_v1_<id>)
    // y se conserva para cuando ese usuario vuelva a entrar.
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');

    navigate('/');
  };

  return (
    <header style={s.topbar}>
      <div style={s.searchBox}>
        <span>🔍</span>
        <span style={s.searchPlaceholder}>Buscar...</span>
      </div>

      <div style={s.topbarRight}>
        {buttonText && (
          <button style={s.actionBtn} onClick={buttonAction}>
            {buttonText}
          </button>
        )}

        <NotificationBell />

        <div style={s.userPill}>
          <div style={s.avatarSm}>{initials}</div>
          <span style={s.userPillName}>{role}</span>
        </div>

        <button onClick={handleLogout} style={s.logoutIcon}>
          ⇥
        </button>
      </div>
    </header>
  );
}

const s = {
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 32px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eaecf0',
  },

  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f7fb',
    borderRadius: 8,
    padding: '8px 16px',
    border: '1px solid #eaecf0',
    width: 320,
    color: '#aaa',
    fontSize: 14,
  },

  searchPlaceholder: {
    color: '#aaa',
  },

  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  actionBtn: {
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },

  notifBtn: {
    // sustituido por el componente NotificationBell
  },
    userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #eaecf0',
    borderRadius: 8,
    padding: '6px 12px',
    backgroundColor: '#fff',
  },

  avatarSm: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#4361ee',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 12,
  },

  userPillName: {
    fontSize: 13,
    fontWeight: 600,
  },

  logoutIcon: {
    background: 'none',
    border: '1px solid #eaecf0',
    borderRadius: 8,
    width: 36,
    height: 36,
    cursor: 'pointer',
    fontSize: 18,
    color: '#666',
  },
};

export default Topbar;