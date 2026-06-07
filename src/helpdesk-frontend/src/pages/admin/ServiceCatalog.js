import React, { useState, useEffect, useMemo } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  Save,
  Package,
  Briefcase,
  FileText,
  Clock,
  Shield,
  Wrench,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  UserCheck,
  UserX
} from 'lucide-react';
import { catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function ServiceCatalogPage() {
  const [services, setServices] = useState([]);
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDamage, setFilterDamage] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    attentionLevel: 1,
    estimatedTimeHours: 24,
    damageCatalogId: '',
  });

  useEffect(() => {
    loadServices();
    loadDamages();
  }, []);

  const loadServices = () => {
    setLoading(true);
    catalogAPI
      .get('/servicecatalog')
      .then((res) => setServices(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadDamages = () => {
    catalogAPI
      .get('/damagecatalog')
      .then((res) => setDamages(res.data));
  };

  // Filtrado de servicios
  const filteredServices = useMemo(() => {
    return services.filter((sv) => {
      const matchSearch = search === '' ||
        sv.name.toLowerCase().includes(search.toLowerCase()) ||
        sv.category.toLowerCase().includes(search.toLowerCase());
      const matchLevel = filterLevel === '' || sv.attentionLevel === parseInt(filterLevel);
      const matchDamage = filterDamage === '' || sv.damageCatalogId === parseInt(filterDamage);
      return matchSearch && matchLevel && matchDamage;
    });
  }, [services, search, filterLevel, filterDamage]);

  const clearFilters = () => {
    setSearch('');
    setFilterLevel('');
    setFilterDamage('');
  };

  const hasFilters = search !== '' || filterLevel !== '' || filterDamage !== '';

  const openCreateModal = () => {
    setEditItem(null);
    setForm({
      name: '',
      description: '',
      category: '',
      attentionLevel: 1,
      estimatedTimeHours: 24,
      damageCatalogId: '',
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      attentionLevel: item.attentionLevel,
      estimatedTimeHours: item.estimatedTimeHours,
      damageCatalogId: item.damageCatalogId,
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editItem) {
        await catalogAPI.put(`/servicecatalog/${editItem.id}`, {
          name: form.name,
          description: form.description,
          category: form.category,
          attentionLevel: parseInt(form.attentionLevel),
          estimatedTimeHours: parseInt(form.estimatedTimeHours),
          damageCatalogId: parseInt(form.damageCatalogId),
        });
        setSuccess('Servicio actualizado correctamente');
      } else {
        await catalogAPI.post('/servicecatalog', {
          name: form.name,
          description: form.description,
          category: form.category,
          attentionLevel: parseInt(form.attentionLevel),
          estimatedTimeHours: parseInt(form.estimatedTimeHours),
          damageCatalogId: parseInt(form.damageCatalogId),
        });
        setSuccess('Servicio creado correctamente');
      }

      setTimeout(() => {
        closeModal();
        loadServices();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el servicio');
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar permanentemente el servicio "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await catalogAPI.delete(`/servicecatalog/${id}`);
      setSuccess('Servicio eliminado correctamente');
      loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el servicio');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getLevelName = (level) => {
    const names = {
      1: 'N1 - Técnico Básico',
      2: 'N2 - Técnico Profesional',
      3: 'N3 - DITIC',
      4: 'N4 - Proveedor Externo',
    };
    return names[level] || 'N1';
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#1565c0',
      2: '#00695c',
      3: '#6a1b9a',
      4: '#c62828',
    };
    return colors[level] || '#1565c0';
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 1: return <Shield size={12} style={{ marginRight: 4 }} />;
      case 2: return <Shield size={12} style={{ marginRight: 4 }} />;
      case 3: return <Shield size={12} style={{ marginRight: 4 }} />;
      case 4: return <Shield size={12} style={{ marginRight: 4 }} />;
      default: return <Shield size={12} style={{ marginRight: 4 }} />;
    }
  };

  return (
    <Layout>
      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <Briefcase size={28} style={{ marginRight: 12, color: '#4361ee', verticalAlign: 'middle' }} />
              Catálogo de Servicios
            </h1>
            <p style={styles.subtitle}>Administra servicios y categorías tecnológicas</p>
          </div>
          <button style={styles.actionBtn} onClick={openCreateModal}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Nuevo Servicio
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
              placeholder="Buscar servicio por nombre o categoría..."
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

          <div style={styles.filterWrapper}>
            <Wrench size={14} color="#6b7280" style={styles.filterIcon} />
            <select style={styles.filterSelect} value={filterDamage} onChange={(e) => setFilterDamage(e.target.value)}>
              <option value="">Todos los tipos de daño</option>
              {damages.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button style={styles.clearFiltersBtn} onClick={clearFilters}>
              <X size={14} style={{ marginRight: 4 }} />
              Limpiar filtros
            </button>
          )}

          <span style={styles.resultCount}>
            <Briefcase size={12} style={{ marginRight: 4 }} />
            {filteredServices.length} de {services.length} servicios
          </span>
        </div>

        {loading ? (
          <div style={styles.stateContainer}>
            <RefreshCw size={24} style={styles.spinner} />
            <p style={styles.stateText}>Cargando servicios...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div style={styles.stateContainer}>
            <p style={styles.stateText}>
              {hasFilters ? 'No hay servicios que coincidan con los filtros.' : 'No hay servicios registrados.'}
            </p>
          </div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>
                      <Package size={12} style={{ marginRight: 4 }} />
                      Servicio
                    </th>
                    <th style={styles.th}>
                      <Layers size={12} style={{ marginRight: 4 }} />
                      Categoría
                    </th>
                    <th style={styles.th}>
                      <FileText size={12} style={{ marginRight: 4 }} />
                      Descripción
                    </th>
                    <th style={styles.th}>
                      <Shield size={12} style={{ marginRight: 4 }} />
                      Nivel
                    </th>
                    <th style={styles.th}>
                      <Clock size={12} style={{ marginRight: 4 }} />
                      Tiempo Est.
                    </th>
                    <th style={styles.th}>
                      <Wrench size={12} style={{ marginRight: 4 }} />
                      Tipo de Daño
                    </th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((sItem) => (
                    <tr key={sItem.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{sItem.name}</strong>
                      </td>
                      <td style={styles.td}>{sItem.category}</td>
                      <td style={styles.td}>{sItem.description || '—'}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: getLevelColor(sItem.attentionLevel) }}>
                          {getLevelIcon(sItem.attentionLevel)}
                          {getLevelName(sItem.attentionLevel)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.timeBadge}>
                          <Clock size={12} style={{ marginRight: 4 }} />
                          {sItem.estimatedTimeHours}h
                        </span>
                      </td>
                      <td style={styles.td}>{sItem.damageName}</td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button onClick={() => openEditModal(sItem)} style={styles.iconBtn} title="Editar">
                            <Pencil size={15} color="#4361ee" />
                          </button>
                          <button onClick={() => handleDelete(sItem.id, sItem.name)} style={styles.iconBtn} title="Eliminar">
                            <Trash2 size={15} color="#dc2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE CREAR/EDITAR SERVICIO */}
      {showModal && (
        <div style={modalStyles.overlay} onClick={closeModal}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <div style={modalStyles.headerIcon}>
                {editItem ? <Pencil size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
              </div>
              <div style={modalStyles.headerText}>
                <h2 style={modalStyles.title}>
                  {editItem ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
                <p style={modalStyles.subtitle}>
                  {editItem ? 'Modifica los datos del servicio' : 'Completa los datos para crear un nuevo servicio'}
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
                      <Package size={14} style={{ marginRight: 6 }} />
                      Nombre *
                    </label>
                    <input
                      style={modalStyles.input}
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nombre del servicio"
                      required
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Layers size={14} style={{ marginRight: 6 }} />
                      Categoría *
                    </label>
                    <input
                      style={modalStyles.input}
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Hardware, Software, Redes..."
                      required
                    />
                  </div>

                  <div style={{ ...modalStyles.field, gridColumn: '1 / -1' }}>
                    <label style={modalStyles.label}>
                      <FileText size={14} style={{ marginRight: 6 }} />
                      Descripción
                    </label>
                    <textarea
                      style={modalStyles.textarea}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Descripción del servicio"
                      rows={3}
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Shield size={14} style={{ marginRight: 6 }} />
                      Nivel de atención *
                    </label>
                    <select
                      style={modalStyles.select}
                      value={form.attentionLevel}
                      onChange={(e) => setForm({ ...form, attentionLevel: e.target.value })}
                    >
                      <option value={1}>N1 — Técnico Básico</option>
                      <option value={2}>N2 — Técnico Profesional</option>
                      <option value={3}>N3 — DITIC</option>
                      <option value={4}>N4 — Proveedor Externo</option>
                    </select>
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Clock size={14} style={{ marginRight: 6 }} />
                      Tiempo estimado (horas) *
                    </label>
                    <input
                      style={modalStyles.input}
                      type="number"
                      min={1}
                      max={720}
                      value={form.estimatedTimeHours}
                      onChange={(e) => setForm({ ...form, estimatedTimeHours: e.target.value })}
                      required
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Wrench size={14} style={{ marginRight: 6 }} />
                      Categoría de daño *
                    </label>
                    <select
                      style={modalStyles.select}
                      value={form.damageCatalogId}
                      onChange={(e) => setForm({ ...form, damageCatalogId: e.target.value })}
                      required
                    >
                      <option value="">-- Selecciona --</option>
                      {damages.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
                    editItem ? 'Guardar Cambios' : 'Crear Servicio'
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
    padding: '32px',
    flex: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
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
    transition: 'background-color 0.2s ease',
  },
  success: {
    backgroundColor: '#ecfdf3',
    color: '#027a48',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
  },
  error: {
    backgroundColor: '#fef3f2',
    color: '#b42318',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
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
  tableCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #eaecf0',
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thead: {
    backgroundColor: '#f9fafb',
  },
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
  tr: {
    borderBottom: '1px solid #f1f3f5',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '18px 20px',
    fontSize: 14,
    color: '#344054',
  },
  badge: {
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
  },
  timeBadge: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
  },
  actions: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  iconBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  stateContainer: {
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    color: '#6b7280',
    fontSize: 15,
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
    maxWidth: 650,
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
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
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

export default ServiceCatalogPage;