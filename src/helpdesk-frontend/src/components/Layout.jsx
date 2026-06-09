import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './SideBar';
import Topbar from './TopBar';
import { Menu, X } from 'lucide-react';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Detectar cambios de tamaño
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CERRAR MENÚ CADA VEZ QUE CAMBIA LA RUTA
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setTimeout(() => {
        setSidebarOpen(false);
      }, 50);
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  // También cerrar cuando cambia el search o hash
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.search, location.hash]);

  // ✅ NUEVO: Escuchar evento personalizado para cerrar sidebar desde cualquier lugar
  useEffect(() => {
    const handleCloseSidebar = () => {
      console.log('Evento close-sidebar recibido, cerrando menú');
      if (isMobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('close-sidebar', handleCloseSidebar);
    return () => window.removeEventListener('close-sidebar', handleCloseSidebar);
  }, [isMobile]);

  return (
    <div style={layoutStyles.container}>
      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && isMobile && (
        <div style={layoutStyles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={isMobile ? 'mobile-sidebar' : ''}
        style={{
          ...layoutStyles.sidebar,
          ...(isMobile && {
            position: 'fixed',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            zIndex: 1000,
          })
        }}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div style={{ ...layoutStyles.mainContent, ...(isMobile && { marginLeft: 0 }) }}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div style={layoutStyles.contentArea} className="main-content-area">
          {children}
        </div>
      </div>

      {/* Botón menú hamburguesa flotante (solo móvil) */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={layoutStyles.hamburger}
          className="hamburger-btn"
        >
          <Menu size={22} />
        </button>
      )}

      {/* CSS adicional */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-sidebar {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            width: 260px;
            transition: transform 0.3s ease;
            z-index: 1000;
          }
          
          .main-content-area {
            padding: 60px 12px 20px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

const layoutStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
    backgroundColor: '#fff',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
  },
  mainContent: {
    flex: 1,
    marginLeft: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    position: 'relative',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: '20px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  hamburger: {
    position: 'fixed',
    top: 12,
    left: 12,
    zIndex: 1001,
    background: '#fff',
    border: '1px solid #e4e7eb',
    borderRadius: 10,
    width: 40,
    height: 40,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
};

export default Layout;