import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Power,
  PowerOff,
  User,
  Mail,
  Briefcase,
  Shield,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  RefreshCw,
  UserCog,
  Tag,
  Search,
  Filter
} from 'lucide-react';
import { authAPI, catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function TechnicianAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const [form, setForm] = useState({
    technicianId: '',
    serviceCatalogId: '',
  });

  // Obtener nivel según el rol del técnico
  const getTechnicianLevel = (role) => {
    switch (role) {
      case 'TecnicoN1': return 1;
      case 'TecnicoN2': return 2;
      case 'DITIC': return 3;
      case 'Proveedor': return 4;
      default: return null;
    }
  };

  // Obtener el nivel de atención del técnico (mismo método)
  const getAttentionLevel = (role) => {
    switch (role) {
      case 'TecnicoN1': return 1;
      case 'TecnicoN2': return 2;
      case 'DITIC': return 3;
      case 'Proveedor': return 4;
      default: return null;
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tech, svc, asg] = await Promise.all([
        authAPI.get('/technicians/list'),
        catalogAPI.get('/servicecatalog'),
        authAPI.get('/technicians/assignments'),
      ]);
      setTechnicians(tech.data);
      setServices(svc.data);
      setAssignments(asg.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const selectedTechnician = technicians.find(
    (t) => t.id === parseInt(form.technicianId)
  );

  // Filtrar técnicos para el modal por nivel
  const filteredTechnicians = useMemo(() => {
    if (!filterLevel) return technicians;
    return technicians.filter(t => getTechnicianLevel(t.role) === parseInt(filterLevel));
  }, [technicians, filterLevel]);

  // Filtrar asignaciones por búsqueda
  const filteredAssignments = useMemo(() => {
    if (!search) return assignments;
    return assignments.filter(a => {
      const tech = technicians.find(t => t.id === a.technicianId);
      const service = services.find(s => s.id === a.serviceCatalogId);
      return (tech?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        service?.name?.toLowerCase().includes(search.toLowerCase()));
    });
  }, [assignments, technicians, services, search]);

  const openCreateModal = () => {
    setForm({ technicianId: '', serviceCatalogId: '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!form.technicianId || !form.serviceCatalogId) {
      setError('Debe seleccionar técnico y servicio');
      setSaving(false);
      return;
    }

    try {
      await authAPI.post('/technicians/assignments', {
        technicianId: parseInt(form.technicianId),
        serviceCatalogId: parseInt(form.serviceCatalogId),
      });
      setSuccess('Asignación creada correctamente');
      setTimeout(() => {
        closeModal();
        loadAll();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear asignación');
      setSaving(false);
    }
  };

  const handleToggleActive = async (id, currentState) => {
    try {
      await authAPI.patch(`/technicians/assignments/${id}/active`, !currentState, {
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccess(currentState ? 'Asignación desactivada' : 'Asignación activada');
      loadAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al cambiar estado');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id, techName, serviceName) => {
    if (!window.confirm(`¿Eliminar la asignación de "${techName}" al servicio "${serviceName}"?`)) return;
    try {
      await authAPI.delete(`/technicians/assignments/${id}`);
      setSuccess('Asignación eliminada correctamente');
      loadAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al eliminar asignación');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getServiceName = (id) => {
    const s = services.find((x) => x.id === id);
    return s ? s.name : `Servicio #${id}`;
  };

  const getServiceCategory = (id) => {
    const s = services.find((x) => x.id === id);
    return s ? s.category : '';
  };

  const getLevelBadge = (role) => {
    const level = getTechnicianLevel(role);
    const colors = {
      1: { bg: '#dbeafe', color: '#1e40af', text: 'N1 — Técnico Básico' },
      2: { bg: '#e0e7ff', color: '#3730a3', text: 'N2 — Técnico Profesional' },
      3: { bg: '#ddd6fe', color: '#5b21b6', text: 'N3 — DITIC' },
      4: { bg: '#fce7f3', color: '#9d174d', text: 'N4 — Proveedor Externo' },
    };
    return colors[level] || colors[1];
  };

  const getRoleColor = (role) => {
    const colors = {
      TecnicoN1: '#1565c0',
      TecnicoN2: '#0277bd',
      DITIC: '#00695c',
      Proveedor: '#4527a0',
    };
    return colors[role] || '#555';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'TecnicoN1': return <Shield size={12} style={{ marginRight: 4 }} />;
      case 'TecnicoN2': return <Shield size={12} style={{ marginRight: 4 }} />;
      case 'DITIC': return <Shield size={12} style={{ marginRight: 4 }} />;
      case 'Proveedor': return <Briefcase size={12} style={{ marginRight: 4 }} />;
      default: return <User size={12} style={{ marginRight: 4 }} />;
    }
  };

  // Agrupar asignaciones por técnico CON filtro de nivel
  const grouped = technicians
    .filter(t => {
      // Filtrar por nivel si está seleccionado
      if (filterLevel) {
        return getTechnicianLevel(t.role) === parseInt(filterLevel);
      }
      return true;
    })
    .map((t) => ({
      ...t,
      assignments: filteredAssignments.filter((a) => a.technicianId === t.id),
    }))
    .filter(t => t.assignments.length > 0 || !search);

  const clearFilters = () => {
    setSearch('');
    setFilterLevel('');
  };

  const hasFilters = search !== '' || filterLevel !== '';

  return (
    <Layout>
      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <UserCog size={28} style={{ marginRight: 12, color: '#4361ee', verticalAlign: 'middle' }} />
              Asignación de Servicios
            </h1>
            <p style={styles.subtitle}>
              Define qué servicios atiende cada técnico. El nivel de atención se asigna automáticamente según el rol.
            </p>
          </div>
          <button style={styles.actionBtn} onClick={openCreateModal}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Nueva Asignación
          </button>
        </div>

        {success && (
          <div style={styles.success}>
            <CheckCircle size={18} style={{ marginRight: 10 }} />
            {success}
          </div>
        )}
        {error && !showModal && (
          <div style={styles.error}>
            <AlertCircle size={18} style={{ marginRight: 10 }} />
            {error}
          </div>
        )}

        {/* Barra de filtros */}
        <div style={styles.filtersBar}>
          <div style={styles.searchWrapper}>
            <Search size={18} color="#9ca3af" style={styles.searchIcon} />
            <input
              style={styles.searchInput}
              placeholder="Buscar técnico o servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={styles.clearSearchBtn} onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={styles.filterWrapper}>
            <Shield size={14} color="#6b7280" style={styles.filterIcon} />
            <select style={styles.filterSelect} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">Todos los niveles</option>
              <option value="1">N1 - Técnico Básico</option>
              <option value="2">N2 - Técnico Profesional</option>
              <option value="3">N3 - DITIC</option>
              <option value="4">N4 - Proveedor Externo</option>
            </select>
          </div>

          {hasFilters && (
            <button style={styles.clearFiltersBtn} onClick={clearFilters}>
              <X size={14} style={{ marginRight: 4 }} />
              Limpiar filtros
            </button>
          )}

          <span style={styles.resultCount}>
            <UserCog size={12} style={{ marginRight: 4 }} />
            {grouped.length} técnicos con asignaciones
          </span>
        </div>

        {loading ? (
          <div style={styles.stateContainer}>
            <RefreshCw size={24} style={styles.spinner} />
            <p style={styles.stateText}>Cargando asignaciones...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div style={styles.stateContainer}>
            <p style={styles.stateText}>
              {hasFilters ? 'No hay técnicos que coincidan con los filtros.' : 'No hay técnicos registrados. Crea primero usuarios con rol técnico.'}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {grouped.map((t) => {
              const lvl = getLevelBadge(t.role);
              return (
                <div key={t.id} style={styles.techCard}>
                  <div style={styles.techHeader}>
                    <div>
                      <h3 style={styles.techName}>
                        <User size={14} style={{ marginRight: 6, color: '#4361ee' }} />
                        {t.fullName}
                      </h3>
                      <p style={styles.techEmail}>
                        <Mail size={11} style={{ marginRight: 4 }} />
                        {t.email}
                      </p>
                    </div>
                    <div style={styles.techBadges}>
                      <span
                        style={{
                          ...styles.roleBadge,
                          backgroundColor: getRoleColor(t.role),
                        }}
                      >
                        {getRoleIcon(t.role)}
                        {t.role}
                      </span>
                      <span
                        style={{
                          ...styles.levelBadge,
                          background: lvl.bg,
                          color: lvl.color,
                          marginTop: 6,
                        }}
                      >
                        {lvl.text}
                      </span>
                    </div>
                  </div>

                  <div style={styles.divider} />

                  <div style={styles.assignedSection}>
                    <div style={styles.assignedHeader}>
                      <Briefcase size={12} style={{ marginRight: 4 }} />
                      Servicios asignados ({t.assignments.length})
                    </div>

                    {t.assignments.length === 0 ? (
                      <p style={styles.noAssignments}>Sin asignaciones</p>
                    ) : (
                      <ul style={styles.assignedList}>
                        {t.assignments.map((a) => (
                          <li key={a.id} style={styles.assignedItem}>
                            <div style={styles.assignedInfo}>
                              <div style={styles.assignedService}>
                                <Tag size={12} style={{ marginRight: 6, color: '#6b7280' }} />
                                {getServiceName(a.serviceCatalogId)}
                                {!a.isActive && (
                                  <span style={styles.inactiveBadge}>Inactivo</span>
                                )}
                              </div>
                              <div style={styles.assignedMeta}>
                                {getServiceCategory(a.serviceCatalogId)}
                              </div>
                            </div>
                            <div style={styles.assignedActions}>
                              <button
                                style={styles.iconBtn}
                                onClick={() => handleToggleActive(a.id, a.isActive)}
                                title={a.isActive ? 'Desactivar' : 'Activar'}
                              >
                                {a.isActive ? (
                                  <PowerOff size={14} color="#dc2626" />
                                ) : (
                                  <Power size={14} color="#16a34a" />
                                )}
                              </button>
                              <button
                                style={styles.iconBtn}
                                onClick={() => handleDelete(a.id, t.fullName, getServiceName(a.serviceCatalogId))}
                                title="Eliminar"
                              >
                                <Trash2 size={14} color="#dc2626" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE CREAR ASIGNACIÓN */}
      {showModal && (
        <div style={modalStyles.overlay} onClick={closeModal}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <div style={modalStyles.headerIcon}>
                <Plus size={24} color="#fff" />
              </div>
              <div style={modalStyles.headerText}>
                <h2 style={modalStyles.title}>Nueva Asignación</h2>
                <p style={modalStyles.subtitle}>
                  Asigna un servicio a un técnico. El nivel de atención se deriva automáticamente del rol.
                </p>
              </div>
              <button style={modalStyles.closeBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={modalStyles.content}>
                {error && (
                  <div style={modalStyles.error}>
                    <AlertCircle size={16} style={{ marginRight: 8 }} />
                    {error}
                  </div>
                )}
                {success && (
                  <div style={modalStyles.success}>
                    <CheckCircle size={16} style={{ marginRight: 8 }} />
                    {success}
                  </div>
                )}

                <div style={modalStyles.formGrid}>
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <User size={14} style={{ marginRight: 6 }} />
                      Técnico *
                    </label>
                    <select
                      style={modalStyles.select}
                      value={form.technicianId}
                      onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
                      required
                    >
                      <option value="">-- Selecciona un técnico --</option>
                      {filteredTechnicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Briefcase size={14} style={{ marginRight: 6 }} />
                      Servicio *
                    </label>
                    <select
                      style={modalStyles.select}
                      value={form.serviceCatalogId}
                      onChange={(e) => setForm({ ...form, serviceCatalogId: e.target.value })}
                      required
                    >
                      <option value="">-- Selecciona un servicio --</option>
                      {services.map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.name} {sv.category ? `(${sv.category})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedTechnician && (
                  <div style={modalStyles.levelInfo}>
                    <div style={modalStyles.levelInfoLabel}>
                      <Shield size={12} style={{ marginRight: 4 }} />
                      Nivel de atención asignado automáticamente:
                    </div>
                    <div style={modalStyles.levelInfoBadge}>
                      <span
                        style={{
                          ...modalStyles.levelBadge,
                          background: getLevelBadge(selectedTechnician.role).bg,
                          color: getLevelBadge(selectedTechnician.role).color,
                        }}
                      >
                        {getLevelBadge(selectedTechnician.role).text}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={modalStyles.footer}>
                <button type="button" style={modalStyles.cancelBtn} onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" style={modalStyles.saveBtn} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                      Guardando...
                    </>
                  ) : (
                    'Crear Asignación'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    marginBottom: 24,
    gap: 16,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    maxWidth: 600,
    marginLeft: 40,
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 40,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    color: '#027a48',
    padding: '12px 16px',
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 13,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fef3f2',
    color: '#b42318',
    padding: '12px 16px',
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 13,
  },
  filtersBar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    padding: '16px 20px',
    borderRadius: 16,
    border: '1px solid #eaecf0',
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
    padding: '10px 16px 10px 38px',
    borderRadius: 12,
    border: '1px solid #e4e7eb',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s ease',
    '&:focus': {
      borderColor: '#4361ee',
      boxShadow: '0 0 0 3px rgba(67, 97, 238, 0.1)',
    }
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
    minWidth: 180,
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
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    transition: 'all 0.2s ease',
  },
  clearFiltersBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#374151',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
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
  stateContainer: {
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  stateText: { color: '#6b7280', fontSize: 14 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    gap: 20,
  },
  techCard: {
    background: '#fff',
    border: '1px solid #e4e7eb',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  techHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  techName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  techEmail: {
    fontSize: 11,
    color: '#8a9bb5',
    margin: '4px 0 0 0',
    display: 'flex',
    alignItems: 'center',
  },
  techBadges: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  roleBadge: {
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
  },
  levelBadge: {
    padding: '3px 10px',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    display: 'inline-block',
  },
  divider: { height: 1, background: '#f0f2f5', margin: '14px 0' },
  assignedSection: {},
  assignedHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: '#8a9bb5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
  },
  noAssignments: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    margin: 0,
    padding: '12px 0',
  },
  assignedList: { listStyle: 'none', padding: 0, margin: 0 },
  assignedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: '#f9fafb',
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  assignedInfo: { flex: 1, minWidth: 0 },
  assignedService: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  inactiveBadge: {
    background: '#fee2e2',
    color: '#991b1b',
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 8,
  },
  assignedMeta: { fontSize: 10, color: '#8a9bb5', marginTop: 2 },
  assignedActions: { display: 'flex', gap: 4 },
  iconBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
};

// Estilos del Modal
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 550,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'slideUp 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: 20,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s',
  },
  content: {
    padding: '24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  field: {
    marginBottom: 8,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  levelInfo: {
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  levelInfoLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    display: 'flex',
    alignItems: 'center',
  },
  levelInfoBadge: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  levelBadge: {
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    display: 'inline-block',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
  },
  success: {
    backgroundColor: '#ecfdf5',
    color: '#10b981',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '16px 24px',
    borderTop: '1px solid #eaecf0',
    backgroundColor: '#f9fafb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  saveBtn: {
    padding: '10px 24px',
    background: '#4361ee',
    border: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
};

// Agregar animaciones
const styleSheetModal = document.createElement("style");
styleSheetModal.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .modal-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
  .modal-cancel-btn:hover {
    background-color: #f3f4f6;
  }
  .modal-save-btn:hover {
    background-color: #1e3a5f;
  }
`;
document.head.appendChild(styleSheetModal);

export default TechnicianAssignments;