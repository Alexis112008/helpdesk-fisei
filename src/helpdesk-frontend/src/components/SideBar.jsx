import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Users,
  Wrench,
  Briefcase,
  UserCog,
  TicketCheck,
  Ticket,
  PlusCircle,
  BookOpen,
  User,
  GraduationCap,
  ChevronRight,
  Settings
} from 'lucide-react';

const COLORS = {
  Primario: '#2d6a9f',
  PrimarioOscuro: '#b2cdf0',
  PrimarioLight: '#eef2ff',
  Texto: '#1a1a2e',
  TextoSecundario: '#5a6e8a',
  Borde: '#e4e7eb',
  FondoSidebar: '#fff',
};

function Sidebar({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const fullName = localStorage.getItem('fullName');
  const role = localStorage.getItem('role');

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'US';

  const TECH_ROLES = ['TecnicoN1', 'TecnicoN2', 'DITIC', 'Proveedor'];
  const isTechnician = TECH_ROLES.includes(role);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Bandeja de Entrada', icon: Inbox, path: '/tecnico/panel', techOnly: true },
    { label: 'Usuarios', icon: Users, path: '/admin/usuarios', adminOnly: true },
    { label: 'Catálogo de Daños', icon: Wrench, path: '/admin/daños', adminOnly: true },
    { label: 'Catálogo de Servicios', icon: Briefcase, path: '/admin/servicios', adminOnly: true },
    { label: 'Asignaciones de Técnicos', icon: UserCog, path: '/admin/asignaciones', adminOnly: true },
    { label: 'Asignación de Tickets', icon: TicketCheck, path: '/admin/tickets', adminOnly: true },
    { label: 'Mis Tickets', icon: Ticket, path: '/tickets', hideForTech: true },
    { label: 'Nuevo Ticket', icon: PlusCircle, path: '/crear-ticket', hideForTech: true },
    { label: 'Base de Conocimiento', icon: BookOpen, path: isTechnician ? '/conocimiento' : (role === 'Admin' ? '/admin/conocimiento' : '/conocimiento') },
    { label: 'Mi Perfil', icon: User, path: '/perfil' },
    { label: 'Configuración', icon: Settings, path: '/admin/configuracion', adminOnly: true },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.adminOnly && role !== 'Admin') return false;
    if (item.techOnly && !isTechnician) return false;
    if (item.hideForTech && isTechnician) return false;
    return true;
  });

  // ✅ CORREGIDO: Solo navega, NO cierra el menú aquí (Layout lo hace automáticamente)
  const handleNavClick = (path) => {
    navigate(path);
    // El onClose se maneja en Layout mediante useEffect con location.pathname
  };

  return (
    <aside style={s.sidebar}>
      <div style={s.sidebarLogo}>
        <div style={s.logoIcon}>
          <GraduationCap size={24} color="#fff" />
        </div>
        <div>
          <div style={s.logoTitle}>UTA Service Desk</div>
          <div style={s.logoSub}>DTIC</div>
        </div>
      </div>

      <nav style={s.nav}>
        {visibleNav.map((item) => {
          const active = location.pathname === item.path;
          const IconComponent = item.icon;

          return (
            <button
              key={item.label}
              style={{
                ...s.navItem,
                ...(active ? s.navItemActive : {}),
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = '#b2cdf0';
                  const spans = e.currentTarget.querySelectorAll('span');
                  const svgs = e.currentTarget.querySelectorAll('svg');
                  spans.forEach(el => el.style.color = '#1a1a2e');
                  svgs.forEach(el => el.style.color = '#1a1a2e');
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  const spans = e.currentTarget.querySelectorAll('span');
                  const svgs = e.currentTarget.querySelectorAll('svg');
                  spans.forEach(el => el.style.color = COLORS.TextoSecundario);
                  svgs.forEach(el => el.style.color = COLORS.TextoSecundario);
                }
              }}
              onClick={() => handleNavClick(item.path)}
            >
              <IconComponent
                size={20}
                style={s.navIcon}
                color={active ? COLORS.Primario : COLORS.TextoSecundario}
                strokeWidth={1.5}
              />
              <span style={{
                color: active ? COLORS.Primario : COLORS.TextoSecundario,
                fontWeight: active ? 600 : 500
              }}>
                {item.label}
              </span>
              {active && <ChevronRight size={14} style={s.activeArrow} />}
            </button>
          );
        })}
      </nav>

      <div style={s.sidebarUser}>
        <div style={s.avatar}>{initials}</div>
        <div>
          <div style={s.sidebarUserName}>{fullName?.split(' ')[0] || 'Usuario'}</div>
          <div style={s.sidebarUserRole}>{role || 'Usuario'}</div>
        </div>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width: 260,
    backgroundColor: COLORS.FondoSidebar,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    borderRight: `1px solid ${COLORS.Borde}`,
    boxShadow: '2px 0 12px rgba(0,0,0,0.03)',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px 20px',
    borderBottom: `1px solid ${COLORS.Borde}`,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.Primario,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontWeight: 700,
    fontSize: 14,
    color: COLORS.Texto,
  },
  logoSub: {
    fontSize: 11,
    color: '#8a9bb5',
  },
  nav: {
    flex: 1,
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: COLORS.PrimarioLight,
    borderLeft: `3px solid ${COLORS.Primario}`,
    borderRadius: '0 10px 10px 0',
    marginLeft: '-12px',
    paddingLeft: '21px',
  },
  navIcon: {
    minWidth: 20,
  },
  activeArrow: {
    position: 'absolute',
    right: 12,
    color: COLORS.Primario,
  },
  sidebarUser: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    borderTop: `1px solid ${COLORS.Borde}`,
    backgroundColor: '#fafbfc',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.Primario,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
  },
  sidebarUserName: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.Texto,
  },
  sidebarUserRole: {
    fontSize: 11,
    color: '#8a9bb5',
  },
};

export default Sidebar;