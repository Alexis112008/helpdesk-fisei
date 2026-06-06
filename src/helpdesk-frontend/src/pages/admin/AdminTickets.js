import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Ticket, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Flame,
  Users,
  User,
  Calendar,
  BarChart3,
  X
} from 'lucide-react';
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

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'Baja': return <CheckCircle size={12} style={{ marginRight: 4 }} />;
      case 'Media': return <Clock size={12} style={{ marginRight: 4 }} />;
      case 'Alta': return <TrendingUp size={12} style={{ marginRight: 4 }} />;
      case 'Crítica': return <Flame size={12} style={{ marginRight: 4 }} />;
      default: return null;
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterLevel('');
  };

  const hasActiveFilters = search !== '' || filterStatus !== '' || filterPriority !== '' || filterLevel !== '';

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Seguimiento de Tickets</h1>
            <p style={s.subtitle}>
              <BarChart3 size={14} style={{ marginRight: 6 }} />
              Todos los tickets del sistema
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div style={s.filtersBar}>
          <div style={s.searchWrapper}>
            <Search size={18} style={s.searchIcon} color="#9ca3af" />
            <input
              style={s.searchInput}
              placeholder="Buscar por título o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={s.clearSearchBtn} onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
          
          <div style={s.filterWrapper}>
            <Filter size={16} style={s.filterIcon} color="#6b7280" />
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
          </div>

          <div style={s.filterWrapper}>
            <AlertCircle size={16} style={s.filterIcon} color="#6b7280" />
            <select style={s.filterSelect} value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">Todas las prioridades</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>

          <div style={s.filterWrapper}>
            <Users size={16} style={s.filterIcon} color="#6b7280" />
            <select style={s.filterSelect} value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">Todos los niveles</option>
              <option value="1">Nivel 1</option>
              <option value="2">Nivel 2</option>
              <option value="3">Nivel 3</option>
              <option value="4">Nivel 4</option>
            </select>
          </div>

          <div style={s.resultCount}>
            <Ticket size={14} style={{ marginRight: 4 }} />
            {filtered.length} de {tickets.length} tickets
          </div>

          {hasActiveFilters && (
            <button style={s.clearFiltersBtn} onClick={clearFilters}>
              <X size={14} style={{ marginRight: 4 }} />
              Limpiar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>Cargando tickets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>No hay tickets que coincidan.</p>
          </div>
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
                    <th style={s.th}>Usuario</th>
                    <th style={s.th}>Técnico</th>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} style={s.tr}>
                      <td style={s.td}>
                        <span style={s.ticketNumber}>
                          <Ticket size={12} style={{ marginRight: 4 }} />
                          {t.ticketNumber}
                        </span>
                      </td>
                      <td style={s.td}>{t.title}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: priorityColor(t.priority) }}>
                          {getPriorityIcon(t.priority)}
                          {t.priority}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: statusColor(t.status) }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.levelBadge}>
                          {t.levelName}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={s.userCell}>
                          <User size={12} color="#6b7280" />
                          <span>{t.userId}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={s.userCell}>
                          <User size={12} color="#6b7280" />
                          <span>{t.assignedTechnicianId || '—'}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={s.dateCell}>
                          <Calendar size={12} color="#9ca3af" />
                          <span>{new Date(t.createdAt).toLocaleDateString('es-EC')}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <button
                          style={s.viewBtn}
                          onClick={() => navigate(`/tickets/${t.id}`, { state: { from: '/admin/tickets' } })}
                        >
                          <Eye size={14} style={{ marginRight: 6 }} />
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
  subtitle: { fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center' },
  filtersBar: { 
    display: 'flex', 
    gap: 12, 
    alignItems: 'center', 
    marginBottom: 20, 
    flexWrap: 'wrap' 
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 260px',
    minWidth: 220,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  searchInput: { 
    width: '100%', 
    padding: '10px 32px 10px 38px', 
    borderRadius: 10, 
    border: '1px solid #d0d5dd', 
    fontSize: 14, 
    outline: 'none',
    backgroundColor: '#fff'
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
  },
  filterWrapper: {
    position: 'relative',
    minWidth: 160,
  },
  filterIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  filterSelect: { 
    width: '100%',
    padding: '10px 14px 10px 38px', 
    borderRadius: 10, 
    border: '1px solid #d0d5dd', 
    fontSize: 14, 
    backgroundColor: '#fff', 
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
  },
  resultCount: { 
    fontSize: 13, 
    color: '#6b7280', 
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: '8px 14px',
    borderRadius: 10,
  },
  clearFiltersBtn: {
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    color: '#374151',
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  tableCard: { 
    width: '100%', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    border: '1px solid #eaecf0', 
    overflow: 'hidden' 
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f9fafb' },
  th: { 
    padding: '16px 20px', 
    textAlign: 'left', 
    fontSize: 12, 
    fontWeight: 700, 
    color: '#667085', 
    borderBottom: '1px solid #eaecf0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tr: { borderBottom: '1px solid #f1f3f5', transition: 'background-color 0.2s ease' },
  td: { padding: '18px 20px', fontSize: 13, color: '#344054' },
  ticketNumber: { 
    fontWeight: 700, 
    color: '#4361ee',
    display: 'inline-flex',
    alignItems: 'center',
  },
  badge: { 
    color: '#fff', 
    padding: '5px 12px', 
    borderRadius: 20, 
    fontSize: 11, 
    fontWeight: 600, 
    display: 'inline-flex', 
    alignItems: 'center' 
  },
  levelBadge: {
    background: '#f3f4f6',
    color: '#374151',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    display: 'inline-block',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  stateContainer: { padding: '60px 20px', textAlign: 'center' },
  stateText: { color: '#6b7280', fontSize: 15 },
  viewBtn: { 
    background: '#4361ee', 
    color: '#fff', 
    border: 'none', 
    padding: '7px 14px', 
    borderRadius: 8, 
    cursor: 'pointer', 
    fontSize: 12, 
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease'
  },
};

export default AdminTickets;