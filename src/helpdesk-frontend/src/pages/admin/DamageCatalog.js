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
  const [search, setSearch] = useState(''); // ← NUEVO: estado para búsqueda

  const [form, setForm] = useState({
    name: '',
    description: '',
    code: '',  // ← CAMBIADO: attentionLevel: 1 por code: ''
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

  // ← NUEVO: filtrado de categorías por búsqueda
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
          code: form.code,      // ← NUEVO: solo estos campos
          name: form.name,
          description: form.description,
        });

        setSuccess('Categoría actualizada correctamente');
      } else {
        await catalogAPI.post('/damagecatalog', {
          code: form.code,      // ← NUEVO: solo estos campos
          name: form.name,
          description: form.description,
        });

        setSuccess('Categoría creada correctamente');
      }

      setShowForm(false);
      setEditItem(null);

      setForm({
        name: '',
        description: '',
        code: '',  // ← CAMBIADO
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
      code: item.code,  // ← CAMBIADO: attentionLevel por code
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
                code: '',  // ← CAMBIADO
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

                {/* ← CAMBIADO: campo Código reemplaza a Nivel de atención */}
                <div style={styles.field}>
                  <label style={styles.label}>
                    Código *
                  </label>

                  <input
                    style={styles.input}
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ej: HW, SW, RED, CUEN"
                    maxLength={10}
                    required
                  />
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

        {/* ← NUEVO: Barra de búsqueda */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            style={{ ...styles.input, maxWidth: 300 }}
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>
            {filteredDamages.length} de {damages.length} categorías
          </span>
        </div>

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

                    {/* ← CAMBIADO: "Código" reemplaza a "Nivel" */}
                    <th style={styles.th}>Código</th>

                    <th style={styles.th}>
                      Acciones
                    </th>
                   </tr>
                </thead>

                <tbody>
                  {/* ← CAMBIADO: damages.map por filteredDamages.map */}
                  {filteredDamages.map((d) => (
                    <tr key={d.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{d.name}</strong>
                      </td>

                      <td style={styles.td}>
                        {d.description}
                      </td>

                      {/* ← CAMBIADO: muestra código en lugar del nivel */}
                      <td style={styles.td}>
                        <strong>{d.code}</strong>
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