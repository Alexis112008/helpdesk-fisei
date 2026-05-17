import React from 'react';
import Sidebar from './SideBar';
import Topbar from './TopBar';

function Layout({ children }) {
  return (
    <div style={s.root}>
      <Sidebar />

      <div style={s.main}>
        <Topbar />

        <main style={s.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fb',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  main: {
    marginLeft: 260,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  content: {
    padding: 32,
    flex: 1,
  },
};

export default Layout;