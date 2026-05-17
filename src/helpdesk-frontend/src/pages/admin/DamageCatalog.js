import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../../services/api';

import Layout from '../../components/Layout';

function DamageCatalogPage() {
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    attentionLevel: 1,
  });

  useEffect(() => {
    loadDamages();
  }, []);

  const loadDamages = () => {
    catalogAPI
      .get('/damagecatalog')
      .then((res) => setDamages(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    try {
      if (editItem) {
        await catalogAPI.put(`/damagecatalog/${editItem.id}`, {
          ...form,
          attentionLevel: parseInt(form.attentionLevel),
        });

        setSuccess('Categoría actualizada correctamente');
      } else {
        await catalogAPI.post('/damagecatalog', {
          ...form,
          attentionLevel: parseInt(form.attentionLevel),
        });

        setSuccess('Categoría creada correctamente');
      }

      setShowForm(false);
      setEditItem(null);

      setForm({
        name: '',
        description: '',
        attentionLevel: 1,
      });

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
      attentionLevel: item.attentionLevel,
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

  const getLevelName = (level) => {
    const names = {
      1: 'N1 - Técnico Básico',
      2: 'N2 - Técnico Profesional',
      3: 'N3 - DITIC',
      4: 'N4 - Proveedor',
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

  return (
    <Layout>
      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Catálogo de Daños
            </h1>

            <p style={styles.subtitle}>
              Categorías de incidencias y averías
            </p>
          </div>

          <button
            style={styles.newButton}
            onClick={() => {
              setShowForm(true);
              setEditItem(null);

              setForm({
                name: '',
                description: '',
                attentionLevel: 1,
              });
            }}
          >
            + Nueva Categoría
          </button>
        </div>

        {success && (
          <div style={styles.success}>{success}</div>
        )}

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {showForm && (
          <div style={styles.formCard}>
            <h4 style={styles.formTitle}>
              {editItem
                ? 'Editar Categoría'
                : 'Nueva Categoría'}
            </h4>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Nombre
                  </label>

                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="Ej: Hardware, Software, Redes"
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Nivel de atención
                  </label>

                  <select
                    style={styles.input}
                    value={form.attentionLevel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attentionLevel: e.target.value,
                      })
                    }
                  >
                    <option value={1}>
                      N1 — Técnico Básico
                    </option>

                    <option value={2}>
                      N2 — Técnico Profesional
                    </option>

                    <option value={3}>
                      N3 — DITIC
                    </option>

                    <option value={4}>
                      N4 — Proveedor Externo
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    ...styles.field,
                    gridColumn: '1 / -1',
                  }}
                >
                  <label style={styles.label}>
                    Descripción
                  </label>

                  <input
                    style={styles.input}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    placeholder="Descripción de la categoría"
                  />
                </div>
              </div>

              <div style={styles.formButtons}>
                <button
                  type="submit"
                  style={styles.saveBtn}
                >
                  {editItem
                    ? 'Guardar Cambios'
                    : 'Crear Categoría'}
                </button>

                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => {
                    setShowForm(false);
                    setEditItem(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={styles.stateContainer}>
            <p style={styles.stateText}>
              Cargando categorías...
            </p>
          </div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>
                      Categoría
                    </th>

                    <th style={styles.th}>
                      Descripción
                    </th>

                    <th style={styles.th}>Nivel</th>

                    <th style={styles.th}>
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {damages.map((d) => (
                    <tr key={d.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{d.name}</strong>
                      </td>

                      <td style={styles.td}>
                        {d.description}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              getLevelColor(
                                d.attentionLevel
                              ),
                          }}
                        >
                          {getLevelName(
                            d.attentionLevel
                          )}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <button
                          onClick={() =>
                            handleEdit(d)
                          }
                          style={styles.editBtn}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(d.id)
                          }
                          style={styles.deleteBtn}
                        >
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
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
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

  formTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 24,
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
    fontSize: 13,
    fontWeight: 700,
    color: '#667085',
    borderBottom: '1px solid #eaecf0',
  },

  tr: {
    borderBottom: '1px solid #f1f3f5',
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
    display: 'inline-block',
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
  },

  deleteBtn: {
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
  },

  stateContainer: {
    padding: '60px 20px',
    textAlign: 'center',
  },

  stateText: {
    color: '#6b7280',
    fontSize: 15,
  },
};

export default DamageCatalogPage;