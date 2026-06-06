import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  Inbox, 
  User, 
  CheckCircle, 
  Settings, 
  Search,
  Filter,
  AlertCircle,
  Clock,
  TrendingUp,
  Wrench,
  Briefcase,
  Eye,
  Check,
  Flame
} from 'lucide-react';
import Layout from '../components/Layout';
import { ticketAPI } from '../services/api';
import { getConnection } from '../services/realtime';

/**
 * HU5 — T5.5: Panel del Técnico.
 *
 * Dos tabs:
 *   - Disponibles: tickets sin asignar del nivel del técnico (servicios que atiende).
 *                  Botón "Aceptar" → se autoasigna a quien hace clic.
 *   - Mis tickets: tickets ya asignados al técnico autenticado.
 *
 * Se actualiza en tiempo real vía SignalR (T5.7) con los eventos:
 *   - ticket-available: un nuevo ticket entró al pool del nivel.
 *   - ticket-taken: alguien aceptó un ticket → ya no está disponible para los demás.
 *   - ticket-updated / ticket-action-added: alguno de mis tickets cambió.
 */
function TechnicianPanel() {
  const navigate = useNavigate();

  const [tab, setTab] = useState('available'); // 'available' | 'mine'
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [search, setSearch] = useState('');
  const [busyAcceptId, setBusyAcceptId] = useState(null);
  const [actionError, setActionError] = useState('');

  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');

  // ------------------------------------------------------------
  // Cargas
  // ------------------------------------------------------------
  const loadAvailable = useCallback(async () => {
    try {
      const res = await ticketAPI.get('/ticket/available');
      setAvailable(res.data);
    } catch (e) {
      console.error('Error cargando disponibles:', e);
    }
  }, []);

  const loadMine = useCallback(async () => {
    try {
      const url =
        filterStatus !== 'Todos'
          ? `/ticket/assigned?status=${encodeURIComponent(filterStatus)}`
          : '/ticket/assigned';
      const res = await ticketAPI.get(url);
      setMine(res.data);
    } catch (e) {
      console.error('Error cargando asignados:', e);
    }
  }, [filterStatus]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAvailable(), loadMine()]);
    setLoading(false);
  }, [loadAvailable, loadMine]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ------------------------------------------------------------
  // Tiempo real
  // ------------------------------------------------------------
  useEffect(() => {
    let conn;
    (async () => {
      try {
        conn = await getConnection();
        // Cuando entra un ticket al pool o alguien lo toma, refrescamos disponibles
        conn.on('ticket-available', loadAvailable);
        conn.on('ticket-taken', loadAvailable);
        // Cambios sobre tickets ya asignados
        conn.on('ticket-updated', loadMine);
        conn.on('ticket-action-added', loadMine);
        conn.on('ticket-escalated', loadAll);
      } catch (e) { /* silencioso */ }
    })();

    return () => {
      if (conn) {
        conn.off('ticket-available', loadAvailable);
        conn.off('ticket-taken', loadAvailable);
        conn.off('ticket-updated', loadMine);
        conn.off('ticket-action-added', loadMine);
        conn.off('ticket-escalated', loadAll);
      }
    };
  }, [loadAvailable, loadMine, loadAll]);

  // ------------------------------------------------------------
  // Aceptar ticket
  // ------------------------------------------------------------
  const handleAccept = async (ticketId, ticketNumber) => {
    if (!window.confirm(`¿Aceptas el ticket ${ticketNumber}?\nQuedará asignado a ti y pasará a "En Proceso".`)) {
      return;
    }
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

  // ------------------------------------------------------------
  // Filtros UI
  // ------------------------------------------------------------
  const currentList = tab === 'available' ? available : mine;

  const filtered = currentList.filter((t) => {
    if (tab === 'mine' && filterPriority !== 'Todas' && t.priority !== filterPriority) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !t.ticketNumber.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const statusColor = (st) => ({
    'Abierto': '#1565c0',
    'En Proceso': '#f57f17',
    'Escalado': '#6a1b9a',
    'Resuelto': '#2e7d32',
    'Cerrado': '#424242',
    'Vencido': '#b71c1c',
  }[st] || '#333');

  const priorityColor = (p) => ({
    'Baja': '#388e3c',
    'Media': '#f57f17',
    'Alta': '#e64a19',
    'Crítica': '#b71c1c',
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

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Bandeja de Entrada</h1>
            <p style={s.subtitle}>
              <User size={12} style={{ marginRight: 4 }} />
              {fullName} — Rol: <b>{role}</b>
            </p>
          </div>
          <button style={s.refreshBtn} onClick={loadAll}>
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            Actualizar
          </button>
        </div>

        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === 'available' ? s.tabActive : {}) }}
            onClick={() => setTab('available')}
          >
            <Inbox size={16} style={{ marginRight: 8 }} />
            Disponibles
            {available.length > 0 && (
              <span style={{
                ...s.tabBadge,
                background: tab === 'available' ? '#fff' : '#4361ee',
                color: tab === 'available' ? '#4361ee' : '#fff',
              }}>
                {available.length}
              </span>
            )}
          </button>

          <button
            style={{ ...s.tab, ...(tab === 'mine' ? s.tabActive : {}) }}
            onClick={() => setTab('mine')}
          >
            <Briefcase size={16} style={{ marginRight: 8 }} />
            Mis tickets
            {mine.length > 0 && (
              <span style={{
                ...s.tabBadge,
                background: tab === 'mine' ? '#fff' : '#4361ee',
                color: tab === 'mine' ? '#4361ee' : '#fff',
              }}>
                {mine.length}
              </span>
            )}
          </button>
        </div>

        {actionError && (
          <div style={s.errorBanner}>
            <AlertCircle size={16} style={{ marginRight: 8 }} />
            {actionError}
          </div>
        )}

        <div style={s.toolbar}>
          <div style={s.searchWrapper}>
            <Search size={18} style={s.searchIcon} color="#9ca3af" />
            <input
              style={s.search}
              placeholder="Buscar por título o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {tab === 'mine' && (
            <>
              <div style={s.filterWrapper}>
                <Filter size={16} style={s.filterIcon} color="#6b7280" />
                <select
                  style={s.select}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option>Todos</option>
                  <option>En Proceso</option>
                  <option>Escalado</option>
                  <option>Resuelto</option>
                  <option>Vencido</option>
                </select>
              </div>
              <div style={s.filterWrapper}>
                <AlertCircle size={16} style={s.filterIcon} color="#6b7280" />
                <select
                  style={s.select}
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option>Todas</option>
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div style={s.card}>
          {loading ? (
            <div style={s.empty}>
              <RefreshCw size={24} style={s.spinner} />
              Cargando tickets...
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              {tab === 'available'
                ? 'No hay tickets disponibles en tu nivel y servicios asignados.'
                : 'No tienes tickets asignados que coincidan.'}
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>Título</th>
                  <th style={s.th}>Prioridad</th>
                  {tab === 'mine' && <th style={s.th}>Estado</th>}
                  <th style={s.th}>Nivel</th>
                  <th style={s.th}>{tab === 'available' ? 'Creado' : 'Actualizado'}</th>
                  <th style={s.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} style={s.tr}>
                    <td style={s.td}>
                      <span style={s.tno}>{t.ticketNumber}</span>
                    </td>
                    <td style={s.td}>{t.title}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: priorityColor(t.priority) }}>
                        {getPriorityIcon(t.priority)}
                        {t.priority}
                      </span>
                    </td>
                    {tab === 'mine' && (
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: statusColor(t.status) }}>
                          {t.status}
                        </span>
                      </td>
                    )}
                    <td style={s.td}>{t.levelName}</td>
                    <td style={s.td}>
                      {new Date(tab === 'available' ? t.createdAt : t.updatedAt)
                        .toLocaleString('es-EC')}
                    </td>
                    <td style={s.td}>
                      {tab === 'available' ? (
                        <button
                          style={{
                            ...s.acceptBtn,
                            opacity: busyAcceptId === t.id ? 0.6 : 1,
                            cursor: busyAcceptId === t.id ? 'wait' : 'pointer',
                          }}
                          disabled={busyAcceptId === t.id}
                          onClick={() => handleAccept(t.id, t.ticketNumber)}
                        >
                          <Check size={14} style={{ marginRight: 6 }} />
                          {busyAcceptId === t.id ? 'Aceptando…' : 'Aceptar'}
                        </button>
                      ) : (
                        <button
                          style={s.manageBtn}
                          onClick={() => navigate(`/tecnico/ticket/${t.id}`)}
                        >
                          <Settings size={14} style={{ marginRight: 6 }} />
                          Gestionar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

const s = {
  page: { padding: 0 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { 
    fontSize: 13, 
    color: '#6b7280', 
    marginTop: 4,
    display: 'flex',
    alignItems: 'center'
  },
  refreshBtn: {
    background: '#fff',
    border: '1px solid #d1d5db',
    color: '#374151',
    padding: '10px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    borderBottom: '1px solid #eaecf0',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: '#6b7280',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tabActive: {
    color: '#4361ee',
    borderBottom: '2px solid #4361ee',
  },
  tabBadge: {
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    minWidth: 18,
    textAlign: 'center',
  },
  errorBanner: {
    background: '#fef3f2',
    color: '#b42318',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
  },
  toolbar: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: 220,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  search: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
  },
  filterWrapper: {
    position: 'relative',
    minWidth: 150,
  },
  filterIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 14,
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #eaecf0',
    overflow: 'hidden',
  },
  empty: { 
    padding: 60, 
    textAlign: 'center', 
    color: '#6b7280',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f9fafb' },
  th: {
    padding: '14px 18px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 700,
    color: '#667085',
    borderBottom: '1px solid #eaecf0',
    textTransform: 'uppercase',
  },
  tr: { borderBottom: '1px solid #f1f3f5' },
  td: { padding: '14px 18px', fontSize: 14, color: '#344054' },
  tno: { fontWeight: 700, color: '#4361ee' },
  badge: {
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
  },
  acceptBtn: {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    padding: '7px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
  },
  manageBtn: {
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
  },
};

// Añadir animación para el spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default TechnicianPanel;