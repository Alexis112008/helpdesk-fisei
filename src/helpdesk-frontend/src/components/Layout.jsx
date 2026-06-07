import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import Topbar from './TopBar';
import { Menu, X } from 'lucide-react';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={layoutStyles.container}>
      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && isMobile && (
        <div
          style={layoutStyles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        ...layoutStyles.sidebar,
        ...(isMobile && {
          position: 'fixed',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          zIndex: 1000,
        })
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div style={{
        ...layoutStyles.mainContent,
        ...(isMobile && { marginLeft: 0 })
      }}>
        {/* Botón menú hamburguesa (solo móvil) */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={layoutStyles.hamburger}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
        <Topbar />
        <div style={layoutStyles.contentArea}>
          {children}
        </div>
      </div>
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
    zIndex: 998,
    background: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: 8,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Layout;