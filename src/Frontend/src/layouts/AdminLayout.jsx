import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { navItems } from "../data/dashboardData";
import "../styles/adminLayout.css";

/**
 * Layout compartido para todas las páginas del administrador.
 * Incluye sidebar, topbar y el área de contenido principal.
 *
 * Props:
 *  - children: contenido de la página
 *  - activeNavIndex: índice del ítem activo en el sidebar (0 = Dashboard, 1 = Usuarios, etc.)
 */
function AdminLayout({ children, activeNavIndex = 0 }) {
  const [activeNav, setActiveNav] = useState(activeNavIndex);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavClick = (index, label) => {
    setActiveNav(index);
    if (label === "Dashboard") navigate("/admin");
    if (label === "Usuarios") navigate("/admin/users");
  };

  return (
    <div className="admin-root">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon">🎓</div>
          <div className="admin-brand-text">
            <strong>UTA Service Desk</strong>
            <span>DTIC</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item, i) => (
            <button
              key={i}
              className={`admin-nav-item ${activeNav === i ? "active" : ""}`}
              onClick={() => handleNavClick(i, item.label)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-user">
          <div className="admin-avatar">A</div>
          <div className="admin-sidebar-user-text">
            <strong>{user?.email}</strong>
            <span>{user?.role}</span>
          </div>
        </div>

      </aside>

      {/* MAIN */}
      <div className="admin-main">

        {/* TOPBAR */}
        <header className="admin-topbar">

          <div className="admin-search-box">
            <span className="admin-search-icon">🔍</span>
            <input type="text" placeholder="Buscar tickets, usuarios..." />
          </div>

          <div className="admin-topbar-right">

            <button className="admin-notif-btn">
              🔔
              <span className="admin-notif-badge" />
            </button>

            <div className="admin-user-pill">
              <div className="admin-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                A
              </div>
              {user?.role} ▾
            </div>

            <button className="admin-logout-btn" onClick={handleLogout}>
              ⇥
            </button>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <div className="admin-content">
          {children}
        </div>

      </div>

    </div>
  );
}

export default AdminLayout;
