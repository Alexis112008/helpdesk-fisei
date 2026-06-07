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

// Colores profesionales
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

  // Niveles disponibles
  const levels = ['Todos', 'Técnico Básico', 'Técnico Profesional', 'DITIC', 'Proveedor Externo'];

  // Métricas
  const [metrics, setMetrics] = useState({
    totalAvailable: 0,
    totalMine: 0,
    urgentAvailable: 0,
    urgentMine: 0,
    avgPriority: 'Media',
    byStatus: { EnProceso: 0, Escalado: 0, Resuelto: 0, Vencido: 0 }
  });

  // Calcular rango de fechas según preset
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

  // Cargas
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

  // SignalR
  useEffect(() => {
    let conn;
    (async () => {
      try {
        conn = await getConnection();
        await joinUserGroup(userId);
        await joinTechnicianGroup(userId);
        console.log(`[SignalR] Técnico ${userId} unido a grupos`);

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

  // Filtrado y ordenamiento
  const filteredAndSorted = useMemo(() => {
    let list = tab === 'available' ? available : mine;

    // Búsqueda
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.ticketNumber?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    // Filtro por prioridad
    if (filterPriority !== 'Todas') {
      list = list.filter(t => t.priority === filterPriority);
    }

    // Filtro por estado (solo en Mis tickets)
    if (tab === 'mine' && filterStatus !== 'Todos') {
      list = list.filter(t => t.status === filterStatus);
    }

    // Filtro por nivel
    if (filterLevel !== 'Todos') {
      list = list.filter(t => t.levelName === filterLevel);
    }

    // Solo urgentes
    if (urgentOnly) {
      list = list.filter(t => t.priority === 'Crítica' || t.priority === 'Alta');
    }

    // Filtro por rango de fechas
    const dateRange = getDateRangeFromPreset(dateRangePreset);
    if (dateRange.start) {
      list = list.filter(t => new Date(t.createdAt) >= dateRange.start);
    }
    if (dateRange.end) {
      list = list.filter(t => new Date(t.createdAt) <= dateRange.end);
    }

    // Ordenamiento
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
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (p) => ({
    'Baja': COLORS.Baja,
    'Media': COLORS.Media,
    'Alta': COLORS.Alta,
    'Crítica': COLORS.Critica,
  }[p] || COLORS.Media);

  const hasActiveFilters = filterPriority !== 'Todas' || filterStatus !== 'Todos' || filterLevel !== 'Todos' || urgentOnly || dateRangePreset !== 'todos' || search;

  const cardStyle = {
    background: '#fff',
    borderRadius: 20,
    border: '1px solid #e4e7eb',
    padding: '20px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  };

  return (
    <Layout>
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Bandeja de Entrada</h1>
            <p style={styles.subtitle}>
              <User size={12} style={{ marginRight: 4 }} />
              {fullName} — Rol: <b>{role}</b>
            </p>
          </div>
          <button style={styles.refreshBtn} onClick={loadAll}>
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            Actualizar
          </button>
        </div>

        {/* Tarjetas de métricas */}
        <div style={styles.metricsGrid}>
          <div style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inbox size={22} color={COLORS.Primario} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.Primario }}>{metrics.totalAvailable}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Disponibles</div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={22} color={COLORS.Resuelto} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.Resuelto }}>{metrics.totalMine}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Mis tickets</div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={22} color={COLORS.Critica} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.Critica }}>{metrics.urgentAvailable + metrics.urgentMine}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Urgentes</div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={22} color={COLORS.Media} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.Media }}>{metrics.avgPriority}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Prioridad promedio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'available' ? styles.tabActive : {}) }}
            onClick={() => setTab('available')}
          >
            <Inbox size={16} style={{ marginRight: 8 }} />
            Disponibles
            {metrics.totalAvailable > 0 && (
              <span style={styles.tabBadge}>{metrics.totalAvailable}</span>
            )}
          </button>

          <button
            style={{ ...styles.tab, ...(tab === 'mine' ? styles.tabActive : {}) }}
            onClick={() => setTab('mine')}
          >
            <Briefcase size={16} style={{ marginRight: 8 }} />
            Mis tickets
            {metrics.totalMine > 0 && (
              <span style={styles.tabBadge}>{metrics.totalMine}</span>
            )}
          </button>

          {/* Mini badges de estado en la pestaña */}
          {tab === 'mine' && metrics.totalMine > 0 && (
            <div style={styles.miniStatusBadges}>
              {metrics.byStatus.EnProceso > 0 && <span style={{ ...styles.miniBadge, background: '#fffbeb', color: '#f59e0b' }}>📋 {metrics.byStatus.EnProceso}</span>}
              {metrics.byStatus.Escalado > 0 && <span style={{ ...styles.miniBadge, background: '#f3e8ff', color: '#8b5cf6' }}>📈 {metrics.byStatus.Escalado}</span>}
              {metrics.byStatus.Resuelto > 0 && <span style={{ ...styles.miniBadge, background: '#ecfdf5', color: '#10b981' }}>✅ {metrics.byStatus.Resuelto}</span>}
              {metrics.byStatus.Vencido > 0 && <span style={{ ...styles.miniBadge, background: '#fef2f2', color: '#ef4444' }}>⏰ {metrics.byStatus.Vencido}</span>}
            </div>
          )}
        </div>

        {actionError && (
          <div style={styles.errorBanner}>
            <AlertCircle size={16} style={{ marginRight: 8 }} />
            {actionError}
          </div>
        )}

        {/* Barra de filtros - TODOS VISIBLES */}
        <div style={styles.filterBar}>
          {/* Búsqueda */}
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              style={styles.search}
              placeholder="Buscar por título, número o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={styles.clearSearch} onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtro de prioridad */}
          <div style={styles.filterItem}>
            <select style={styles.filterSelect} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="Todas"> Todas prioridades</option>
              <option value="Crítica"> Crítica</option>
              <option value="Alta"> Alta</option>
              <option value="Media"> Media</option>
              <option value="Baja"> Baja</option>
            </select>
          </div>

          {/* Filtro de estado (solo en Mis tickets) */}
          {tab === 'mine' && (
            <div style={styles.filterItem}>
              <select style={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="Todos"> Todos estados</option>
                <option value="En Proceso"> En Proceso</option>
                <option value="Escalado"> Escalado</option>
                <option value="Resuelto"> Resuelto</option>
                <option value="Vencido"> Vencido</option>
              </select>
            </div>
          )}

          {/* Filtro de nivel */}
          <div style={styles.filterItem}>
            <select style={styles.filterSelect} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              {levels.map(level => (
                <option key={level} value={level}>{level === 'Todos' ? ' Todos niveles' : level}</option>
              ))}
            </select>
          </div>

          {/* Filtro de urgentes */}
          <div style={styles.filterItem}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(e) => setUrgentOnly(e.target.checked)}
                style={styles.checkbox}
              />
              Solo urgentes
            </label>
          </div>

          {/* Filtro de rango de fechas - UN SOLO COMBOBOX */}
          <div style={styles.filterItem}>
            <select
              style={styles.filterSelect}
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
            >
              <option value="todos"> Todas las fechas</option>
              <option value="hoy"> Hoy</option>
              <option value="ultimos5"> Últimos 5 días</option>
              <option value="ultimos7"> Últimos 7 días</option>
              <option value="ultimos15"> Últimos 15 días</option>
              <option value="ultimos30"> Últimos 30 días</option>
            </select>
          </div>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <button style={styles.clearFiltersBtn} onClick={clearAllFilters}>
              <X size={14} style={{ marginRight: 4 }} />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla de tickets */}
        <div style={styles.card}>
          {loading ? (
            <div style={styles.empty}>
              <RefreshCw size={32} style={styles.spinner} />
              <p>Cargando tickets...</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div style={styles.empty}>
              <Inbox size={48} color="#d1d5db" />
              <p style={{ marginTop: 12, color: '#6b7280' }}>
                {tab === 'available'
                  ? 'No hay tickets disponibles en tu nivel'
                  : 'No tienes tickets asignados que coincidan con los filtros'}
              </p>
              {hasActiveFilters && (
                <button style={styles.clearFiltersEmptyBtn} onClick={clearAllFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.theadRow}>
                    <th style={styles.th} onClick={() => toggleSort('ticketNumber')}>
                      <div style={styles.thContent}>
                        ID <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={styles.th}>Título</th>
                    <th style={styles.th} onClick={() => toggleSort('priority')}>
                      <div style={styles.thContent}>
                        Prioridad <ArrowUpDown size={12} />
                      </div>
                    </th>
                    {tab === 'mine' && <th style={styles.th}>Estado</th>}
                    <th style={styles.th}>Nivel</th>
                    <th style={styles.th} onClick={() => toggleSort(tab === 'available' ? 'createdAt' : 'updatedAt')}>
                      <div style={styles.thContent}>
                        {tab === 'available' ? 'Creado' : 'Actualizado'} <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((t) => (
                    <tr key={t.id} style={styles.tr} onClick={() => navigate(tab === 'available' ? `/tecnico/ticket/${t.id}` : `/tecnico/ticket/${t.id}`)}>
                      <td style={styles.td}>
                        <span style={styles.tno}>{t.ticketNumber}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 500 }}>{t.title}</span>
                        <span style={styles.tdSub}>{t.description?.substring(0, 60)}...</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.priorityBadge, backgroundColor: getPriorityColor(t.priority) + '15', color: getPriorityColor(t.priority) }}>
                          {getPriorityIcon(t.priority)}
                          <span style={{ marginLeft: 4 }}>{t.priority}</span>
                        </span>
                      </td>
                      {tab === 'mine' && (
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, backgroundColor: statusColor(t.status) + '15', color: statusColor(t.status) }}>
                            {getStatusIcon(t.status)}
                            <span style={{ marginLeft: 4 }}>{t.status}</span>
                          </span>
                        </td>
                      )}
                      <td style={styles.td}>
                        <span style={styles.levelBadge}>{t.levelName}</span>
                      </td>
                      <td style={{ ...styles.td, fontSize: 12, color: '#6b7280' }}>
                        <Calendar size={12} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
                        {formatDate(tab === 'available' ? t.createdAt : t.updatedAt)}
                      </td>
                      <td style={styles.td}>
                        {tab === 'available' ? (
                          <button
                            style={{ ...styles.acceptBtn, opacity: busyAcceptId === t.id ? 0.6 : 1 }}
                            disabled={busyAcceptId === t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(t.id, t.ticketNumber);
                            }}
                          >
                            <Check size={14} style={{ marginRight: 6 }} />
                            {busyAcceptId === t.id ? 'Aceptando…' : 'Aceptar'}
                          </button>
                        ) : (
                          <button
                            style={styles.manageBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tecnico/ticket/${t.id}`);
                            }}
                          >
                            <Eye size={14} style={{ marginRight: 6 }} />
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
    </Layout>
  );
}

const styles = {
  page: { padding: '24px 32px', backgroundColor: '#f5f7fa', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 6, display: 'flex', alignItems: 'center' },
  refreshBtn: {
    background: '#fff',
    border: '1px solid #e4e7eb',
    color: '#374151',
    padding: '10px 18px',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #eaecf0', alignItems: 'center', flexWrap: 'wrap' },
  tab: {
    background: 'transparent',
    border: 'none',
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: '#6b7280',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.2s',
  },
  tabActive: { color: '#2d6a9f', borderBottomColor: '#2d6a9f' },
  tabBadge: {
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: '#eef2ff',
    color: '#2d6a9f',
    marginLeft: 6,
  },
  miniStatusBadges: { display: 'flex', gap: 6, marginLeft: 'auto' },
  miniBadge: { padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 },
  errorBanner: { background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', fontSize: 13 },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchWrapper: {
    position: 'relative',
    flex: 2,
    minWidth: 250,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  search: {
    width: '100%',
    padding: '10px 16px 10px 42px',
    border: '1px solid #e4e7eb',
    borderRadius: 12,
    fontSize: 13,
    outline: 'none',
    background: '#fff',
    transition: 'all 0.2s',
  },
  clearSearch: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
  },
  filterItem: {
    position: 'relative',
  },
  filterSelect: {
    padding: '10px 14px',
    border: '1px solid #e4e7eb',
    borderRadius: 12,
    fontSize: 13,
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
    minWidth: 140,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    border: '1px solid #e4e7eb',
    borderRadius: 12,
    fontSize: 13,
    cursor: 'pointer',
    background: '#fff',
    whiteSpace: 'nowrap',
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
    accentColor: '#2d6a9f',
  },
  clearFiltersBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 12,
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  clearFiltersEmptyBtn: {
    marginTop: 16,
    padding: '8px 20px',
    background: '#2d6a9f',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  card: { background: '#fff', borderRadius: 20, border: '1px solid #e4e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { background: '#f9fafb', borderBottom: '1px solid #eaecf0' },
  th: { padding: '14px 18px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', cursor: 'pointer' },
  thContent: { display: 'flex', alignItems: 'center', gap: 6 },
  tr: { borderBottom: '1px solid #f1f3f5', transition: 'background 0.2s', cursor: 'pointer' },
  td: { padding: '16px 18px', fontSize: 13, color: '#1a1a2e' },
  tdSub: { display: 'block', fontSize: 11, color: '#9ca3af', marginTop: 4 },
  tno: { fontWeight: 700, color: '#2d6a9f', fontFamily: 'monospace' },
  priorityBadge: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  statusBadge: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  levelBadge: { padding: '4px 10px', background: '#f3f4f6', borderRadius: 20, fontSize: 11, fontWeight: 500, color: '#374151' },
  acceptBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center' },
  manageBtn: { background: '#2d6a9f', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center' },
  empty: { padding: '60px', textAlign: 'center', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  spinner: { animation: 'spin 1s linear infinite' },
};

// Añadir animación
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  tr:hover { background-color: #f9fafb; }
  button:hover { transform: translateY(-1px); transition: all 0.2s; }
`;
document.head.appendChild(styleSheet);

export default TechnicianPanel;