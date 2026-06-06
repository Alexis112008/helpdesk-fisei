import React, { useState, useEffect } from 'react';
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
  Layers
} from 'lucide-react';
import { catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function ServiceCatalogPage() {
  const [services, setServices] = useState([]);
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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

  const filteredServices = services.filter((sv) => {
    const matchSearch = search === '' ||
      sv.name.toLowerCase().includes(search.toLowerCase()) ||
      sv.category.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === '' || sv.attentionLevel === parseInt(filterLevel);
    const matchDamage = filterDamage === '' || sv.damageCatalogId === parseInt(filterDamage);
    return matchSearch && matchLevel && matchDamage;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editItem) {
        await catalogAPI.put(
          `/servicecatalog/${editItem.id}`,
          {
            ...form,
            attentionLevel: parseInt(form.attentionLevel),
            estimatedTimeHours: parseInt(form.estimatedTimeHours),
            damageCatalogId: parseInt(form.damageCatalogId),
          }
        );
        setSuccess('Servicio actualizado correctamente');
      } else {
        await catalogAPI.post(
          '/servicecatalog',
          {
            ...form,
            attentionLevel: parseInt(form.attentionLevel),
            estimatedTimeHours: parseInt(form.estimatedTimeHours),
            damageCatalogId: parseInt(form.damageCatalogId),
          }
        );
        setSuccess('Servicio creado correctamente');
      }

      setShowForm(false);
      setEditItem(null);
      setForm({
        name: '',
        description: '',
        category: '',
        attentionLevel: 1,
        estimatedTimeHours: 24,
        damageCatalogId: '',
      });
      loadServices();
    } catch {
      setError('Error al guardar el servicio');
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      attentionLevel: item.attentionLevel,
      estimatedTimeHours: item.estimatedTimeHours,
      damageCatalogId: item.damageCatalogId,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este servicio?')) return;
    try {
      await catalogAPI.delete(`/servicecatalog/${id}`);
      setSuccess('Servicio desactivado');
      loadServices();
    } catch {
      setError('Error al desactivar servicio');
    }
  };

  const getLevelName = (level) => {
    const names = {
      1: 'N1',
      2: 'N2',
      3: 'N3',
      4: 'N4',
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
    switch(level) {
      case 1: return <Shield size={12} style={{ marginRight: 4 }} />;
      case 2: return <Shield size={12} style={{ marginRight: 4 }} />;
      case 3: return <Shield size={12} style={{ marginRight: 4 }} />;
      case 4: return <Shield size={12} style={{ marginRight: 4 }} />;
      default: return <Shield size={12} style={{ marginRight: 4 }} />;
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterLevel('');
    setFilterDamage('');
  };

  const hasFilters = search !== '' || filterLevel !== '' || filterDamage !== '';

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>
              <Briefcase size={28} style={{ marginRight: 12, color: '#4361ee', verticalAlign: 'middle' }} />
              Catálogo de Servicios
            </h1>
            <p style={s.subtitle}>Administra servicios y categorías tecnológicas</p>
          </div>
          <button style={s.actionBtn} onClick={() => {
            setShowForm(true);
            setEditItem(null);
            setForm({
              name: '',
              description: '',
              category: '',
              attentionLevel: 1,
              estimatedTimeHours: 24,
              damageCatalogId: '',
            });
          }}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Nuevo Servicio
          </button>
        </div>

        {success && (
          <div style={s.success}>
            <CheckCircle size={18} style={{ marginRight: 10 }} />
            {success}
          </div>
        )}
        {error && (
          <div style={s.error}>
            <AlertCircle size={18} style={{ marginRight: 10 }} />
            {error}
          </div>
        )}

        {showForm && (
          <div style={s.formCard}>
            <h4 style={s.formTitle}>
              {editItem ? (
                <>
                  <Pencil size={20} style={{ marginRight: 8 }} />
                  Editar Servicio
                </>
              ) : (
                <>
                  <Plus size={20} style={{ marginRight: 8 }} />
                  Nuevo Servicio
                </>
              )}
            </h4>
            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>
                    <Package size={14} style={{ marginRight: 4 }} />
                    Nombre *
                  </label>
                  <input
                    style={s.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nombre del servicio"
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    <Layers size={14} style={{ marginRight: 4 }} />
                    Categoría *
                  </label>
                  <input
                    style={s.input}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Hardware, Software, Redes..."
                    required
                  />
                </div>

                <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                  <label style={s.label}>
                    <FileText size={14} style={{ marginRight: 4 }} />
                    Descripción
                  </label>
                  <input
                    style={s.input}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descripción del servicio"
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    <Shield size={14} style={{ marginRight: 4 }} />
                    Nivel de atención *
                  </label>
                  <select
                    style={s.input}
                    value={form.attentionLevel}
                    onChange={(e) => setForm({ ...form, attentionLevel: e.target.value })}
                  >
                    <option value={1}>N1 — Técnico Básico</option>
                    <option value={2}>N2 — Técnico Profesional</option>
                    <option value={3}>N3 — DITIC</option>
                    <option value={4}>N4 — Proveedor Externo</option>
                  </select>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    <Clock size={14} style={{ marginRight: 4 }} />
                    Tiempo estimado (horas) *
                  </label>
                  <input
                    style={s.input}
                    type="number"
                    min={1}
                    max={720}
                    value={form.estimatedTimeHours}
                    onChange={(e) => setForm({ ...form, estimatedTimeHours: e.target.value })}
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    <Wrench size={14} style={{ marginRight: 4 }} />
                    Categoría de daño *
                  </label>
                  <select
                    style={s.input}
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

              <div style={s.formButtons}>
                <button type="submit" style={s.saveBtn}>
                  <Save size={14} style={{ marginRight: 6 }} />
                  {editItem ? 'Guardar Cambios' : 'Crear Servicio'}
                </button>
                <button type="button" style={s.cancelBtn} onClick={() => {
                  setShowForm(false);
                  setEditItem(null);
                }}>
                  <X size={14} style={{ marginRight: 6 }} />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barra de filtros */}
        <div style={s.filtersBar}>
          <div style={s.searchWrapper}>
            <Search size={18} color="#9ca3af" style={s.searchIcon} />
            <input
              style={s.searchInput}
              placeholder="Buscar servicio por nombre o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={s.clearSearchBtn} onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={s.filterWrapper}>
            <Shield size={14} color="#6b7280" style={s.filterIcon} />
            <select style={s.filterSelect} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">Todos los niveles</option>
              <option value="1">N1</option>
              <option value="2">N2</option>
              <option value="3">N3</option>
              <option value="4">N4</option>
            </select>
          </div>

          <div style={s.filterWrapper}>
            <Wrench size={14} color="#6b7280" style={s.filterIcon} />
            <select style={s.filterSelect} value={filterDamage} onChange={(e) => setFilterDamage(e.target.value)}>
              <option value="">Todos los tipos de daño</option>
              {damages.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button style={s.clearFiltersBtn} onClick={clearFilters}>
              <X size={14} style={{ marginRight: 4 }} />
              Limpiar filtros
            </button>
          )}

          <span style={s.resultCount}>
            <Briefcase size={12} style={{ marginRight: 4 }} />
            {filteredServices.length} de {services.length} servicios
          </span>
        </div>

        {loading ? (
          <div style={s.stateContainer}>
            <RefreshCw size={24} style={s.spinner} />
            <p style={s.stateText}>Cargando servicios...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>
              {hasFilters ? 'No hay servicios que coincidan con los filtros.' : 'No hay servicios registrados.'}
            </p>
          </div>
        ) : (
          <div style={s.tableCard}>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>
                      <Package size={12} style={{ marginRight: 4 }} />
                      Servicio
                    </th>
                    <th style={s.th}>
                      <Layers size={12} style={{ marginRight: 4 }} />
                      Categoría
                    </th>
                    <th style={s.th}>
                      <FileText size={12} style={{ marginRight: 4 }} />
                      Descripción
                    </th>
                    <th style={s.th}>
                      <Shield size={12} style={{ marginRight: 4 }} />
                      Nivel
                    </th>
                    <th style={s.th}>
                      <Clock size={12} style={{ marginRight: 4 }} />
                      Tiempo Est.
                    </th>
                    <th style={s.th}>
                      <Wrench size={12} style={{ marginRight: 4 }} />
                      Tipo de Daño
                    </th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((sItem) => (
                    <tr key={sItem.id} style={s.tr}>
                      <td style={s.td}>
                        <strong>{sItem.name}</strong>
                      </td>
                      <td style={s.td}>{sItem.category}</td>
                      <td style={s.td}>{sItem.description || '—'}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: getLevelColor(sItem.attentionLevel) }}>
                          {getLevelIcon(sItem.attentionLevel)}
                          {getLevelName(sItem.attentionLevel)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.timeBadge}>
                          <Clock size={12} style={{ marginRight: 4 }} />
                          {sItem.estimatedTimeHours}h
                        </span>
                      </td>
                      <td style={s.td}>{sItem.damageName}</td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          <button onClick={() => handleEdit(sItem)} style={s.iconBtn} title="Editar">
                            <Pencil size={15} color="#4361ee" />
                          </button>
                          <button onClick={() => handleDelete(sItem.id)} style={s.iconBtn} title="Desactivar">
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
    </Layout>
  );
}

const s = {
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
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #eaecf0',
    padding: 32,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
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
    transition: 'border-color 0.2s ease',
  },
  formButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 12,
  },
  saveBtn: {
    padding: '12px 24px',
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
  },
  cancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
  },
  filtersBar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
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
    padding: '10px 32px 10px 38px',
    borderRadius: 10,
    border: '1px solid #d0d5dd',
    fontSize: 14,
    outline: 'none',
    backgroundColor: '#fff',
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
    minWidth: 160,
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
  },
  clearFiltersBtn: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    color: '#374151',
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
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

// Añadir animación para el spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default ServiceCatalogPage;