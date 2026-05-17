import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const navItems = [
    { label: 'Dashboard', icon: '▦', path: '/dashboard' },
    {
      label: 'Usuarios',
      icon: '👤',
      path: '/admin/usuarios',
      adminOnly: true,
    },
    {
      label: 'Catálogo de Daños',
      icon: '⊞',
      path: '/admin/daños',
      adminOnly: true,
    },
    {
      label: 'Catálogo de Servicios',
      icon: '≡',
      path: '/admin/servicios',
      adminOnly: true,
    },
    {
      label: 'Mis Tickets',
      icon: '🎫',
      path: '/tickets',
    },
    {
      label: 'Nuevo Ticket',
      icon: '➕',
      path: '/crear-ticket',
    },
  ];

  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || role === 'Admin'
  );

  return (
    <aside style={s.sidebar}>
      <div style={s.sidebarLogo}>
        <div style={s.logoIcon}>🎓</div>

        <div>
          <div style={s.logoTitle}>UTA Service Desk</div>
          <div style={s.logoSub}>DTIC</div>
        </div>
      </div>

      <nav style={s.nav}>
        {visibleNav.map((item) => {
          const active = location.pathname === item.path;

          return (
            <button
              key={item.label}
              style={{
                ...s.navItem,
                ...(active ? s.navItemActive : {}),
              }}
              onClick={() => navigate(item.path)}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={s.sidebarUser}>
        <div style={s.avatar}>{initials}</div>

        <div>
          <div style={s.sidebarUserName}>{fullName}</div>
          <div style={s.sidebarUserRole}>{role}</div>
        </div>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width: 260,
    backgroundColor: '#fff',
    borderRight: '1px solid #eaecf0',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 16px 0',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },

  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px',
    borderBottom: '1px solid #eaecf0',
  },

  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#4361ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },

  logoTitle: {
    fontWeight: 700,
    fontSize: 14,
    color: '#111',
  },

  logoSub: {
    fontSize: 12,
    color: '#888',
  },

  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#444',
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'left',
    width: '100%',
  },

  navItemActive: {
    backgroundColor: '#eef1ff',
    color: '#4361ee',
    fontWeight: 600,
  },

  navIcon: {
    width: 20,
    textAlign: 'center',
  },

  sidebarUser: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 20px',
    borderTop: '1px solid #eaecf0',
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#4361ee',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },

  sidebarUserName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111',
  },

  sidebarUserRole: {
    fontSize: 12,
    color: '#888',
  },
};

export default Sidebar;