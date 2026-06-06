import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function DamageCatalogPage() {
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

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

  const filteredDamages = damages.filter((d) =>
    search === '' ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      setShowForm(false);
      setEditItem(null);
      setForm({ name: '', description: '', code: '' });
      loadDamages();
    } catch {
      setError('Error al guardar la categoría');
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description,
      code: item.code,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar esta categoría?')) return;
    try {
      await catalogAPI.delete(`/damagecatalog/${id}`);
      setSuccess('Categoría desactivada');
      loadDamages();
    } catch {
      setError('Error al desactivar');
    }
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
          <button style={styles.newButton} onClick={() => {
            setShowForm(true);
            setEditItem(null);
            setForm({ name: '', description: '', code: '' });
          }}>
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
        {error && (
          <div style={styles.error}>
            <AlertCircle size={18} style={{ marginRight: 10 }} />
            {error}
          </div>
        )}

        {showForm && (
          <div style={styles.formCard}>
            <h4 style={styles.formTitle}>
              {editItem ? (
                <>
                  <Edit size={20} style={{ marginRight: 8 }} />
                  Editar Categoría
                </>
              ) : (
                <>
                  <Plus size={20} style={{ marginRight: 8 }} />
                  Nueva Categoría
                </>
              )}
            </h4>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    <Package size={14} style={{ marginRight: 4 }} />
                    Nombre *
                  </label>
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Hardware, Software, Redes"
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    <Hash size={14} style={{ marginRight: 4 }} />
                    Código *
                  </label>
                  <input
                    style={styles.input}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="Ej: HW, SW, RED, CUEN"
                    maxLength={10}
                    required
                  />
                </div>

                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>
                    <FileText size={14} style={{ marginRight: 4 }} />
                    Descripción
                  </label>
                  <input
                    style={styles.input}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descripción de la categoría"
                  />
                </div>
              </div>

              <div style={styles.formButtons}>
                <button type="submit" style={styles.saveBtn}>
                  <Save size={14} style={{ marginRight: 6 }} />
                  {editItem ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
                <button type="button" style={styles.cancelBtn} onClick={() => {
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

        {/* Barra de búsqueda */}
        <div style={styles.searchBar}>
          <div style={styles.searchWrapper}>
            <Search size={18} color="#9ca3af" style={styles.searchIcon} />
            <input
              style={styles.searchInput}
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={styles.clearSearchBtn} onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
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
              {search ? 'No hay categorías que coincidan con la búsqueda.' : 'No hay categorías registradas.'}
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
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDamages.map((d) => (
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
                        <button onClick={() => handleEdit(d)} style={styles.editBtn} title="Editar">
                          <Edit size={14} style={{ marginRight: 4 }} />
                          Editar
                        </button>
                        <button onClick={() => handleDelete(d.id)} style={styles.deleteBtn} title="Desactivar">
                          <Trash2 size={14} style={{ marginRight: 4 }} />
                          Desactivar
                        </button>
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
  searchBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 260px',
    maxWidth: 400,
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
  resultCount: {
    fontSize: 13,
    color: '#6b7280',
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

// Añadir animación para el spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default DamageCatalogPage;