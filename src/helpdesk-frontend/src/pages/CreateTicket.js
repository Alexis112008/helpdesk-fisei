import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI, catalogAPI } from '../services/api';

import Layout from '../components/Layout';

function CreateTicket() {
  const navigate = useNavigate();

  const [damages, setDamages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Media',
    damageCatalogId: '',
    serviceCatalogId: '',
    userId: parseInt(localStorage.getItem('userId')) || 0,
  });

  useEffect(() => {
    catalogAPI
      .get('/damagecatalog')
      .then((res) => setDamages(res.data));
  }, []);

  const handleDamageChange = (e) => {
    const damageId = e.target.value;

    setForm({
      ...form,
      damageCatalogId: damageId,
      serviceCatalogId: '',
    });

    if (damageId) {
      catalogAPI
        .get(`/servicecatalog/by-damage/${damageId}`)
        .then((res) => setServices(res.data));
    } else {
      setServices([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await ticketAPI.post('/ticket', form);

      setSuccess('¡Ticket creado exitosamente!');

      setTimeout(() => navigate('/tickets'), 2000);
    } catch (err) {
      setError(
        'Error al crear el ticket. Intente de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h1 style={s.formTitle}>
              Crear Nuevo Ticket
            </h1>

            <p style={s.formSubtitle}>
              Completa la información del problema
            </p>
          </div>

          {success && (
            <div style={s.success}>{success}</div>
          )}

          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Título</label>

              <input
                style={s.input}
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                placeholder="Describe brevemente el problema"
                required
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>
                Descripción
              </label>

              <textarea
                style={s.textarea}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Detalla el problema..."
                required
              />
            </div>

            <div style={s.row}>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>
                  Prioridad
                </label>

                <select
                  style={s.input}
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value,
                    })
                  }
                >
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>
              </div>

              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>
                  Categoría de Daño
                </label>

                <select
                  style={s.input}
                  value={form.damageCatalogId}
                  onChange={handleDamageChange}
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

            <div style={s.field}>
              <label style={s.label}>Servicio</label>

              <select
                style={s.input}
                value={form.serviceCatalogId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serviceCatalogId: e.target.value,
                  })
                }
                required
                disabled={!form.damageCatalogId}
              >
                <option value="">
                  -- Selecciona --
                </option>

                {services.map((sItem) => (
                  <option
                    key={sItem.id}
                    value={sItem.id}
                  >
                    {sItem.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              style={s.submitBtn}
              disabled={loading}
            >
              {loading
                ? 'Creando...'
                : 'Crear Ticket'}
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
}

const s = {
  content: {
    padding: '32px',
    flex: 1,
  },

  formCard: {
    width: '100%',
    maxWidth: 850,
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #eaecf0',
    padding: 32,
    boxSizing: 'border-box',
  },

  formHeader: {
    marginBottom: 28,
  },

  formTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },

  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
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

  row: {
    display: 'flex',
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

  textarea: {
    width: '100%',
    minHeight: 120,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #d0d5dd',
    fontSize: 14,
    boxSizing: 'border-box',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
  },

  submitBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 10,
    backgroundColor: '#4361ee',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 10,
  },
};

export default CreateTicket;