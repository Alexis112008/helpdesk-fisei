import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Filter, ChevronDown, Ticket, AlertCircle, 
  Search, X, Calendar, Clock, CheckCircle, TrendingUp,
  FolderKanban, BarChart3, SlidersHorizontal, RefreshCw,
  LayoutDashboard
} from 'lucide-react';
import { ticketAPI } from '../services/api';
import Layout from '../components/Layout';

function TicketList() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const role = localStorage.getItem('role');

  // Colores unificados con el Dashboard
  const COLORS = {
    Primario: '#2d6a9f',
    PrimarioOscuro: '#1e3a5f',
    Abierto: '#2d6a9f',
    EnProceso: '#f59e0b',
    Escalado: '#8b5cf6',
    Resuelto: '#10b981',
    Cerrado: '#6b7280',
    Vencido: '#ef4444'
  };

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'Abierto', label: 'Abierto' },
    { value: 'En Proceso', label: 'En Proceso' },
    { value: 'Escalado', label: 'Escalado' },
    { value: 'Resuelto', label: 'Resuelto' },
    { value: 'Cerrado', label: 'Cerrado' },
    { value: 'Vencido', label: 'Vencido' },
  ];

  const priorityOptions = [
    { value: '', label: 'Todas las prioridades' },
    { value: 'Baja', label: 'Baja' },
    { value: 'Media', label: 'Media' },
    { value: 'Alta', label: 'Alta' },
    { value: 'Crítica', label: 'Crítica' },
  ];

  const levelOptions = [
    { value: '', label: 'Todos los niveles' },
    { value: '1', label: 'Nivel 1 - Técnico Básico' },
    { value: '2', label: 'Nivel 2 - Técnico Profesional' },
    { value: '3', label: 'Nivel 3 - DITIC' },
    { value: '4', label: 'Nivel 4 - Proveedor Externo' },
  ];

  const dateOptions = [
    { value: 'all', label: 'Todas las fechas' },
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mes' },
    { value: 'quarter', label: 'Último trimestre' },
  ];

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const url = `/ticket/user/${userId}`;

    ticketAPI
      .get(url)
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [role]);

  // Filtrar por fecha
  const getDateFilter = (ticketDate) => {
    const date = new Date(ticketDate);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    switch(dateRange) {
      case 'week': return diffDays <= 7;
      case 'month': return diffDays <= 30;
      case 'quarter': return diffDays <= 90;
      default: return true;
    }
  };

  // Filtrar tickets
  const filteredTickets = tickets.filter((t) => {
    const matchStatus = filterStatus === '' || t.status === filterStatus;
    const matchPriority = filterPriority === '' || t.priority === filterPriority;
    const matchLevel = filterLevel === '' || t.currentLevel === parseInt(filterLevel);
    const matchSearch = searchTerm === '' || 
      t.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = getDateFilter(t.createdAt);
    
    return matchStatus && matchPriority && matchLevel && matchSearch && matchDate;
  });

  // Estadísticas
  const stats = {
    total: tickets.length,
    abiertos: tickets.filter(t => t.status === 'Abierto').length,
    enProceso: tickets.filter(t => t.status === 'En Proceso').length,
    resueltos: tickets.filter(t => t.status === 'Resuelto').length,
    cerrados: tickets.filter(t => t.status === 'Cerrado').length,
  };

  const getStatusColor = (status) => {
    return COLORS[status] || '#6b7280';
  };

  const getStatusBgColor = (status) => {
    const colors = {
      'Abierto': '#eef2ff',
      'En Proceso': '#fffbeb',
      'Escalado': '#f3e8ff',
      'Resuelto': '#ecfdf5',
      'Cerrado': '#f3f4f6',
      'Vencido': '#fef2f2',
    };
    return colors[status] || '#f3f4f6';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Baja: '#10b981',
      Media: '#f59e0b',
      Alta: '#f97316',
      Crítica: '#ef4444',
    };
    return colors[priority] || '#6b7280';
  };

  const getPriorityBgColor = (priority) => {
    const colors = {
      Baja: '#ecfdf5',
      Media: '#fffbeb',
      Alta: '#fff7ed',
      Crítica: '#fef2f2',
    };
    return colors[priority] || '#f3f4f6';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const resetFilters = () => {
    setFilterStatus('');
    setFilterPriority('');
    setFilterLevel('');
    setDateRange('all');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus || filterPriority || filterLevel || dateRange !== 'all' || searchTerm;

  const cardStyle = {
    background: '#fff',
    borderRadius: 20,
    border: '1px solid #e4e7eb',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  };

  const StatCard = ({ icon, label, value, color, bg }) => (
    <div style={{ ...cardStyle, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: color }}>{value}</div>
          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{label}</div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <main style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Mis Tickets</h1>
            <p style={styles.subtitle}>Tickets que has creado y su estado actual</p>
          </div>
          <button style={styles.newButton} onClick={() => navigate('/crear-ticket')}>
            <Plus size={18} style={{ marginRight: 8 }} />
            Nuevo Ticket
          </button>
        </div>

        {/* Tarjetas de estadísticas */}
        {!loading && tickets.length > 0 && (
          <div style={styles.statsGrid}>
            <StatCard icon={<Ticket size={20} />} label="Total tickets" value={stats.total} color={COLORS.Primario} bg="#eef2ff" />
            <StatCard icon={<AlertCircle size={20} />} label="Abiertos" value={stats.abiertos} color={COLORS.Abierto} bg="#eef2ff" />
            <StatCard icon={<TrendingUp size={20} />} label="En Proceso" value={stats.enProceso} color={COLORS.EnProceso} bg="#fffbeb" />
            <StatCard icon={<CheckCircle size={20} />} label="Resueltos" value={stats.resueltos} color={COLORS.Resuelto} bg="#ecfdf5" />
            <StatCard icon={<FolderKanban size={20} />} label="Cerrados" value={stats.cerrados} color={COLORS.Cerrado} bg="#f3f4f6" />
          </div>
        )}

        {/* Barra de filtros HORIZONTAL con combobox */}
        <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: 20 }}>
          <div style={styles.filterBar}>
            {/* Buscador */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Buscar</label>
              <div style={styles.searchWrapper}>
                <Search size={14} color="#9ca3af" style={styles.searchIconSmall} />
                <input
                  type="text"
                  placeholder="Número o título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInputSmall}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={styles.clearBtnSmall}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Filtro Estado */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Estado</label>
              <div style={styles.selectWrapper}>
                <select
                  style={styles.filterSelect}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro Prioridad */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Prioridad</label>
              <div style={styles.selectWrapper}>
                <select
                  style={styles.filterSelect}
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro Nivel */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Nivel</label>
              <div style={styles.selectWrapper}>
                <select
                  style={styles.filterSelect}
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  {levelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro Fecha */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Fecha</label>
              <div style={styles.selectWrapper}>
                <select
                  style={styles.filterSelect}
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  {dateOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contador y limpiar */}
            <div style={styles.filterInfo}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Resultados</label>
                <div style={styles.filterCount}>
                  <Ticket size={14} style={{ marginRight: 4 }} />
                  {filteredTickets.length}
                </div>
              </div>
              {hasActiveFilters && (
                <button style={styles.resetBtn} onClick={resetFilters} title="Limpiar filtros">
                  <RefreshCw size={14} />
                  <span style={{ marginLeft: 4 }}>Limpiar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de tickets */}
        {loading ? (
          <div style={styles.stateContainer}>
            <p style={styles.stateText}>Cargando tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ ...cardStyle, padding: '60px 20px', textAlign: 'center' }}>
            <Ticket size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
            <p style={styles.stateText}>
              {tickets.length === 0 
                ? 'No hay tickets registrados aún.' 
                : 'No hay tickets que coincidan con los filtros seleccionados.'}
            </p>
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>N° Ticket</th>
                    <th style={styles.th}>Título</th>
                    <th style={styles.th}>Prioridad</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Nivel</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={{ ...styles.ticketNumber, color: COLORS.Primario }}>
                          {t.ticketNumber}
                        </span>
                       </td>
                      <td style={styles.td}>{t.title}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: getPriorityBgColor(t.priority),
                          color: getPriorityColor(t.priority),
                        }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: getStatusBgColor(t.status),
                          color: getStatusColor(t.status),
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={styles.td}>{t.levelName}</td>
                      <td style={styles.tdDate}>
                        <Calendar size={12} style={{ marginRight: 4, opacity: 0.6 }} />
                        {formatDate(t.createdAt)}
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewBtn}
                          onClick={() => navigate(`/tickets/${t.id}`)}
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

const styles = {
  content: {
    padding: '28px 32px',
    flex: 1,
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },

  newButton: {
    backgroundColor: '#2d6a9f',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(45, 106, 159, 0.2)',
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: 0,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, #e4e7eb 0%, transparent 100%)',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 16,
    marginBottom: 28,
  },

  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 20,
  },

  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },

  filterLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  searchWrapper: {
    position: 'relative',
    minWidth: 180,
  },

  searchIconSmall: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },

  searchInputSmall: {
    width: '100%',
    padding: '8px 12px 8px 32px',
    fontSize: 13,
    border: '1px solid #e4e7eb',
    borderRadius: 10,
    outline: 'none',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s',
  },

  clearBtnSmall: {
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
  },

  selectWrapper: {
    position: 'relative',
  },

  filterSelect: {
    padding: '8px 28px 8px 12px',
    fontSize: 13,
    border: '1px solid #e4e7eb',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    outline: 'none',
    color: '#374151',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    minWidth: 170,
  },

  filterInfo: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    marginLeft: 'auto',
  },

  filterCount: {
    fontSize: 13,
    fontWeight: 600,
    color: '#2d6a9f',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid #d1d9f0',
  },

  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#f9fafb',
    border: '1px solid #e4e7eb',
    borderRadius: 10,
    padding: '8px 14px',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.2s',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  thead: {
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e4e7eb',
  },

  th: {
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.2s',
  },

  td: {
    padding: '14px 20px',
    fontSize: 13,
    color: '#1a1a2e',
  },

  tdDate: {
    padding: '14px 20px',
    fontSize: 12,
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
  },

  ticketNumber: {
    fontWeight: 700,
    fontFamily: 'monospace',
    fontSize: 12,
  },

  badge: {
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    display: 'inline-block',
  },

  stateContainer: {
    padding: '60px 20px',
    textAlign: 'center',
  },

  stateText: {
    color: '#6b7280',
    fontSize: 14,
  },

  viewBtn: {
    background: '#2d6a9f',
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
};

export default TicketList;