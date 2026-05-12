import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useAuth } from "../../context/AuthContext";

import {
  barData,
  pieData,
  navItems,
  statCards,
} from "../../data/dashboardData";

import "../../styles/adminDashboard.css";

function AdminDashboard() {

  const [activeNav, setActiveNav] = useState(0);

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {

    logout();

    navigate("/");

  };

  return (

    <div className="dash-root">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-brand-icon">
            🎓
          </div>

          <div className="sidebar-brand-text">
            <strong>UTA Service Desk</strong>
            <span>DTIC</span>
          </div>

        </div>

        <nav className="sidebar-nav">

          {
            navItems.map((item, i) => (

              <button
                key={i}
                className={`nav-item ${activeNav === i ? "active" : ""}`}
                onClick={() => setActiveNav(i)}
              >

                <span className="nav-icon">
                  {item.icon}
                </span>

                {item.label}

              </button>

            ))
          }

        </nav>

        <div className="sidebar-user">

          <div className="avatar">
            A
          </div>

          <div className="sidebar-user-text">

            <strong>
              {user?.email}
            </strong>

            <span>
              {user?.role}
            </span>

          </div>

        </div>

      </aside>

      {/* MAIN */}
      <div className="main">

        {/* TOPBAR */}
        <header className="topbar">

          <div className="search-box">

            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              placeholder="Buscar tickets, usuarios..."
            />

          </div>

          <div className="topbar-right">

            <button className="notif-btn">

              🔔

              <span className="notif-badge" />

            </button>

            <div className="user-pill">

              <div
                className="avatar"
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 11
                }}
              >
                A
              </div>

              {user?.role} ▾

            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              ⇥
            </button>

          </div>

        </header>

        {/* CONTENT */}
        <div className="content">

          {/* HEADER */}
          <div className="page-header">

            <div>

              <h1>
                Dashboard
              </h1>

              <p>
                Resumen de actividad — Mayo 2026
              </p>

            </div>

            <div className="header-actions">

              <select className="period-select">

                <option>
                  Últimos 7 días
                </option>

                <option>
                  Últimos 30 días
                </option>

                <option>
                  Este mes
                </option>

              </select>

              <button className="export-btn">
                ⬇ Exportar
              </button>

            </div>

          </div>

          {/* STATS */}
          <div className="stat-grid">

            {
              statCards.map((c, i) => (

                <div
                  className="stat-card"
                  key={i}
                >

                  <div className="stat-top">

                    <div className={`stat-icon ${c.iconClass}`}>
                      {c.icon}
                    </div>

                    <span className={`stat-badge ${c.pos ? "pos" : "neg"}`}>
                      {c.badge}
                    </span>

                  </div>

                  <div className="stat-number">
                    {c.number}
                  </div>

                  <div className="stat-label">
                    {c.label}
                  </div>

                </div>

              ))
            }

          </div>

          {/* CHARTS */}
          <div className="charts-row">

            {/* BAR */}
            <div className="chart-card">

              <h3>
                Tickets por día
              </h3>

              <p>
                Apertura vs cierre esta semana
              </p>

              <ResponsiveContainer width="100%" height={260}>

                <BarChart
                  data={barData}
                  barCategoryGap="35%"
                  barGap={4}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="tickets"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

            {/* PIE */}
            <div className="chart-card">

              <h3>
                Por estado
              </h3>

              <p>
                Distribución actual
              </p>

              <ResponsiveContainer width="100%" height={180}>

                <PieChart>

                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >

                    {
                      pieData.map((entry, index) => (

                        <Cell
                          key={index}
                          fill={entry.color}
                        />

                      ))
                    }

                  </Pie>

                </PieChart>

              </ResponsiveContainer>

              <div className="pie-legend">

                {
                  pieData.map((item, i) => (

                    <div
                      className="legend-item"
                      key={i}
                    >

                      <span
                        className="legend-dot"
                        style={{
                          background: item.color
                        }}
                      />

                      {item.name}

                      <span className="legend-count">
                        {item.value}
                      </span>

                    </div>

                  ))
                }

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

export default AdminDashboard;