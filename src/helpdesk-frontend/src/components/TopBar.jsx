import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Bell, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { disconnect } from '../services/realtime';

// Colores unificados con el Dashboard
const COLORS = {
  Primario: '#2d6a9f',
  PrimarioOscuro: '#1e3a5f',
  PrimarioLight: '#eef2ff',
  Texto: '#1a1a2e',
  TextoSecundario: '#6b7280',
  Borde: '#e4e7eb',
  Fondo: '#f5f7fa',
};

function Topbar({ buttonText, buttonAction }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fullName = localStorage.getItem('fullName');
  const role = localStorage.getItem('role');
  const userRole = localStorage.getItem('role');

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'US';

  const handleLogout = async () => {
    try { await disconnect(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirigir a la base de conocimiento con la búsqueda
      navigate(`/conocimiento?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <header style={styles.topbar}>
      <form onSubmit={handleSearch} style={styles.searchBox}>
        <Search size={18} color={COLORS.TextoSecundario} strokeWidth={1.5} />
        <input
          type="text"
          style={styles.searchInput}
          placeholder="Buscar tickets, artículos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSearchResults(true)}
        />
        {searchQuery && (
          <button 
            type="button"
            style={styles.clearBtn}
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
        <button type="submit" style={styles.searchSubmitBtn}>
          <Search size={14} />
        </button>
      </form>

      <div style={styles.topbarRight}>
        {buttonText && (
          <button style={styles.actionBtn} onClick={buttonAction}>
            {buttonText}
          </button>
        )}

        <NotificationBell />

        <div style={styles.userPill}>
          <div style={styles.avatarSm}>{initials}</div>
          <span style={styles.userPillName}>{role || 'Usuario'}</span>
        </div>

        <button onClick={handleLogout} style={styles.logoutIcon}>
          <LogOut size={18} color={COLORS.TextoSecundario} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 28px',
    backgroundColor: '#fff',
    borderBottom: `1px solid ${COLORS.Borde}`,
    position: 'sticky',
    top: 0,
    zIndex: 99,
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.Fondo,
    borderRadius: 40,
    padding: '6px 6px 6px 16px',
    border: `1px solid ${COLORS.Borde}`,
    minWidth: 320,
    transition: 'all 0.2s ease',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 13,
    color: COLORS.Texto,
    padding: '8px 0',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.TextoSecundario,
    display: 'flex',
    alignItems: 'center',
    padding: 4,
    borderRadius: 20,
  },
  searchSubmitBtn: {
    background: COLORS.Primario,
    border: 'none',
    borderRadius: 30,
    padding: '6px 14px',
    cursor: 'pointer',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    backgroundColor: COLORS.Primario,
    color: '#fff',
    border: 'none',
    padding: '8px 18px',
    borderRadius: 40,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    transition: 'all 0.2s ease',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 40,
    padding: '4px 12px 4px 4px',
    backgroundColor: '#fff',
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: COLORS.Primario,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 12,
  },
  userPillName: {
    fontSize: 13,
    fontWeight: 500,
    color: COLORS.Texto,
  },
  logoutIcon: {
    background: 'none',
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 40,
    width: 40,
    height: 40,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
  },
};

// Añadir efectos hover con CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .search-box:focus-within {
    border-color: ${COLORS.Primario};
    box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
  }
  .action-btn:hover, .search-submit-btn:hover {
    background-color: ${COLORS.PrimarioOscuro} !important;
    transform: translateY(-1px);
  }
  .logout-icon:hover {
    background-color: #fef2f2 !important;
    border-color: #ef4444 !important;
  }
  .logout-icon:hover svg {
    color: #ef4444 !important;
  }
  .user-pill:hover {
    background-color: ${COLORS.PrimarioLight};
    cursor: pointer;
  }
`;
document.head.appendChild(styleSheet);

export default Topbar;