import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../../services/api';
import Layout from '../../components/Layout';

function AdminTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  useEffect(() => {
    ticketAPI.get('/ticket')
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch = search === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === '' || t.status === filterStatus;
      const matchPriority = filterPriority === '' || t.priority === filterPriority;
      const matchLevel = filterLevel === '' || t.currentLevel === parseInt(filterLevel);
      return matchSearch && matchStatus && matchPriority && matchLevel;
    });
  }, [tickets, search, filterStatus, filterPriority, filterLevel]);

  const statusColor = (s) => ({
    'Abierto': '#1565c0', 'En Proceso': '#f57f17',
    'Escalado': '#6a1b9a', 'Resuelto': '#2e7d32',
    'Cerrado': '#424242', 'Vencido': '#b71c1c',
  }[s] || '#333');

  const priorityColor = (p) => ({
    'Baja': '#388e3c', 'Media': '#f57f17',
    'Alta': '#e64a19', 'Crítica': '#b71c1c',
  }[p] || '#333');

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Seguimiento de Tickets</h1>
            <p style={s.subtitle}>Todos los tickets del sistema</p>
          </div>
        </div>

        {/* Filtros */}
        <div style={s.filtersBar}>
          <input
            style={s.searchInput}
            placeholder="Buscar por título o número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={s.filterSelect} value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="Abierto">Abierto</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Escalado">Escalado</option>
            <option value="Resuelto">Resuelto</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Vencido">Vencido</option>
          </select>
          <select style={s.filterSelect} value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">Todas las prioridades</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
          </select>
          <select style={s.filterSelect} value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="">Todos los niveles</option>
            <option value="1">N1</option>
            <option value="2">N2</option>
            <option value="3">N3</option>
            <option value="4">N4</option>
          </select>
          <span style={s.resultCount}>
            {filtered.length} de {tickets.length} tickets
          </span>
        </div>

        {loading ? (
          <div style={s.stateContainer}><p style={s.stateText}>Cargando tickets...</p></div>
        ) : filtered.length === 0 ? (
          <div style={s.stateContainer}><p style={s.stateText}>No hay tickets que coincidan.</p></div>
        ) : (
          <div style={s.tableCard}>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>N° Ticket</th>
                    <th style={s.th}>Título</th>
                    <th style={s.th}>Prioridad</th>
                    <th style={s.th}>Estado</th>
                    <th style={s.th}>Nivel</th>
                    <th style={s.th}>Usuario ID</th>
                    <th style={s.th}>Técnico ID</th>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} style={s.tr}>
                      <td style={s.td}>
                        <span style={s.ticketNumber}>{t.ticketNumber}</span>
                       </td>
                      <td style={s.td}>{t.title}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: priorityColor(t.priority) }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: statusColor(t.status) }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={s.td}>{t.levelName}</td>
                      <td style={s.td}>{t.userId}</td>
                      <td style={s.td}>{t.assignedTechnicianId || '—'}</td>
                      <td style={s.td}>
                        {new Date(t.createdAt).toLocaleDateString('es-EC')}
                      </td>
                      <td style={s.td}>
                        {/* ← CAMBIADO: navegación con estado que incluye el origen */}
                        <button
                          style={s.viewBtn}
                          onClick={() => navigate(`/tickets/${t.id}`, { state: { from: '/admin/tickets' } })}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}

const s = {
  content: { padding: '32px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  filtersBar: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
  searchInput: { flex: '1 1 220px', padding: '10px 14px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, outline: 'none' },
  filterSelect: { padding: '10px 14px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, backgroundColor: '#fff', outline: 'none' },
  resultCount: { fontSize: 13, color: '#6b7280', marginLeft: 'auto' },
  tableCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', overflow: 'hidden' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f9fafb' },
  th: { padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' },
  tr: { borderBottom: '1px solid #f1f3f5' },
  td: { padding: '18px 20px', fontSize: 14, color: '#344054' },
  ticketNumber: { fontWeight: 700, color: '#4361ee' },
  badge: { color: '#fff', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block' },
  stateContainer: { padding: '60px 20px', textAlign: 'center' },
  stateText: { color: '#6b7280', fontSize: 15 },
  viewBtn: { background: '#4361ee', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};

export default AdminTickets;