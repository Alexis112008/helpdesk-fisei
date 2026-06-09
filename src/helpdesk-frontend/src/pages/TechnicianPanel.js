import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Inbox,
  User,
  CheckCircle,
  Settings,
  Search,
  AlertCircle,
  Clock,
  TrendingUp,
  Briefcase,
  Eye,
  Check,
  Flame,
  Calendar,
  ArrowUpDown,
  X,
  Ticket,
  Target,
  Activity,
  Tag,
  AlertTriangle,
  Filter
} from 'lucide-react';
import Layout from '../components/Layout';
import { ticketAPI } from '../services/api';
import { getConnection, joinTechnicianGroup, joinUserGroup } from '../services/realtime';

const COLORS = {
  Primario: '#2d6a9f',
  PrimarioOscuro: '#1e3a5f',
  PrimarioLight: '#eef2ff',
  Abierto: '#2d6a9f',
  EnProceso: '#f59e0b',
  Resuelto: '#10b981',
  Cerrado: '#6b7280',
  Escalado: '#8b5cf6',
  Vencido: '#ef4444',
  Baja: '#10b981',
  Media: '#f59e0b',
  Alta: '#f97316',
  Critica: '#ef4444'
};

const statusColor = (status) => ({
  'Abierto': '#2d6a9f',
  'En Proceso': '#f59e0b',
  'Escalado': '#8b5cf6',
  'Resuelto': '#10b981',
  'Cerrado': '#6b7280',
  'Vencido': '#ef4444',
}[status] || '#6b7280');

function TechnicianPanel() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');
  const userId = parseInt(localStorage.getItem('userId') || '0');
  const [showFilters, setShowFilters] = useState(false);

  const [tab, setTab] = useState('available');
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [filterLevel, setFilterLevel] = useState('Todos');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [busyAcceptId, setBusyAcceptId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState('todos');
  const [urgentOnly, setUrgentOnly] = useState(false);

  const levels = ['Todos', 'Técnico Básico', 'Técnico Profesional', 'DITIC', 'Proveedor Externo'];

  const [metrics, setMetrics] = useState({
    totalAvailable: 0,
    totalMine: 0,
    urgentAvailable: 0,
    urgentMine: 0,
    avgPriority: 'Media',
    byStatus: { EnProceso: 0, Escalado: 0, Resuelto: 0, Vencido: 0 }
  });

  const getDateRangeFromPreset = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    switch (preset) {
      case 'hoy':
        return { start: today, end: endOfDay };
      case 'ultimos5':
        const last5 = new Date();
        last5.setDate(today.getDate() - 5);
        last5.setHours(0, 0, 0, 0);
        return { start: last5, end: endOfDay };
      case 'ultimos7':
        const last7 = new Date();
        last7.setDate(today.getDate() - 7);
        last7.setHours(0, 0, 0, 0);
        return { start: last7, end: endOfDay };
      case 'ultimos15':
        const last15 = new Date();
        last15.setDate(today.getDate() - 15);
        last15.setHours(0, 0, 0, 0);
        return { start: last15, end: endOfDay };
      case 'ultimos30':
        const last30 = new Date();
        last30.setDate(today.getDate() - 30);
        last30.setHours(0, 0, 0, 0);
        return { start: last30, end: endOfDay };
      default:
        return { start: null, end: null };
    }
  };

  const loadAvailable = useCallback(async () => {
    try {
      const res = await ticketAPI.get('/ticket/available');
      setAvailable(res.data);
      setMetrics(prev => ({
        ...prev,
        totalAvailable: res.data.length,
        urgentAvailable: res.data.filter(t => t.priority === 'Crítica' || t.priority === 'Alta').length
      }));
    } catch (e) {
      console.error('Error cargando disponibles:', e);
    }
  }, []);

  const loadMine = useCallback(async () => {
    try {
      const res = await ticketAPI.get('/ticket/assigned');
      setMine(res.data);

      const priorities = { 'Baja': 1, 'Media': 2, 'Alta': 3, 'Crítica': 4 };
      let avgPriorityValue = 0;
      res.data.forEach(t => { avgPriorityValue += priorities[t.priority] || 2; });
      const avg = avgPriorityValue / (res.data.length || 1);
      const avgPriorityName = Object.keys(priorities).find(key => priorities[key] === Math.round(avg)) || 'Media';

      setMetrics(prev => ({
        ...prev,
        totalMine: res.data.length,
        urgentMine: res.data.filter(t => t.priority === 'Crítica' || t.priority === 'Alta').length,
        avgPriority: avgPriorityName,
        byStatus: {
          EnProceso: res.data.filter(t => t.status === 'En Proceso').length,
          Escalado: res.data.filter(t => t.status === 'Escalado').length,
          Resuelto: res.data.filter(t => t.status === 'Resuelto').length,
          Vencido: res.data.filter(t => t.status === 'Vencido').length
        }
      }));
    } catch (e) {
      console.error('Error cargando asignados:', e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAvailable(), loadMine()]);
    setLoading(false);
  }, [loadAvailable, loadMine]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    let conn;
    (async () => {
      try {
        conn = await getConnection();
        await joinUserGroup(userId);
        await joinTechnicianGroup(userId);

        conn.on('ticket-available', loadAvailable);
        conn.on('ticket-taken', loadAvailable);
        conn.on('ticket-updated', () => {
          loadMine();
          loadAvailable();
        });
        conn.on('ticket-action-added', loadMine);
        conn.on('ticket-closed', () => {
          loadMine();
          loadAvailable();
        });
        conn.on('ticket-escalated', loadAll);
      } catch (e) {
        console.error('Error SignalR:', e);
      }
    })();

    return () => {
      if (conn) {
        conn.off('ticket-available', loadAvailable);
        conn.off('ticket-taken', loadAvailable);
        conn.off('ticket-updated', loadMine);
        conn.off('ticket-action-added', loadMine);
        conn.off('ticket-closed', loadMine);
        conn.off('ticket-escalated', loadAll);
      }
    };
  }, [loadAvailable, loadMine, loadAll, userId]);

  const handleAccept = async (ticketId, ticketNumber) => {
    if (!window.confirm(`¿Aceptas el ticket ${ticketNumber}?`)) return;
    setBusyAcceptId(ticketId);
    setActionError('');
    try {
      await ticketAPI.post(`/ticket/${ticketId}/accept`);
      await loadAll();
      setTab('mine');
    } catch (err) {
      setActionError(err.response?.data?.message || 'No se pudo aceptar el ticket.');
    } finally {
      setBusyAcceptId(null);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = tab === 'available' ? available : mine;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.ticketNumber?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    if (filterPriority !== 'Todas') {
      list = list.filter(t => t.priority === filterPriority);
    }

    if (tab === 'mine' && filterStatus !== 'Todos') {
      list = list.filter(t => t.status === filterStatus);
    }

    if (filterLevel !== 'Todos') {
      list = list.filter(t => t.levelName === filterLevel);
    }

    if (urgentOnly) {
      list = list.filter(t => t.priority === 'Crítica' || t.priority === 'Alta');
    }

    const dateRange = getDateRangeFromPreset(dateRangePreset);
    if (dateRange.start) {
      list = list.filter(t => new Date(t.createdAt) >= dateRange.start);
    }
    if (dateRange.end) {
      list = list.filter(t => new Date(t.createdAt) <= dateRange.end);
    }

    list = [...list].sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'Crítica': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };
          valA = priorityOrder[a.priority] || 0;
          valB = priorityOrder[b.priority] || 0;
          break;
        case 'createdAt':
          valA = new Date(a.createdAt);
          valB = new Date(b.createdAt);
          break;
        case 'updatedAt':
          valA = new Date(a.updatedAt);
          valB = new Date(b.updatedAt);
          break;
        case 'ticketNumber':
          valA = a.ticketNumber;
          valB = b.ticketNumber;
          break;
        default:
          valA = new Date(a.updatedAt);
          valB = new Date(b.updatedAt);
      }
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    return list;
  }, [tab, available, mine, search, filterPriority, filterStatus, filterLevel, urgentOnly, dateRangePreset, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearAllFilters = () => {
    setFilterPriority('Todas');
    setFilterStatus('Todos');
    setFilterLevel('Todos');
    setDateRangePreset('todos');
    setUrgentOnly(false);
    setSearch('');
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Baja': return <CheckCircle size={14} color={COLORS.Baja} />;
      case 'Media': return <Clock size={14} color={COLORS.Media} />;
      case 'Alta': return <TrendingUp size={14} color={COLORS.Alta} />;
      case 'Crítica': return <Flame size={14} color={COLORS.Critica} />;
      default: return null;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Abierto': return <Ticket size={12} />;
      case 'En Proceso': return <Activity size={12} />;
      case 'Escalado': return <AlertTriangle size={12} />;
      case 'Resuelto': return <CheckCircle size={12} />;
      case 'Cerrado': return <CheckCircle size={12} />;
      default: return null;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
  };

  const getPriorityColor = (p) => ({
    'Baja': COLORS.Baja,
    'Media': COLORS.Media,
    'Alta': COLORS.Alta,
    'Crítica': COLORS.Critica,
  }[p] || COLORS.Media);

  const hasActiveFilters = filterPriority !== 'Todas' || filterStatus !== 'Todos' || filterLevel !== 'Todos' || urgentOnly || dateRangePreset !== 'todos' || search;

  return (
    <Layout>
      <div className="tech-panel">
        {/* Header */}
        <div className="tech-header">
          <div>
            <h1 className="tech-title">Bandeja de Entrada</h1>
            <p className="tech-subtitle">
              <User size={12} />
              {fullName} — Rol: <b>{role}</b>
            </p>
          </div>
          <button className="tech-refresh-btn" onClick={loadAll}>
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        {/* Tarjetas de métricas */}
        <div className="tech-metrics">
          <div className="tech-metric-card">
            <div className="tech-metric-icon tech-metric-icon-primary">
              <Inbox size={22} />
            </div>
            <div>
              <div className="tech-metric-value">{metrics.totalAvailable}</div>
              <div className="tech-metric-label">Disponibles</div>
            </div>
          </div>

          <div className="tech-metric-card">
            <div className="tech-metric-icon tech-metric-icon-success">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="tech-metric-value">{metrics.totalMine}</div>
              <div className="tech-metric-label">Mis tickets</div>
            </div>
          </div>

          <div className="tech-metric-card">
            <div className="tech-metric-icon tech-metric-icon-danger">
              <Flame size={22} />
            </div>
            <div>
              <div className="tech-metric-value">{metrics.urgentAvailable + metrics.urgentMine}</div>
              <div className="tech-metric-label">Urgentes</div>
            </div>
          </div>

          <div className="tech-metric-card">
            <div className="tech-metric-icon tech-metric-icon-warning">
              <Target size={22} />
            </div>
            <div>
              <div className="tech-metric-value">{metrics.avgPriority}</div>
              <div className="tech-metric-label">Prioridad promedio</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tech-tabs">
          <button
            className={`tech-tab ${tab === 'available' ? 'tech-tab-active' : ''}`}
            onClick={() => setTab('available')}
          >
            <Inbox size={16} />
            Disponibles
            {metrics.totalAvailable > 0 && (
              <span className="tech-tab-badge">{metrics.totalAvailable}</span>
            )}
          </button>

          <button
            className={`tech-tab ${tab === 'mine' ? 'tech-tab-active' : ''}`}
            onClick={() => setTab('mine')}
          >
            <Briefcase size={16} />
            Mis tickets
            {metrics.totalMine > 0 && (
              <span className="tech-tab-badge">{metrics.totalMine}</span>
            )}
          </button>

          {tab === 'mine' && metrics.totalMine > 0 && (
            <div className="tech-mini-badges">
              {metrics.byStatus.EnProceso > 0 && <span className="tech-mini-badge tech-mini-badge-proceso">📋 {metrics.byStatus.EnProceso}</span>}
              {metrics.byStatus.Escalado > 0 && <span className="tech-mini-badge tech-mini-badge-escalado">📈 {metrics.byStatus.Escalado}</span>}
              {metrics.byStatus.Resuelto > 0 && <span className="tech-mini-badge tech-mini-badge-resuelto">✅ {metrics.byStatus.Resuelto}</span>}
              {metrics.byStatus.Vencido > 0 && <span className="tech-mini-badge tech-mini-badge-vencido">⏰ {metrics.byStatus.Vencido}</span>}
            </div>
          )}
        </div>

        {actionError && (
          <div className="tech-error">
            <AlertCircle size={16} />
            {actionError}
          </div>
        )}

        {/* Barra de filtros */}
        <div className="tech-filter-bar">
          <div className="tech-search-wrapper">
            <Search size={18} className="tech-search-icon" />
            <input
              className="tech-search"
              placeholder="Buscar por título, número o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="tech-clear-search" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <button className="tech-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} />
            Filtros
          </button>

          <div className={`tech-filters ${showFilters ? 'tech-filters-open' : ''}`}>
            <select className="tech-filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="Todas"> Todas prioridades</option>
              <option value="Crítica"> Crítica</option>
              <option value="Alta"> Alta</option>
              <option value="Media"> Media</option>
              <option value="Baja"> Baja</option>
            </select>

            {tab === 'mine' && (
              <select className="tech-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="Todos"> Todos estados</option>
                <option value="En Proceso"> En Proceso</option>
                <option value="Escalado"> Escalado</option>
                <option value="Resuelto"> Resuelto</option>
                <option value="Vencido"> Vencido</option>
              </select>
            )}

            <select className="tech-filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              {levels.map(level => (
                <option key={level} value={level}>{level === 'Todos' ? ' Todos niveles' : level}</option>
              ))}
            </select>

            <label className="tech-checkbox-label">
              <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} />
              Solo urgentes
            </label>

            <select className="tech-filter-select" value={dateRangePreset} onChange={(e) => setDateRangePreset(e.target.value)}>
              <option value="todos"> Todas las fechas</option>
              <option value="hoy"> Hoy</option>
              <option value="ultimos5"> Últimos 5 días</option>
              <option value="ultimos7"> Últimos 7 días</option>
              <option value="ultimos15"> Últimos 15 días</option>
              <option value="ultimos30"> Últimos 30 días</option>
            </select>

            {hasActiveFilters && (
              <button className="tech-clear-filters" onClick={clearAllFilters}>
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla de tickets */}
        <div className="tech-card">
          {loading ? (
            <div className="tech-empty">
              <RefreshCw size={32} className="tech-spinner" />
              <p>Cargando tickets...</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="tech-empty">
              <Inbox size={48} color="#d1d5db" />
              <p>
                {tab === 'available'
                  ? 'No hay tickets disponibles en tu nivel'
                  : 'No tienes tickets asignados que coincidan con los filtros'}
              </p>
              {hasActiveFilters && (
                <button className="tech-clear-filters-empty" onClick={clearAllFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="tech-table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('ticketNumber')}>ID <ArrowUpDown size={12} /></th>
                    <th>Título</th>
                    <th onClick={() => toggleSort('priority')}>Prioridad <ArrowUpDown size={12} /></th>
                    {tab === 'mine' && <th>Estado</th>}
                    <th>Nivel</th>
                    <th onClick={() => toggleSort(tab === 'available' ? 'createdAt' : 'updatedAt')}>
                      {tab === 'available' ? 'Creado' : 'Actualizado'} <ArrowUpDown size={12} />
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((t) => (
                    <tr key={t.id} onClick={() => {
                      // Forzar que el menú se cierre ANTES de navegar
                      setTimeout(() => {
                        navigate(`/tecnico/ticket/${t.id}`);
                      }, 50);
                    }}>
                      <td className="tech-ticket-number">{t.ticketNumber}</td>
                      <td>
                        <div className="tech-ticket-title">{t.title}</div>
                        <div className="tech-ticket-desc">{t.description?.substring(0, 60)}...</div>
                      </td>
                      <td>
                        <span className="tech-priority-badge" style={{ backgroundColor: getPriorityColor(t.priority) + '15', color: getPriorityColor(t.priority) }}>
                          {getPriorityIcon(t.priority)}
                          {t.priority}
                        </span>
                      </td>
                      {tab === 'mine' && (
                        <td>
                          <span className="tech-status-badge" style={{ backgroundColor: statusColor(t.status) + '15', color: statusColor(t.status) }}>
                            {getStatusIcon(t.status)}
                            {t.status}
                          </span>
                        </td>
                      )}
                      <td><span className="tech-level-badge">{t.levelName}</span></td>
                      <td className="tech-date">
                        <Calendar size={12} />
                        {formatDate(tab === 'available' ? t.createdAt : t.updatedAt)}
                      </td>
                      <td>
                        {tab === 'available' ? (
                          <button
                            className="tech-accept-btn"
                            disabled={busyAcceptId === t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(t.id, t.ticketNumber);
                            }}
                          >
                            <Check size={14} />
                            {busyAcceptId === t.id ? 'Aceptando…' : 'Aceptar'}
                          </button>
                        ) : (
                          <button
                            className="tech-manage-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('close-sidebar'));
                              setTimeout(() => {
                                navigate(`/tecnico/ticket/${t.id}`);
                              }, 50);
                            }}
                          >
                            <Eye size={14} />
                            Gestionar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .tech-panel {
          padding: 24px 32px;
          background-color: #f5f7fa;
          min-height: 100vh;
        }

        .tech-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .tech-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }

        .tech-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tech-refresh-btn {
          background: #fff;
          border: 1px solid #e4e7eb;
          color: #374151;
          padding: 10px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .tech-refresh-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .tech-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .tech-metric-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e4e7eb;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tech-metric-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tech-metric-icon-primary { background: #eef2ff; color: #2d6a9f; }
        .tech-metric-icon-success { background: #ecfdf5; color: #10b981; }
        .tech-metric-icon-danger { background: #fef2f2; color: #ef4444; }
        .tech-metric-icon-warning { background: #fffbeb; color: #f59e0b; }

        .tech-metric-value {
          font-size: 24px;
          font-weight: 800;
        }

        .tech-metric-label {
          font-size: 12px;
          color: #6b7280;
        }

        .tech-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #eaecf0;
          align-items: center;
          flex-wrap: wrap;
        }

        .tech-tab {
          background: transparent;
          border: none;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .tech-tab-active {
          color: #2d6a9f;
          border-bottom-color: #2d6a9f;
        }

        .tech-tab-badge {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          background: #eef2ff;
          color: #2d6a9f;
        }

        .tech-mini-badges {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }

        .tech-mini-badge {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
        }

        .tech-mini-badge-proceso { background: #fffbeb; color: #f59e0b; }
        .tech-mini-badge-escalado { background: #f3e8ff; color: #8b5cf6; }
        .tech-mini-badge-resuelto { background: #ecfdf5; color: #10b981; }
        .tech-mini-badge-vencido { background: #fef2f2; color: #ef4444; }

        .tech-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .tech-filter-bar {
          margin-bottom: 20px;
        }

        .tech-search-wrapper {
          position: relative;
          margin-bottom: 12px;
        }

        .tech-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .tech-search {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border: 1px solid #e4e7eb;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }

        .tech-clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
        }

        .tech-filter-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          background: #fff;
          border: 1px solid #e4e7eb;
          border-radius: 12px;
          padding: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .tech-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .tech-filter-select {
          padding: 10px 14px;
          border: 1px solid #e4e7eb;
          border-radius: 12px;
          font-size: 13px;
          background: #fff;
          cursor: pointer;
          min-width: 140px;
        }

        .tech-checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border: 1px solid #e4e7eb;
          border-radius: 12px;
          font-size: 13px;
          cursor: pointer;
          background: #fff;
          white-space: nowrap;
        }

        .tech-checkbox-label input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #2d6a9f;
        }

        .tech-clear-filters {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }

        .tech-clear-filters-empty {
          margin-top: 16px;
          padding: 8px 20px;
          background: #2d6a9f;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          cursor: pointer;
        }

        .tech-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e4e7eb;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .tech-table-container {
          overflow-x: auto;
        }

        .tech-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        .tech-table th {
          padding: 14px 18px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          cursor: pointer;
          background: #f9fafb;
          border-bottom: 1px solid #eaecf0;
        }

        .tech-table td {
          padding: 16px 18px;
          font-size: 13px;
          color: #1a1a2e;
          border-bottom: 1px solid #f1f3f5;
          cursor: pointer;
        }

        .tech-table tr:hover td {
          background-color: #f9fafb;
        }

        .tech-ticket-number {
          font-weight: 700;
          color: #2d6a9f;
          font-family: monospace;
        }

        .tech-ticket-title {
          font-weight: 500;
        }

        .tech-ticket-desc {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .tech-priority-badge, .tech-status-badge, .tech-level-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .tech-level-badge {
          background: #f3f4f6;
          color: #374151;
        }

        .tech-date {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tech-accept-btn, .tech-manage-btn {
          border: none;
          padding: 7px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .tech-accept-btn {
          background: #10b981;
          color: #fff;
        }

        .tech-manage-btn {
          background: #2d6a9f;
          color: #fff;
        }

        .tech-empty {
          padding: 60px;
          text-align: center;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .tech-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .tech-panel {
            padding: 70px 12px 20px 12px;
          }

          .tech-title {
            font-size: 22px;
          }

          .tech-subtitle {
            font-size: 11px;
          }

          .tech-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .tech-metric-card {
            padding: 12px 16px;
          }

          .tech-metric-value {
            font-size: 20px;
          }

          .tech-filter-toggle {
            display: flex;
          }

          .tech-filters {
            display: none;
            flex-direction: column;
            width: 100%;
          }

          .tech-filters-open {
            display: flex;
          }

          .tech-filter-select, .tech-checkbox-label, .tech-clear-filters {
            width: 100%;
            justify-content: center;
          }

          .tech-mini-badges {
            margin-left: 0;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </Layout>
  );
}

export default TechnicianPanel;