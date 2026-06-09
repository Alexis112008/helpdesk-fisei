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
  const [showFilters, setShowFilters] = useState(false);

  const role = localStorage.getItem('role');

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

  const getDateFilter = (ticketDate) => {
    const date = new Date(ticketDate);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    switch (dateRange) {
      case 'week': return diffDays <= 7;
      case 'month': return diffDays <= 30;
      case 'quarter': return diffDays <= 90;
      default: return true;
    }
  };

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

  const stats = {
    total: tickets.length,
    abiertos: tickets.filter(t => t.status === 'Abierto').length,
    enProceso: tickets.filter(t => t.status === 'En Proceso').length,
    resueltos: tickets.filter(t => t.status === 'Resuelto').length,
    cerrados: tickets.filter(t => t.status === 'Cerrado').length,
  };

  const getStatusColor = (status) => COLORS[status] || '#6b7280';
  const getStatusBgColor = (status) => ({
    'Abierto': '#eef2ff',
    'En Proceso': '#fffbeb',
    'Escalado': '#f3e8ff',
    'Resuelto': '#ecfdf5',
    'Cerrado': '#f3f4f6',
    'Vencido': '#fef2f2',
  }[status] || '#f3f4f6');

  const getPriorityColor = (priority) => ({
    Baja: '#10b981',
    Media: '#f59e0b',
    Alta: '#f97316',
    Crítica: '#ef4444',
  }[priority] || '#6b7280');

  const getPriorityBgColor = (priority) => ({
    Baja: '#ecfdf5',
    Media: '#fffbeb',
    Alta: '#fff7ed',
    Crítica: '#fef2f2',
  }[priority] || '#f3f4f6');

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

  return (
    <Layout>
      <div className="ticket-list-page">
        {/* Header */}
        <div className="ticket-list-header">
          <div>
            <h1 className="ticket-list-title">Mis Tickets</h1>
            <p className="ticket-list-subtitle">Tickets que has creado y su estado actual</p>
          </div>
          <button className="ticket-list-new-btn" onClick={() => navigate('/crear-ticket')}>
            <Plus size={18} />
            Nuevo Ticket
          </button>
        </div>

        {/* Tarjetas de estadísticas */}
        {!loading && tickets.length > 0 && (
          <div className="ticket-list-stats">
            <div className="ticket-list-stat-card">
              <div className="ticket-list-stat-icon ticket-list-stat-icon-primary">
                <Ticket size={20} />
              </div>
              <div>
                <div className="ticket-list-stat-value">{stats.total}</div>
                <div className="ticket-list-stat-label">Total tickets</div>
              </div>
            </div>
            <div className="ticket-list-stat-card">
              <div className="ticket-list-stat-icon ticket-list-stat-icon-abierto">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="ticket-list-stat-value">{stats.abiertos}</div>
                <div className="ticket-list-stat-label">Abiertos</div>
              </div>
            </div>
            <div className="ticket-list-stat-card">
              <div className="ticket-list-stat-icon ticket-list-stat-icon-proceso">
                <TrendingUp size={20} />
              </div>
              <div>
                <div className="ticket-list-stat-value">{stats.enProceso}</div>
                <div className="ticket-list-stat-label">En Proceso</div>
              </div>
            </div>
            <div className="ticket-list-stat-card">
              <div className="ticket-list-stat-icon ticket-list-stat-icon-resuelto">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="ticket-list-stat-value">{stats.resueltos}</div>
                <div className="ticket-list-stat-label">Resueltos</div>
              </div>
            </div>
            <div className="ticket-list-stat-card">
              <div className="ticket-list-stat-icon ticket-list-stat-icon-cerrado">
                <FolderKanban size={20} />
              </div>
              <div>
                <div className="ticket-list-stat-value">{stats.cerrados}</div>
                <div className="ticket-list-stat-label">Cerrados</div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de filtros */}
        <div className="ticket-list-filters-card">
          {/* Buscador y botón de filtros */}
          <div className="ticket-list-search-bar">
            <div className="ticket-list-search-wrapper">
              <Search size={14} className="ticket-list-search-icon" />
              <input
                type="text"
                placeholder="Buscar por número o título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ticket-list-search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="ticket-list-clear-btn">
                  <X size={12} />
                </button>
              )}
            </div>
            <button className="ticket-list-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} />
              Filtros
            </button>
          </div>

          {/* Filtros desplegables */}
          <div className={`ticket-list-filters ${showFilters ? 'ticket-list-filters-open' : ''}`}>
            <div className="ticket-list-filter-group">
              <label className="ticket-list-filter-label">Estado</label>
              <select className="ticket-list-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="ticket-list-filter-group">
              <label className="ticket-list-filter-label">Prioridad</label>
              <select className="ticket-list-filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="ticket-list-filter-group">
              <label className="ticket-list-filter-label">Nivel</label>
              <select className="ticket-list-filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                {levelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="ticket-list-filter-group">
              <label className="ticket-list-filter-label">Fecha</label>
              <select className="ticket-list-filter-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                {dateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="ticket-list-filter-info">
              <div className="ticket-list-filter-count">
                <Ticket size={14} />
                {filteredTickets.length}
              </div>
              {hasActiveFilters && (
                <button className="ticket-list-reset-btn" onClick={resetFilters}>
                  <RefreshCw size={12} />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de tickets */}
        {loading ? (
          <div className="ticket-list-loading">
            <p>Cargando tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="ticket-list-empty">
            <Ticket size={48} />
            <p>
              {tickets.length === 0
                ? 'No hay tickets registrados aún.'
                : 'No hay tickets que coincidan con los filtros seleccionados.'}
            </p>
          </div>
        ) : (
          <div className="ticket-list-table-container">
            <div className="ticket-list-table-wrapper">
              <table className="ticket-list-table">
                <thead>
                  <tr>
                    <th>N° Ticket</th>
                    <th>Título</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Nivel</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => (
                    <tr key={t.id}>
                      <td className="ticket-list-ticket-number">{t.ticketNumber}</td>
                      <td>{t.title}</td>
                      <td>
                        <span className="ticket-list-badge" style={{
                          backgroundColor: getPriorityBgColor(t.priority),
                          color: getPriorityColor(t.priority),
                        }}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span className="ticket-list-badge" style={{
                          backgroundColor: getStatusBgColor(t.status),
                          color: getStatusColor(t.status),
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td>{t.levelName}</td>
                      <td className="ticket-list-date">
                        <Calendar size={12} />
                        {formatDate(t.createdAt)}
                      </td>
                      <td>
                        <button className="ticket-list-view-btn" onClick={() => navigate(`/tickets/${t.id}`)}>
                          <Eye size={14} />
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
      </div>

      <style>{`
        .ticket-list-page {
          padding: 28px 32px;
          flex: 1;
          background-color: #f5f7fa;
          min-height: 100vh;
        }

        .ticket-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ticket-list-title {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .ticket-list-subtitle {
          font-size: 13px;
          color: #6b7280;
        }

        .ticket-list-new-btn {
          background-color: #2d6a9f;
          color: #fff;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(45, 106, 159, 0.2);
        }

        .ticket-list-new-btn:hover {
          transform: translateY(-1px);
          background-color: #1e4a76;
        }

        .ticket-list-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .ticket-list-stat-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e4e7eb;
          padding: 16px 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ticket-list-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ticket-list-stat-icon-primary { background: #eef2ff; color: #2d6a9f; }
        .ticket-list-stat-icon-abierto { background: #eef2ff; color: #2d6a9f; }
        .ticket-list-stat-icon-proceso { background: #fffbeb; color: #f59e0b; }
        .ticket-list-stat-icon-resuelto { background: #ecfdf5; color: #10b981; }
        .ticket-list-stat-icon-cerrado { background: #f3f4f6; color: #6b7280; }

        .ticket-list-stat-value {
          font-size: 22px;
          font-weight: 700;
        }

        .ticket-list-stat-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }

        .ticket-list-filters-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e4e7eb;
          padding: 16px 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .ticket-list-search-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ticket-list-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .ticket-list-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #9ca3af;
        }

        .ticket-list-search-input {
          width: 100%;
          padding: 8px 12px 8px 32px;
          font-size: 13px;
          border: 1px solid #e4e7eb;
          border-radius: 10px;
          outline: none;
          background-color: #f9fafb;
        }

        .ticket-list-search-input:focus {
          border-color: #2d6a9f;
          box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
        }

        .ticket-list-clear-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
        }

        .ticket-list-filter-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #f9fafb;
          border: 1px solid #e4e7eb;
          border-radius: 10px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
        }

        .ticket-list-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 16px;
          margin-top: 16px;
        }

        .ticket-list-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ticket-list-filter-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ticket-list-filter-select {
          padding: 8px 28px 8px 12px;
          font-size: 13px;
          border: 1px solid #e4e7eb;
          border-radius: 10px;
          background-color: #f9fafb;
          cursor: pointer;
          outline: none;
          color: #374151;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          min-width: 170px;
        }

        .ticket-list-filter-info {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          margin-left: auto;
        }

        .ticket-list-filter-count {
          font-size: 13px;
          font-weight: 600;
          color: #2d6a9f;
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #eef2ff;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #d1d9f0;
        }

        .ticket-list-reset-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f9fafb;
          border: 1px solid #e4e7eb;
          border-radius: 10px;
          padding: 8px 14px;
          cursor: pointer;
          color: #6b7280;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .ticket-list-reset-btn:hover {
          background-color: #fee2e2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .ticket-list-table-container {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e4e7eb;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .ticket-list-table-wrapper {
          overflow-x: auto;
        }

        .ticket-list-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        .ticket-list-table th {
          padding: 14px 20px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e4e7eb;
        }

        .ticket-list-table td {
          padding: 14px 20px;
          font-size: 13px;
          color: #1a1a2e;
          border-bottom: 1px solid #f1f5f9;
        }

        .ticket-list-table tr:hover td {
          background-color: #f9fafb;
          cursor: pointer;
        }

        .ticket-list-ticket-number {
          font-weight: 700;
          font-family: monospace;
          font-size: 12px;
          color: #2d6a9f;
        }

        .ticket-list-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }

        .ticket-list-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .ticket-list-view-btn {
          background: #2d6a9f;
          color: #fff;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .ticket-list-view-btn:hover {
          background-color: #1e4a76;
          transform: translateY(-1px);
        }

        .ticket-list-loading, .ticket-list-empty {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e4e7eb;
          padding: 60px 20px;
          text-align: center;
          color: #6b7280;
        }

        .ticket-list-empty p {
          margin-top: 12px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .ticket-list-page {
            padding: 70px 12px 20px 12px;
          }

          .ticket-list-title {
            font-size: 22px;
          }

          .ticket-list-subtitle {
            font-size: 11px;
          }

          .ticket-list-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .ticket-list-stat-card {
            padding: 12px 16px;
          }

          .ticket-list-stat-value {
            font-size: 18px;
          }

          .ticket-list-filter-toggle {
            display: flex;
          }

          .ticket-list-filters {
            display: none;
            flex-direction: column;
            width: 100%;
          }

          .ticket-list-filters-open {
            display: flex;
          }

          .ticket-list-filter-group {
            width: 100%;
          }

          .ticket-list-filter-select {
            width: 100%;
          }

          .ticket-list-filter-info {
            margin-left: 0;
            flex-direction: column;
            align-items: stretch;
          }

          .ticket-list-filter-count {
            justify-content: center;
          }

          .ticket-list-reset-btn {
            justify-content: center;
          }
        }
      `}</style>
    </Layout>
  );
}

export default TicketList;