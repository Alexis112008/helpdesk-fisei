import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { authAPI, catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

/**
 * Pantalla de admin para gestionar asignaciones técnico → servicio.
 *
 * IMPORTANTE: el nivel de atención (N1/N2/N3/N4) NO se elige manualmente.
 * Se deriva del rol del técnico:
 *   TecnicoN1 → N1
 *   TecnicoN2 → N2
 *   DITIC     → N3
 *   Proveedor → N4
 * Esto garantiza el escalamiento progresivo de HU7 (sin saltos de nivel).
 */
function TechnicianAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    technicianId: '',
    serviceCatalogId: '',
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.technicianId || !form.serviceCatalogId) {
      setError('Debe seleccionar técnico y servicio');
      return;
    }

    try {
      await authAPI.post('/technicians/assignments', {
        technicianId: parseInt(form.technicianId),
        serviceCatalogId: parseInt(form.serviceCatalogId),
      });
      setSuccess('Asignación creada correctamente');
      setShowForm(false);
      setForm({ technicianId: '', serviceCatalogId: '' });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear asignación');
    }
  };

  const handleToggleActive = async (id, currentState) => {
    try {
      await authAPI.patch(`/technicians/assignments/${id}/active`, !currentState, {
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccess(currentState ? 'Asignación desactivada' : 'Asignación activada');
      loadAll();
    } catch {
      setError('Error al cambiar estado');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar definitivamente esta asignación?')) return;
    try {
      await authAPI.delete(`/technicians/assignments/${id}`);
      setSuccess('Asignación eliminada');
      loadAll();
    } catch {
      setError('Error al eliminar asignación');
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

  const getLevelBadge = (level) => {
    const colors = {
      1: { bg: '#dbeafe', color: '#1e40af', text: 'N1 — Básico' },
      2: { bg: '#e0e7ff', color: '#3730a3', text: 'N2 — Profesional' },
      3: { bg: '#ddd6fe', color: '#5b21b6', text: 'N3 — DITIC' },
      4: { bg: '#fce7f3', color: '#9d174d', text: 'N4 — Proveedor' },
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

  // Agrupar asignaciones por técnico para la tabla
  const grouped = technicians.map((t) => ({
    ...t,
    assignments: assignments.filter((a) => a.technicianId === t.id),
  }));

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Asignación de Servicios a Técnicos</h1>
            <p style={s.subtitle}>
              Define qué servicios atiende cada técnico. El nivel de atención se
              asigna automáticamente según el rol del técnico.
            </p>
          </div>
          <button
            style={s.actionBtn}
            onClick={() => {
              setShowForm(true);
              setError('');
              setSuccess('');
            }}
          >
            <Plus size={16} /> Nueva Asignación
          </button>
        </div>

        {success && <div style={s.success}>{success}</div>}
        {error && <div style={s.error}>{error}</div>}

        {showForm && (
          <div style={s.formCard}>
            <h4 style={s.formTitle}>Nueva Asignación</h4>
            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>Técnico</label>
                  <select
                    style={s.input}
                    value={form.technicianId}
                    onChange={(e) =>
                      setForm({ ...form, technicianId: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Selecciona un técnico --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Servicio</label>
                  <select
                    style={s.input}
                    value={form.serviceCatalogId}
                    onChange={(e) =>
                      setForm({ ...form, serviceCatalogId: e.target.value })
                    }
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

              {/* Nivel de atención: solo informativo, se deriva del rol */}
              {selectedTechnician && (
                <div style={s.levelInfo}>
                  <div style={s.levelInfoLabel}>
                    Nivel de atención asignado automáticamente:
                  </div>
                  <div style={s.levelInfoBadge}>
                    <span
                      style={{
                        ...s.levelBadge,
                        background: getLevelBadge(selectedTechnician.level).bg,
                        color: getLevelBadge(selectedTechnician.level).color,
                      }}
                    >
                      {getLevelBadge(selectedTechnician.level).text}
                    </span>
                    
                  </div>
                </div>
              )}

              <div style={s.formButtons}>
                <button type="submit" style={s.saveBtn}>
                  Crear Asignación
                </button>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>Cargando asignaciones...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>
              No hay técnicos registrados. Crea primero usuarios con rol técnico.
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {grouped.map((t) => {
              const lvl = getLevelBadge(t.level);
              return (
                <div key={t.id} style={s.techCard}>
                  <div style={s.techHeader}>
                    <div>
                      <h3 style={s.techName}>{t.fullName}</h3>
                      <p style={s.techEmail}>{t.email}</p>
                    </div>
                    <div style={s.techBadges}>
                      <span
                        style={{
                          ...s.roleBadge,
                          backgroundColor: getRoleColor(t.role),
                        }}
                      >
                        {t.role}
                      </span>
                      <span
                        style={{
                          ...s.levelBadge,
                          background: lvl.bg,
                          color: lvl.color,
                          marginTop: 4,
                        }}
                      >
                        {lvl.text}
                      </span>
                    </div>
                  </div>

                  <div style={s.divider} />

                  <div style={s.assignedSection}>
                    <div style={s.assignedHeader}>
                      Servicios asignados ({t.assignments.length})
                    </div>

                    {t.assignments.length === 0 ? (
                      <p style={s.noAssignments}>Sin asignaciones</p>
                    ) : (
                      <ul style={s.assignedList}>
                        {t.assignments.map((a) => (
                          <li key={a.id} style={s.assignedItem}>
                            <div style={s.assignedInfo}>
                              <div style={s.assignedService}>
                                {getServiceName(a.serviceCatalogId)}
                                {!a.isActive && (
                                  <span style={s.inactiveBadge}>Inactivo</span>
                                )}
                              </div>
                              <div style={s.assignedMeta}>
                                {getServiceCategory(a.serviceCatalogId)}
                              </div>
                            </div>
                            <div style={s.assignedActions}>
                              <button
                                style={s.iconBtn}
                                onClick={() =>
                                  handleToggleActive(a.id, a.isActive)
                                }
                                title={a.isActive ? 'Desactivar' : 'Activar'}
                              >
                                {a.isActive ? (
                                  <PowerOff size={14} color="#dc2626" />
                                ) : (
                                  <Power size={14} color="#16a34a" />
                                )}
                              </button>
                              <button
                                style={s.iconBtn}
                                onClick={() => handleDelete(a.id)}
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
    </Layout>
  );
}

const s = {
  content: { padding: 32, flex: 1 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', maxWidth: 600 },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  success: {
    backgroundColor: '#ecfdf3',
    color: '#027a48',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
  },
  error: {
    backgroundColor: '#fef3f2',
    color: '#b42318',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #eaecf0',
    padding: 32,
    marginBottom: 24,
  },
  formTitle: { fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 20 },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  field: { marginBottom: 20 },
  label: {
    display: 'block',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #d0d5dd',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#fff',
  },
  levelInfo: {
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  levelInfoLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelInfoBadge: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  levelInfoHelp: { fontSize: 12, color: '#6b7280' },
  formButtons: { display: 'flex', gap: 12, marginTop: 12 },
  saveBtn: {
    padding: '12px 24px',
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
  },
  cancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
  },
  stateContainer: { padding: '60px 20px', textAlign: 'center' },
  stateText: { color: '#6b7280', fontSize: 15 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: 18,
  },
  techCard: {
    background: '#fff',
    border: '1px solid #eaecf0',
    borderRadius: 14,
    padding: 20,
  },
  techHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  techName: { fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 },
  techEmail: { fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' },
  techBadges: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  roleBadge: {
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  levelBadge: {
    padding: '3px 10px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    display: 'inline-block',
  },
  divider: { height: 1, background: '#f3f4f6', margin: '14px 0' },
  assignedSection: {},
  assignedHeader: {
    fontSize: 12,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  noAssignments: {
    fontSize: 13,
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
    borderRadius: 8,
    marginBottom: 6,
    gap: 8,
  },
  assignedInfo: { flex: 1, minWidth: 0 },
  assignedService: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  inactiveBadge: {
    background: '#fee2e2',
    color: '#991b1b',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 8,
  },
  assignedMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  assignedActions: { display: 'flex', gap: 4 },
  iconBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    cursor: 'pointer',
  },
};

export default TechnicianAssignments;
