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
  X,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { ticketAPI, authAPI } from '../../services/api';
import Layout from '../../components/Layout';

function AdminTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedTechs, setSelectedTechs] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, techsRes] = await Promise.all([
        ticketAPI.get('/ticket'),
        authAPI.get('/technicians/list')
      ]);
      setTickets(ticketsRes.data);
      setTechnicians(techsRes.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getTechnicianLevel = (role) => {
    switch (role) {
      case 'TecnicoN1': return 1;
      case 'TecnicoN2': return 2;
      case 'DITIC': return 3;
      case 'Proveedor': return 4;
      default: return null;
    }
  };

  const getAvailableTechnicians = (ticketLevel) => {
    return technicians.filter(t => getTechnicianLevel(t.role) === ticketLevel && t.isActive !== false);
  };

  const handleAssign = async (ticketId, technicianId, technicianName, ticketNumber) => {
    if (!technicianId) {
      setError(`Seleccione un técnico para el ticket ${ticketNumber}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setAssigning(true);
    try {
      await ticketAPI.post(`/ticket/${ticketId}/assign-to-technician`, {
        technicianId: technicianId
      });

      setSuccess(`Ticket ${ticketNumber} asignado a ${technicianName}`);
      await loadData();
      setSelectedTechs(prev => ({ ...prev, [ticketId]: '' }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Error al asignar ticket');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAssigning(false);
    }
  };

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

  const unassignedTickets = useMemo(() => {
    return filtered.filter(t => !t.assignedTechnicianId && t.status === 'Abierto');
  }, [filtered]);

  const assignedTickets = useMemo(() => {
    return filtered.filter(t => t.assignedTechnicianId);
  }, [filtered]);

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
    switch (priority) {
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
      <div className="admin-tickets-page">
        <div className="admin-tickets-header">
          <div>
            <h1 className="admin-tickets-title">Asignación de Tickets</h1>
            <p className="admin-tickets-subtitle">
              <UserCheck size={14} />
              Asigna tickets manualmente a los técnicos según su nivel
            </p>
          </div>
          <button className="admin-tickets-refresh-btn" onClick={loadData}>
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        {success && (
          <div className="admin-tickets-success">
            <CheckCircle size={18} />
            {success}
          </div>
        )}
        {error && (
          <div className="admin-tickets-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="admin-tickets-filters-card">
          <div className="admin-tickets-search-bar">
            <div className="admin-tickets-search-wrapper">
              <Search size={16} className="admin-tickets-search-icon" />
              <input
                className="admin-tickets-search-input"
                placeholder={isMobile ? "Buscar..." : "Buscar por título o número..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="admin-tickets-clear-search" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="admin-tickets-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} />
              Filtros
            </button>
          </div>

          <div className={`admin-tickets-filters ${showFilters ? 'admin-tickets-filters-open' : ''}`}>
            <select className="admin-tickets-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="Abierto">Abierto</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Escalado">Escalado</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cerrado">Cerrado</option>
              <option value="Vencido">Vencido</option>
            </select>

            <select className="admin-tickets-filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">Todas las prioridades</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>

            <select className="admin-tickets-filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">Todos los niveles</option>
              <option value="1">Nivel 1</option>
              <option value="2">Nivel 2</option>
              <option value="3">Nivel 3</option>
              <option value="4">Nivel 4</option>
            </select>

            <div className="admin-tickets-stats">
              <Ticket size={14} />
              {unassignedTickets.length} sin asignar | {assignedTickets.length} asignados
            </div>

            {hasActiveFilters && (
              <button className="admin-tickets-clear-filters" onClick={clearFilters}>
                <X size={14} />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tickets sin asignar */}
        <h3 className="admin-tickets-section-title">
          <Ticket size={18} />
          Tickets pendientes de asignación ({unassignedTickets.length})
        </h3>

        {loading ? (
          <div className="admin-tickets-loading">
            <RefreshCw size={24} className="admin-tickets-spinner" />
            <p>Cargando tickets...</p>
          </div>
        ) : unassignedTickets.length === 0 ? (
          <div className="admin-tickets-empty">
            <p>{hasActiveFilters ? 'No hay tickets que coincidan con los filtros.' : 'No hay tickets pendientes de asignación.'}</p>
          </div>
        ) : (
          <div className="admin-tickets-table-card">
            <div className="admin-tickets-table-wrapper">
              <table className="admin-tickets-table">
                <thead>
                  <tr>
                    <th>N° Ticket</th>
                    <th>Título</th>
                    <th>Prioridad</th>
                    <th>Nivel</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                    <th>Asignar a</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedTickets.map((t) => {
                    const availableTechs = getAvailableTechnicians(t.currentLevel);
                    return (
                      <tr key={t.id}>
                        <td className="admin-tickets-ticket-number">{t.ticketNumber}</td>
                        <td className="admin-tickets-ticket-title">{t.title}</td>
                        <td>
                          <span className="admin-tickets-priority-badge" style={{ backgroundColor: priorityColor(t.priority) }}>
                            {getPriorityIcon(t.priority)}
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className="admin-tickets-level-badge">{t.levelName}</span>
                        </td>
                        <td>
                          <div className="admin-tickets-user-cell">
                            <User size={12} />
                            <span>{t.userId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-tickets-date-cell">
                            <Calendar size={12} />
                            <span>{new Date(t.createdAt).toLocaleDateString('es-EC')}</span>
                          </div>
                        </td>
                        <td>
                          <select
                            className="admin-tickets-select"
                            onChange={(e) => setSelectedTechs(prev => ({ ...prev, [t.id]: e.target.value }))}
                            value={selectedTechs[t.id] || ''}
                          >
                            <option value="">-- Seleccionar técnico --</option>
                            {availableTechs.map(tech => (
                              <option key={tech.id} value={tech.id}>
                                {tech.fullName} ({tech.role})
                              </option>
                            ))}
                          </select>
                          {availableTechs.length === 0 && (
                            <span className="admin-tickets-no-tech">No hay técnicos disponibles</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="admin-tickets-assign-btn"
                            onClick={() => {
                              const techId = selectedTechs[t.id];
                              const tech = availableTechs.find(tech => tech.id === parseInt(techId));
                              if (tech) {
                                handleAssign(t.id, tech.id, tech.fullName, t.ticketNumber);
                              } else {
                                setError(`Seleccione un técnico para el ticket ${t.ticketNumber}`);
                                setTimeout(() => setError(''), 3000);
                              }
                            }}
                            disabled={!selectedTechs[t.id] || assigning}
                          >
                            <UserCheck size={14} />
                            Asignar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tickets asignados */}
        {assignedTickets.length > 0 && (
          <>
            <h3 className="admin-tickets-section-title admin-tickets-assigned-title">
              <CheckCircle size={18} />
              Tickets asignados ({assignedTickets.length})
            </h3>

            <div className="admin-tickets-table-card">
              <div className="admin-tickets-table-wrapper">
                <table className="admin-tickets-table">
                  <thead>
                    <tr>
                      <th>N° Ticket</th>
                      <th>Título</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Nivel</th>
                      <th>Técnico</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedTickets.map((t) => (
                      <tr key={t.id}>
                        <td className="admin-tickets-ticket-number">{t.ticketNumber}</td>
                        <td className="admin-tickets-ticket-title">{t.title}</td>
                        <td>
                          <span className="admin-tickets-priority-badge" style={{ backgroundColor: priorityColor(t.priority) }}>
                            {getPriorityIcon(t.priority)}
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className="admin-tickets-status-badge" style={{ backgroundColor: statusColor(t.status) }}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <span className="admin-tickets-level-badge">{t.levelName}</span>
                        </td>
                        <td>
                          <span className="admin-tickets-tech-badge">
                            <User size={12} />
                            {t.assignedTechnicianId || 'No asignado'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-tickets-date-cell">
                            <Calendar size={12} />
                            <span>{new Date(t.createdAt).toLocaleDateString('es-EC')}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="admin-tickets-view-btn"
                            onClick={() => navigate(`/tickets/${t.id}`, { state: { from: '/admin/tickets' } })}
                          >
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
          </>
        )}
      </div>

      <style>{`
        .admin-tickets-page {
          padding: 28px 32px;
          flex: 1;
          min-height: 100vh;
          background-color: #f5f7fa;
        }

        .admin-tickets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .admin-tickets-title {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .admin-tickets-subtitle {
          font-size: 14px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-tickets-refresh-btn {
          background: #fff;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 10px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-tickets-success {
          background-color: #ecfdf3;
          color: #027a48;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-tickets-error {
          background-color: #fef3f2;
          color: #b42318;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-tickets-filters-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          padding: 16px 20px;
          margin-bottom: 24px;
        }

        .admin-tickets-search-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .admin-tickets-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .admin-tickets-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .admin-tickets-search-input {
          width: 100%;
          padding: 10px 16px 10px 38px;
          border-radius: 10px;
          border: 1px solid #d0d5dd;
          font-size: 14px;
          outline: none;
          background: #fff;
        }

        .admin-tickets-clear-search {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
        }

        .admin-tickets-filter-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #f9fafb;
          border: 1px solid #eaecf0;
          border-radius: 10px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .admin-tickets-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 16px;
        }

        .admin-tickets-filter-select {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d0d5dd;
          font-size: 14px;
          background: #fff;
          min-width: 150px;
        }

        .admin-tickets-stats {
          font-size: 13px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f9fafb;
          padding: 8px 14px;
          border-radius: 10px;
          margin-left: auto;
        }

        .admin-tickets-clear-filters {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 8px 14px;
          border-radius: 10px;
          cursor: pointer;
        }

        .admin-tickets-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a2e;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .admin-tickets-assigned-title {
          margin-top: 32px;
        }

        .admin-tickets-loading, .admin-tickets-empty {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .admin-tickets-spinner {
          animation: spin 1s linear infinite;
        }

        .admin-tickets-table-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .admin-tickets-table-wrapper {
          overflow-x: auto;
        }

        .admin-tickets-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        .admin-tickets-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #667085;
          background: #f9fafb;
          border-bottom: 1px solid #eaecf0;
        }

        .admin-tickets-table td {
          padding: 18px 20px;
          font-size: 13px;
          color: #344054;
          border-bottom: 1px solid #f1f3f5;
        }

        .admin-tickets-ticket-number {
          font-weight: 700;
          color: #4361ee;
          font-family: monospace;
        }

        .admin-tickets-ticket-title {
          max-width: 200px;
        }

        .admin-tickets-priority-badge, .admin-tickets-status-badge {
          color: #fff;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .admin-tickets-level-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .admin-tickets-tech-badge {
          background: #eef2ff;
          color: #4361ee;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .admin-tickets-user-cell, .admin-tickets-date-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-tickets-select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #d0d5dd;
          font-size: 12px;
          background: #fff;
          width: 100%;
          min-width: 150px;
        }

        .admin-tickets-no-tech {
          font-size: 11px;
          color: #dc2626;
          display: block;
          margin-top: 4px;
        }

        .admin-tickets-assign-btn {
          background: #10b981;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .admin-tickets-assign-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-tickets-view-btn {
          background: #4361ee;
          color: #fff;
          border: none;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-tickets-page {
            padding: 70px 12px 20px 12px;
          }

          .admin-tickets-title {
            font-size: 22px;
          }

          .admin-tickets-subtitle {
            font-size: 12px;
          }

          .admin-tickets-filter-toggle {
            display: flex;
          }

          .admin-tickets-filters {
            display: none;
            flex-direction: column;
            width: 100%;
          }

          .admin-tickets-filters-open {
            display: flex;
          }

          .admin-tickets-filter-select {
            width: 100%;
          }

          .admin-tickets-stats {
            margin-left: 0;
            justify-content: center;
          }

          .admin-tickets-clear-filters {
            justify-content: center;
          }

          .admin-tickets-table th, 
          .admin-tickets-table td {
            padding: 12px 16px;
          }

          .admin-tickets-ticket-title {
            max-width: 150px;
          }

          .admin-tickets-select {
            min-width: 120px;
          }
        }
      `}</style>
    </Layout>
  );
}

export default AdminTickets;