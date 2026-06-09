import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Bell, X, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { disconnect } from '../services/realtime';

const COLORS = {
  Primario: '#2d6a9f',
  PrimarioOscuro: '#1e3a5f',
  PrimarioLight: '#eef2ff',
  Texto: '#1a1a2e',
  TextoSecundario: '#6b7280',
  Borde: '#e4e7eb',
  Fondo: '#f5f7fa',
};

function Topbar({ buttonText, buttonAction, onMenuClick }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    try { await disconnect(); } catch { }
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/conocimiento?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="topbar">
      {/* Menú hamburguesa (solo móvil) */}
      {isMobile && onMenuClick && (
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
      )}

      <form onSubmit={handleSearch} className="topbar-search">
        <Search size={isMobile ? 14 : 18} color={COLORS.TextoSecundario} strokeWidth={1.5} />
        <input
          type="text"
          className="topbar-search-input"
          placeholder={isMobile ? "Buscar..." : "Buscar tickets, artículos..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" className="topbar-clear-btn" onClick={() => setSearchQuery('')}>
            <X size={isMobile ? 12 : 14} />
          </button>
        )}
        <button type="submit" className="topbar-submit-btn">
          <Search size={isMobile ? 12 : 14} />
        </button>
      </form>

      <div className="topbar-right">
        {buttonText && !isMobile && (
          <button className="topbar-action-btn" onClick={buttonAction}>
            {buttonText}
          </button>
        )}

        <NotificationBell />

        <div className="topbar-user-pill">
          <div className="topbar-avatar">{initials}</div>
          {!isMobile && <span className="topbar-user-name">{role || 'Usuario'}</span>}
        </div>

        <button onClick={handleLogout} className="topbar-logout-btn">
          <LogOut size={isMobile ? 16 : 18} color={COLORS.TextoSecundario} strokeWidth={1.5} />
        </button>
      </div>

      <style>{`
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 28px;
          background-color: #fff;
          border-bottom: 1px solid ${COLORS.Borde};
          position: sticky;
          top: 0;
          z-index: 99;
          box-shadow: 0 1px 4px rgba(0,0,0,0.02);
          gap: 12px;
        }

        .topbar-menu-btn {
          display: none;
          background: none;
          border: 1px solid ${COLORS.Borde};
          border-radius: 40px;
          padding: 8px;
          cursor: pointer;
          color: ${COLORS.TextoSecundario};
          transition: all 0.2s ease;
        }

        .topbar-menu-btn:hover {
          background-color: ${COLORS.PrimarioLight};
          border-color: ${COLORS.Primario};
        }

        .topbar-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: ${COLORS.Fondo};
          border-radius: 40px;
          padding: 6px 6px 6px 16px;
          border: 1px solid ${COLORS.Borde};
          min-width: 320px;
          transition: all 0.2s ease;
        }

        .topbar-search:focus-within {
          border-color: ${COLORS.Primario};
          box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
        }

        .topbar-search-input {
          flex: 1;
          border: none;
          outline: none;
          background-color: transparent;
          font-size: 13px;
          color: ${COLORS.Texto};
          padding: 8px 0;
        }

        .topbar-clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: ${COLORS.TextoSecundario};
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 20px;
        }

        .topbar-clear-btn:hover {
          background-color: rgba(0,0,0,0.05);
        }

        .topbar-submit-btn {
          background: ${COLORS.Primario};
          border: none;
          border-radius: 30px;
          padding: 6px 14px;
          cursor: pointer;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .topbar-submit-btn:hover {
          background-color: ${COLORS.PrimarioOscuro};
          transform: translateY(-1px);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbar-action-btn {
          background-color: ${COLORS.Primario};
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .topbar-action-btn:hover {
          background-color: ${COLORS.PrimarioOscuro};
          transform: translateY(-1px);
        }

        .topbar-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid ${COLORS.Borde};
          border-radius: 40px;
          padding: 4px 12px 4px 4px;
          background-color: #fff;
          transition: all 0.2s ease;
        }

        .topbar-user-pill:hover {
          background-color: ${COLORS.PrimarioLight};
          cursor: pointer;
        }

        .topbar-avatar {
          width: 32px;
          height: 32px;
          border-radius: 20px;
          background-color: ${COLORS.Primario};
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }

        .topbar-user-name {
          font-size: 13px;
          font-weight: 500;
          color: ${COLORS.Texto};
        }

        .topbar-logout-btn {
          background: none;
          border: 1px solid ${COLORS.Borde};
          border-radius: 40px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background-color: #fff;
        }

        .topbar-logout-btn:hover {
          background-color: #fef2f2;
          border-color: #ef4444;
        }

        .topbar-logout-btn:hover svg {
          color: #ef4444 !important;
        }

        @media (max-width: 768px) {
          .topbar {
            padding: 10px 16px;
          }

          .topbar-menu-btn {
            display: flex;
          }

          .topbar-search {
            min-width: 0;
            flex: 1;
            padding: 4px 4px 4px 12px;
          }

          .topbar-search-input {
            font-size: 14px;
            min-width: 0;
          }

          .topbar-submit-btn {
            padding: 4px 10px;
          }

          .topbar-user-pill {
            padding: 4px 4px 4px 4px;
          }

          .topbar-logout-btn {
            width: 36px;
            height: 36px;
          }

          .topbar-right {
            gap: 8px;
          }
        }
      `}</style>
    </header>
  );
}

export default Topbar;