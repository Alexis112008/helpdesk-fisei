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

import AdminLayout from "../../layouts/AdminLayout";
import { barData, pieData, statCards } from "../../data/dashboardData";
import "../../styles/adminDashboard.css";

function AdminDashboard() {
  return (
    <AdminLayout activeNavIndex={0}>

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen de actividad — Mayo 2026</p>
        </div>

        <div className="header-actions">
          <select className="period-select">
            <option>Últimos 7 días</option>
            <option>Últimos 30 días</option>
            <option>Este mes</option>
          </select>
          <button className="export-btn">⬇ Exportar</button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        {statCards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-top">
              <div className={`stat-icon ${c.iconClass}`}>{c.icon}</div>
              <span className={`stat-badge ${c.pos ? "pos" : "neg"}`}>{c.badge}</span>
            </div>
            <div className="stat-number">{c.number}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="charts-row">

        {/* BAR CHART */}
        <div className="chart-card">
          <h3>Tickets por día</h3>
          <p>Apertura vs cierre esta semana</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barCategoryGap="35%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="tickets" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART */}
        <div className="chart-card">
          <h3>Por estado</h3>
          <p>Distribución actual</p>
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
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pie-legend">
            {pieData.map((item, i) => (
              <div className="legend-item" key={i}>
                <span className="legend-dot" style={{ background: item.color }} />
                {item.name}
                <span className="legend-count">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </AdminLayout>
  );
}

export default AdminDashboard;
