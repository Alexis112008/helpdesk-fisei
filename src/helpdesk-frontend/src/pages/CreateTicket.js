import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI, catalogAPI } from '../services/api';

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
    userId: 1,
  });

  useEffect(() => {
    catalogAPI.get('/damagecatalog').then((res) => setDamages(res.data));
  }, []);

  const handleDamageChange = (e) => {
    const damageId = e.target.value;
    setForm({ ...form, damageCatalogId: damageId, serviceCatalogId: '' });
    if (damageId) {
      catalogAPI.get(`/servicecatalog/by-damage/${damageId}`)
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
      setError('Error al crear el ticket. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2 style={styles.logo}>SmartCampus HelpDesk</h2>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Volver
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <h3 style={styles.title}>Crear Nuevo Ticket</h3>

          {success && <div style={styles.success}>{success}</div>}
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Título</label>
              <input
                style={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Describe brevemente el problema"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Descripción</label>
              <textarea
                style={{ ...styles.input, height: '100px', resize: 'vertical' }}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalla el problema..."
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Prioridad</label>
              <select
                style={styles.input}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
                <option>Crítica</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Categoría de Daño</label>
              <select
                style={styles.input}
                value={form.damageCatalogId}
                onChange={handleDamageChange}
                required
              >
                <option value="">-- Selecciona --</option>
                {damages.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Servicio</label>
              <select
                style={styles.input}
                value={form.serviceCatalogId}
                onChange={(e) => setForm({ ...form, serviceCatalogId: e.target.value })}
                required
                disabled={!form.damageCatalogId}
              >
                <option value="">-- Selecciona --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Creando...' : 'Crear Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  navbar: {
    backgroundColor: '#1a237e', padding: '16px 32px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  logo: { color: 'white', margin: 0 },
  backBtn: {
    backgroundColor: 'transparent', color: 'white', border: '1px solid white',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
  },
  content: { padding: '40px 32px', display: 'flex', justifyContent: 'center' },
  card: {
    backgroundColor: 'white', padding: '40px', borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: '100%', maxWidth: '560px',
  },
  title: { color: '#1a237e', marginBottom: '24px' },
  success: {
    backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px',
    borderRadius: '5px', marginBottom: '16px', textAlign: 'center',
  },
  error: {
    backgroundColor: '#ffebee', color: '#c62828', padding: '10px',
    borderRadius: '5px', marginBottom: '16px', textAlign: 'center',
  },
  field: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', color: '#333', fontWeight: '500' },
  input: {
    width: '100%', padding: '10px', borderRadius: '6px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '12px', backgroundColor: '#1a237e',
    color: 'white', border: 'none', borderRadius: '6px',
    fontSize: '16px', cursor: 'pointer', marginTop: '8px',
  },
};

export default CreateTicket;