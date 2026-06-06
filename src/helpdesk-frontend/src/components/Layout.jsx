// Layout.jsx - Corregido
import React from 'react';
import Sidebar from './SideBar';  // ← Nota: SideBar con B mayúscula
import Topbar from './TopBar';    // ← Nota: TopBar con B mayúscula

function Layout({ children }) {
  return (
    <div style={layoutStyles.container}>
      <Sidebar />
      <div style={layoutStyles.mainContent}>
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
  mainContent: {
    flex: 1,
    marginLeft: 260,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
};

export default Layout;