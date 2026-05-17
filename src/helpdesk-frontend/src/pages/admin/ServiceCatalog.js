import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';

import { catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function ServiceCatalogPage() {
  const [services, setServices] = useState([]);
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editItem, setEditItem] =
    useState(null);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    attentionLevel: 1,
    damageCatalogId: '',
  });

  useEffect(() => {
    loadServices();
    loadDamages();
  }, []);

  const loadServices = () => {
    catalogAPI
      .get('/servicecatalog')
      .then((res) =>
        setServices(res.data)
      )
      .catch((err) =>
        console.error(err)
      )
      .finally(() =>
        setLoading(false)
      );
  };

  const loadDamages = () => {
    catalogAPI
      .get('/damagecatalog')
      .then((res) =>
        setDamages(res.data)
      );
  };

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
            attentionLevel: parseInt(
              form.attentionLevel
            ),
            damageCatalogId: parseInt(
              form.damageCatalogId
            ),
          }
        );

        setSuccess(
          'Servicio actualizado correctamente'
        );
      } else {
        await catalogAPI.post(
          '/servicecatalog',
          {
            ...form,
            attentionLevel: parseInt(
              form.attentionLevel
            ),
            damageCatalogId: parseInt(
              form.damageCatalogId
            ),
          }
        );

        setSuccess(
          'Servicio creado correctamente'
        );
      }

      setShowForm(false);
      setEditItem(null);

      setForm({
        name: '',
        description: '',
        category: '',
        attentionLevel: 1,
        damageCatalogId: '',
      });

      loadServices();
    } catch {
      setError(
        'Error al guardar el servicio'
      );
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);

    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      attentionLevel:
        item.attentionLevel,
      damageCatalogId:
        item.damageCatalogId,
    });

    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        '¿Desactivar este servicio?'
      )
    )
      return;

    try {
      await catalogAPI.delete(
        `/servicecatalog/${id}`
      );

      setSuccess(
        'Servicio desactivado'
      );

      loadServices();
    } catch {
      setError(
        'Error al desactivar servicio'
      );
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

    return (
      colors[level] || '#1565c0'
    );
  };

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>
              Catálogo de Servicios
            </h1>

            <p style={s.subtitle}>
              Administra servicios y
              categorías tecnológicas
            </p>
          </div>

          <button
            style={s.actionBtn}
            onClick={() => {
              setShowForm(true);
              setEditItem(null);

              setForm({
                name: '',
                description: '',
                category: '',
                attentionLevel: 1,
                damageCatalogId: '',
              });
            }}
          >
            <Plus size={16} />
            Nuevo Servicio
          </button>
        </div>

        {success && (
          <div style={s.success}>
            {success}
          </div>
        )}

        {error && (
          <div style={s.error}>
            {error}
          </div>
        )}

        {showForm && (
          <div style={s.formCard}>
            <h4 style={s.formTitle}>
              {editItem
                ? 'Editar Servicio'
                : 'Nuevo Servicio'}
            </h4>

            <form
              onSubmit={handleSubmit}
            >
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>
                    Nombre
                  </label>

                  <input
                    style={s.input}
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name:
                          e.target.value,
                      })
                    }
                    placeholder="Nombre del servicio"
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Categoría
                  </label>

                  <input
                    style={s.input}
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category:
                          e.target.value,
                      })
                    }
                    placeholder="Hardware, Software, Redes..."
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Descripción
                  </label>

                  <input
                    style={s.input}
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                    placeholder="Descripción del servicio"
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Nivel de atención
                  </label>

                  <select
                    style={s.input}
                    value={
                      form.attentionLevel
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attentionLevel:
                          e.target.value,
                      })
                    }
                  >
                    <option value={1}>
                      N1 — Técnico
                      Básico
                    </option>

                    <option value={2}>
                      N2 — Técnico
                      Profesional
                    </option>

                    <option value={3}>
                      N3 — DITIC
                    </option>

                    <option value={4}>
                      N4 — Proveedor
                      Externo
                    </option>
                  </select>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Categoría de daño
                  </label>

                  <select
                    style={s.input}
                    value={
                      form.damageCatalogId
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        damageCatalogId:
                          e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">
                      -- Selecciona --
                    </option>

                    {damages.map((d) => (
                      <option
                        key={d.id}
                        value={d.id}
                      >
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.formButtons}>
                <button
                  type="submit"
                  style={s.saveBtn}
                >
                  {editItem
                    ? 'Guardar Cambios'
                    : 'Crear Servicio'}
                </button>

                <button
                  type="button"
                  style={s.cancelBtn}
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
          <div
            style={s.stateContainer}
          >
            <p style={s.stateText}>
              Cargando servicios...
            </p>
          </div>
        ) : (
          <div style={s.tableCard}>
            <div
              style={s.tableWrapper}
            >
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>
                      Servicio
                    </th>

                    <th style={s.th}>
                      Categoría
                    </th>

                    <th style={s.th}>
                      Descripción
                    </th>

                    <th style={s.th}>
                      Nivel
                    </th>

                    <th style={s.th}>
                      Tipo de Daño
                    </th>

                    <th style={s.th}>
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((sItem) => (
                    <tr
                      key={sItem.id}
                      style={s.tr}
                    >
                      <td style={s.td}>
                        {sItem.name}
                      </td>

                      <td style={s.td}>
                        {sItem.category}
                      </td>

                      <td style={s.td}>
                        {
                          sItem.description
                        }
                      </td>

                      <td style={s.td}>
                        <span
                          style={{
                            ...s.badge,
                            backgroundColor:
                              getLevelColor(
                                sItem.attentionLevel
                              ),
                          }}
                        >
                          {getLevelName(
                            sItem.attentionLevel
                          )}
                        </span>
                      </td>

                      <td style={s.td}>
                        {
                          sItem.damageName
                        }
                      </td>

                      <td style={s.td}>
                        <div
                          style={s.actions}
                        >
                          <button
                            onClick={() =>
                              handleEdit(
                                sItem
                              )
                            }
                            style={
                              s.iconBtn
                            }
                            title="Editar"
                          >
                            <Pencil
                              size={15}
                              color="#4361ee"
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                sItem.id
                              )
                            }
                            style={
                              s.iconBtn
                            }
                            title="Desactivar"
                          >
                            <Trash2
                              size={15}
                              color="#dc2626"
                            />
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
    justifyContent:
      'space-between',
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
    gridTemplateColumns:
      '1fr 1fr',
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
    border:
      '1px solid #d0d5dd',
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
    borderBottom:
      '1px solid #eaecf0',
  },

  tr: {
    borderBottom:
      '1px solid #f1f3f5',
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
    justifyContent:
      'center',
    backgroundColor:
      'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
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

export default ServiceCatalogPage;