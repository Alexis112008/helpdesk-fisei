import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  UserCheck,
  UserX
} from 'lucide-react';
import { catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function DamageCatalogPage() {
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCode, setFilterCode] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    code: '',
  });

  useEffect(() => {
    loadDamages();
  }, []);

  const loadDamages = () => {
    setLoading(true);
    catalogAPI
      .get('/damagecatalog')
      .then((res) => setDamages(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  // Filtrado de daños
  const filteredDamages = useMemo(() => {
    return damages.filter((d) => {
      const matchSearch =
        search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === '' ||
        (filterStatus === 'activo' && d.isActive) ||
        (filterStatus === 'inactivo' && !d.isActive);
      const matchCode =
        filterCode === '' ||
        d.code?.toLowerCase().includes(filterCode.toLowerCase());
      return matchSearch && matchStatus && matchCode;
    });
  }, [damages, search, filterStatus, filterCode]);

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterCode('');
  };

  const hasFilters = search !== '' || filterStatus !== '' || filterCode !== '';

  const openCreateModal = () => {
    setEditItem(null);
    setForm({ name: '', description: '', code: '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      code: item.code || '',
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
        await catalogAPI.put(`/damagecatalog/${editItem.id}`, {
          code: form.code,
          name: form.name,
          description: form.description,
        });
        setSuccess('Categoría actualizada correctamente');
      } else {
        await catalogAPI.post('/damagecatalog', {
          code: form.code,
          name: form.name,
          description: form.description,
        });
        setSuccess('Categoría creada correctamente');
      }

      setTimeout(() => {
        closeModal();
        loadDamages();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la categoría');
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar permanentemente la categoría "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await catalogAPI.delete(`/damagecatalog/${id}`);
      setSuccess('Categoría eliminada correctamente');
      loadDamages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la categoría');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return {
        bg: '#ecfdf5',
        color: '#10b981',
        icon: <CheckCircle size={12} style={{ marginRight: 4 }} />,
        text: 'Activo'
      };
    }
    return {
      bg: '#fef2f2',
      color: '#dc2626',
      icon: <UserX size={12} style={{ marginRight: 4 }} />,
      text: 'Inactivo'
    };
  };

  return (
    <Layout>
      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <Package size={28} style={{ marginRight: 12, color: '#4361ee', verticalAlign: 'middle' }} />
              Catálogo de Daños
            </h1>
            <p style={styles.subtitle}>Categorías de incidencias y averías</p>
          </div>
          <button style={styles.newButton} onClick={openCreateModal}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Nueva Categoría
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
              placeholder="Buscar por nombre..."
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
            <Filter size={14} color="#6b7280" style={styles.filterIcon} />
            <select
              style={styles.filterSelect}
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
            >
              <option value="">Todos los códigos</option>
              {[...new Set(damages.map(d => d.code))].map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterWrapper}>
            <UserCheck size={14} color="#6b7280" style={styles.filterIcon} />
            <select
              style={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          {hasFilters && (
            <button style={styles.clearBtn} onClick={clearFilters}>
              <X size={13} style={{ marginRight: 4 }} />
              Limpiar
            </button>
          )}

          <span style={styles.resultCount}>
            <Package size={12} style={{ marginRight: 4 }} />
            {filteredDamages.length} de {damages.length} categorías
          </span>
        </div>

        {loading ? (
          <div style={styles.stateContainer}>
            <RefreshCw size={24} style={styles.spinner} />
            <p style={styles.stateText}>Cargando categorías...</p>
          </div>
        ) : filteredDamages.length === 0 ? (
          <div style={styles.stateContainer}>
            <p style={styles.stateText}>
              {hasFilters ? 'No hay categorías que coincidan con los filtros.' : 'No hay categorías registradas.'}
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
                      Categoría
                    </th>
                    <th style={styles.th}>
                      <FileText size={12} style={{ marginRight: 4 }} />
                      Descripción
                    </th>
                    <th style={styles.th}>
                      <Hash size={12} style={{ marginRight: 4 }} />
                      Código
                    </th>
                    <th style={styles.th}>
                      <UserCheck size={12} style={{ marginRight: 4 }} />
                      Estado
                    </th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDamages.map((d) => {
                    const status = getStatusBadge(d.isActive);
                    return (
                      <tr key={d.id} style={styles.tr}>
                        <td style={styles.td}>
                          <strong>{d.name}</strong>
                        </td>
                        <td style={styles.td}>
                          {d.description || '—'}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.codeBadge}>{d.code}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, backgroundColor: status.bg, color: status.color }}>
                            {status.icon}
                            {status.text}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => openEditModal(d)} style={styles.editBtn} title="Editar">
                            <Edit size={14} style={{ marginRight: 4 }} />
                            Editar
                          </button>
                          <button onClick={() => handleDelete(d.id, d.name)} style={styles.deleteBtn} title="Eliminar">
                            <Trash2 size={14} style={{ marginRight: 4 }} />
                            Eliminar
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
      </main>

      {/* MODAL DE CREAR/EDITAR CATEGORÍA */}
      {showModal && (
        <div style={modalStyles.overlay} onClick={closeModal}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <div style={modalStyles.headerIcon}>
                {editItem ? <Edit size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
              </div>
              <div style={modalStyles.headerText}>
                <h2 style={modalStyles.title}>
                  {editItem ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <p style={modalStyles.subtitle}>
                  {editItem ? 'Modifica los datos de la categoría' : 'Completa los datos para crear una nueva categoría'}
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
                      placeholder="Ej: Hardware, Software, Redes"
                      required
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Hash size={14} style={{ marginRight: 6 }} />
                      Código *
                    </label>
                    <input
                      style={modalStyles.input}
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="Ej: HW, SW, RED"
                      maxLength={10}
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
                      placeholder="Descripción de la categoría"
                      rows={3}
                    />
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
                    editItem ? 'Guardar Cambios' : 'Crear Categoría'
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
  newButton: {
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '12px 18px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
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
    flex: '1 1 220px',
    minWidth: 180,
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
    minWidth: 140,
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
    padding: '10px 14px 10px 36px',
    borderRadius: 10,
    border: '1px solid #d0d5dd',
    fontSize: 14,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    transition: 'all 0.2s ease',
  },
  clearBtn: {
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
  codeBadge: {
    backgroundColor: '#eef2ff',
    color: '#4361ee',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  },
  editBtn: {
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    marginRight: 8,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
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

export default DamageCatalogPage;