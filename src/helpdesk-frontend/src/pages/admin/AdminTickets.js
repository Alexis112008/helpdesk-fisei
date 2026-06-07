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
      // ✅ Usar el nuevo endpoint de admin (NO /accept)
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
      <div style={{ padding: '32px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Asignación de Tickets</h1>
            <p style={{ fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center' }}>
              <UserCheck size={14} style={{ marginRight: 6 }} />
              Asigna tickets manualmente a los técnicos según su nivel
            </p>
          </div>
          <button onClick={loadData} style={{
            background: '#fff',
            border: '1px solid #d1d5db',
            color: '#374151',
            padding: '10px 18px',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
          }}>
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            Actualizar
          </button>
        </div>

        {success && (
          <div style={{ backgroundColor: '#ecfdf3', color: '#027a48', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' }}>
            <CheckCircle size={18} style={{ marginRight: 10 }} />
            {success}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: '#fef3f2', color: '#b42318', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' }}>
            <AlertCircle size={18} style={{ marginRight: 10 }} />
            {error}
          </div>
        )}

        {/* Filtros */}
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap',
          backgroundColor: '#fff', padding: '16px 20px', borderRadius: 16, border: '1px solid #eaecf0'
        }}>
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} color="#9ca3af" />
            <input
              style={{ width: '100%', padding: '10px 32px 10px 38px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, outline: 'none', backgroundColor: '#fff' }}
              placeholder="Buscar por título o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 4 }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ position: 'relative', minWidth: 160 }}>
            <Filter size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} color="#6b7280" />
            <select style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, backgroundColor: '#fff', outline: 'none', cursor: 'pointer', appearance: 'none' }}
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="Abierto">Abierto</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Escalado">Escalado</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cerrado">Cerrado</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>

          <div style={{ position: 'relative', minWidth: 160 }}>
            <AlertCircle size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} color="#6b7280" />
            <select style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, backgroundColor: '#fff', outline: 'none', cursor: 'pointer', appearance: 'none' }}
              value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">Todas las prioridades</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>

          <div style={{ position: 'relative', minWidth: 160 }}>
            <Users size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} color="#6b7280" />
            <select style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, backgroundColor: '#fff', outline: 'none', cursor: 'pointer', appearance: 'none' }}
              value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">Todos los niveles</option>
              <option value="1">Nivel 1</option>
              <option value="2">Nivel 2</option>
              <option value="3">Nivel 3</option>
              <option value="4">Nivel 4</option>
            </select>
          </div>

          <div style={{ fontSize: 13, color: '#6b7280', marginLeft: 'auto', display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', padding: '8px 14px', borderRadius: 10 }}>
            <Ticket size={14} style={{ marginRight: 4 }} />
            {unassignedTickets.length} sin asignar | {assignedTickets.length} asignados
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', color: '#374151', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              <X size={14} style={{ marginRight: 4 }} />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tickets sin asignar */}
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Ticket size={18} style={{ marginRight: 8 }} />
          Tickets pendientes de asignación ({unassignedTickets.length})
        </h3>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: 15, marginTop: 12 }}>Cargando tickets...</p>
          </div>
        ) : unassignedTickets.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: 15 }}>
              {hasActiveFilters ? 'No hay tickets que coincidan con los filtros.' : 'No hay tickets pendientes de asignación.'}
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>N° Ticket</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Título</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Prioridad</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Nivel</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Usuario</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Fecha</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Asignar a</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedTickets.map((t) => {
                    const availableTechs = getAvailableTechnicians(t.currentLevel);
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <span style={{ fontWeight: 700, color: '#4361ee', display: 'inline-flex', alignItems: 'center' }}>
                            <Ticket size={12} style={{ marginRight: 4 }} />
                            {t.ticketNumber}
                          </span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>{t.title}</td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <span style={{ color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', backgroundColor: priorityColor(t.priority) }}>
                            {getPriorityIcon(t.priority)}
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <span style={{ background: '#f3f4f6', color: '#374151', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, display: 'inline-block' }}>{t.levelName}</span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={12} color="#6b7280" />
                            <span>{t.userId}</span>
                          </div>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={12} color="#9ca3af" />
                            <span>{new Date(t.createdAt).toLocaleDateString('es-EC')}</span>
                          </div>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <select
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d0d5dd', fontSize: 12, backgroundColor: '#fff', width: '100%', minWidth: 150 }}
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
                            <span style={{ fontSize: 11, color: '#dc2626', display: 'block', marginTop: 4 }}>No hay técnicos disponibles</span>
                          )}
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <button
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
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', opacity: !selectedTechs[t.id] || assigning ? 0.6 : 1 }}
                          >
                            <UserCheck size={14} style={{ marginRight: 6 }} />
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
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center', marginTop: 32, marginBottom: 16 }}>
              <CheckCircle size={18} style={{ marginRight: 8, color: '#10b981' }} />
              Tickets asignados ({assignedTickets.length})
            </h3>

            <div style={{ width: '100%', backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>N° Ticket</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Título</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Prioridad</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Estado</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Nivel</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Técnico</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Fecha</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedTickets.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <span style={{ fontWeight: 700, color: '#4361ee', display: 'inline-flex', alignItems: 'center' }}>
                            <Ticket size={12} style={{ marginRight: 4 }} />
                            {t.ticketNumber}
                          </span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>{t.title}</td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <span style={{ color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', backgroundColor: priorityColor(t.priority) }}>
                            {getPriorityIcon(t.priority)}
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <span style={{ color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', backgroundColor: statusColor(t.status) }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <span style={{ background: '#f3f4f6', color: '#374151', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, display: 'inline-block' }}>{t.levelName}</span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <span style={{ background: '#eef2ff', color: '#4361ee', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                            <User size={12} style={{ marginRight: 4 }} />
                            {t.assignedTechnicianId || 'No asignado'}
                          </span>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={12} color="#9ca3af" />
                            <span>{new Date(t.createdAt).toLocaleDateString('es-EC')}</span>
                          </div>
                        </td>
                        <td style={{ padding: '18px 20px', fontSize: 13, color: '#344054' }}>
                          <button
                            onClick={() => navigate(`/tickets/${t.id}`, { state: { from: '/admin/tickets' } })}
                            style={{ background: '#4361ee', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}
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
          </>
        )}
      </div>
    </Layout>
  );
}

// Añadir animación para el spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default AdminTickets;