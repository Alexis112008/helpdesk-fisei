import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogAPI } from '../../services/api';

function ServiceCatalogPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [damages, setDamages]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const [form, setForm] = useState({
    name: '', description: '', category: '',
    attentionLevel: 1, damageCatalogId: ''
  });

  useEffect(() => {
    loadServices();
    loadDamages();
  }, []);

  const loadServices = () => {
    catalogAPI.get('/servicecatalog')
      .then(res => setServices(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadDamages = () => {
    catalogAPI.get('/damagecatalog')
      .then(res => setDamages(res.data));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editItem) {
        await catalogAPI.put(`/servicecatalog/${editItem.id}`, {
          ...form,
          attentionLevel:  parseInt(form.attentionLevel),
          damageCatalogId: parseInt(form.damageCatalogId)
        });
        setSuccess('Servicio actualizado correctamente');
      } else {
        await catalogAPI.post('/servicecatalog', {
          ...form,
          attentionLevel:  parseInt(form.attentionLevel),
          damageCatalogId: parseInt(form.damageCatalogId)
        });
        setSuccess('Servicio creado correctamente');
      }
      setShowForm(false);
      setEditItem(null);
      setForm({ name: '', description: '', category: '', attentionLevel: 1, damageCatalogId: '' });
      loadServices();
    } catch {
      setError('Error al guardar el servicio');
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      name:            item.name,
      description:     item.description,
      category:        item.category,
      attentionLevel:  item.attentionLevel,
      damageCatalogId: item.damageCatalogId
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
      setError('Error al desactivar');
    }
  };

  const getLevelName = (level) => {
    const names = { 1: 'N1', 2: 'N2', 3: 'N3', 4: 'N4' };
    return names[level] || 'N1';
  };

  const getLevelColor = (level) => {
    const colors = { 1: '#1565c0', 2: '#00695c', 3: '#6a1b9a', 4: '#c62828' };
    return colors[level] || '#1565c0';
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2 style={styles.logo}>SmartCampus HelpDesk</h2>
        <div style={styles.navRight}>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            ← Dashboard
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/'); }}
            style={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Catálogo de Servicios</h3>
            <p style={styles.subtitle}>Servicios tecnológicos institucionales</p>
          </div>
          <button onClick={() => {
            setShowForm(true);
            setEditItem(null);
            setForm({ name: '', description: '', category: '', attentionLevel: 1, damageCatalogId: '' });
          }} style={styles.newBtn}>
            + Nuevo Servicio
          </button>
        </div>

        {success && <div style={styles.success}>{success}</div>}
        {error   && <div style={styles.error}>{error}</div>}

        {showForm && (
          <div style={styles.formCard}>
            <h4 style={styles.formTitle}>
              {editItem ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h4>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Nombre</label>
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Nombre del servicio"
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Categoría</label>
                  <input
                    style={styles.input}
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="Hardware, Software, Redes..."
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Descripción</label>
                  <input
                    style={styles.input}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Descripción del servicio"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Nivel de atención</label>
                  <select
                    style={styles.input}
                    value={form.attentionLevel}
                    onChange={e => setForm({ ...form, attentionLevel: e.target.value })}
                  >
                    <option value={1}>N1 — Técnico Básico</option>
                    <option value={2}>N2 — Técnico Profesional</option>
                    <option value={3}>N3 — DITIC</option>
                    <option value={4}>N4 — Proveedor Externo</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Categoría de daño</label>
                  <select
                    style={styles.input}
                    value={form.damageCatalogId}
                    onChange={e => setForm({ ...form, damageCatalogId: e.target.value })}
                    required
                  >
                    <option value="">-- Selecciona --</option>
                    {damages.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formButtons}>
                <button type="submit" style={styles.saveBtn}>
                  {editItem ? 'Guardar Cambios' : 'Crear Servicio'}
                </button>
                <button type="button" style={styles.cancelBtn}
                  onClick={() => { setShowForm(false); setEditItem(null); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#666', textAlign: 'center' }}>Cargando servicios...</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Servicio</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Descripción</th>
                  <th style={styles.th}>Nivel</th>
                  <th style={styles.th}>Tipo de Daño</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id} style={styles.tr}>
                    <td style={styles.td}>{s.name}</td>
                    <td style={styles.td}>{s.category}</td>
                    <td style={styles.td}>{s.description}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: getLevelColor(s.attentionLevel)
                      }}>
                        {getLevelName(s.attentionLevel)}
                      </span>
                    </td>
                    <td style={styles.td}>{s.damageName}</td>
                    <td style={styles.td}>
                      <button onClick={() => handleEdit(s)} style={styles.editBtn}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(s.id)} style={styles.deleteBtn}>
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:    { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  navbar:       { backgroundColor: '#1a237e', padding: '16px 32px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo:         { color: 'white', margin: 0 },
  navRight:     { display: 'flex', gap: '12px' },
  backBtn:      { backgroundColor: 'transparent', color: 'white',
                  border: '1px solid white', padding: '8px 16px',
                  borderRadius: '6px', cursor: 'pointer' },
  logoutBtn:    { backgroundColor: '#c62828', color: 'white', border: 'none',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' },
  content:      { padding: '32px' },
  header:       { display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '24px' },
  title:        { color: '#1a237e', margin: 0 },
  subtitle:     { color: '#666', margin: '4px 0 0', fontSize: '14px' },
  newBtn:       { backgroundColor: '#1a237e', color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600' },
  success:      { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '12px',
                  borderRadius: '6px', marginBottom: '16px' },
  error:        { backgroundColor: '#ffebee', color: '#c62828', padding: '12px',
                  borderRadius: '6px', marginBottom: '16px' },
  formCard:     { backgroundColor: 'white', padding: '24px', borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  formTitle:    { color: '#1a237e', marginBottom: '20px' },
  formGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field:        { marginBottom: '4px' },
  label:        { display: 'block', marginBottom: '6px', color: '#333',
                  fontWeight: '500', fontSize: '14px' },
  input:        { width: '100%', padding: '10px', borderRadius: '6px',
                  border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  formButtons:  { display: 'flex', gap: '12px', marginTop: '20px' },
  saveBtn:      { padding: '10px 24px', backgroundColor: '#1a237e', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  cancelBtn:    { padding: '10px 24px', backgroundColor: '#e0e0e0', color: '#333',
                  border: 'none', borderRadius: '6px', cursor: 'pointer' },
  tableWrapper: { overflowX: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white',
                  borderRadius: '10px', overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  thead:        { backgroundColor: '#1a237e' },
  th:           { color: 'white', padding: '14px 16px', textAlign: 'left',
                  fontWeight: '600', fontSize: '14px' },
  tr:           { borderBottom: '1px solid #eee' },
  td:           { padding: '12px 16px', color: '#333', fontSize: '14px' },
  badge:        { color: 'white', padding: '4px 10px', borderRadius: '12px',
                  fontSize: '12px', fontWeight: '600' },
  editBtn:      { backgroundColor: '#1565c0', color: 'white', border: 'none',
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '12px', marginRight: '8px' },
  deleteBtn:    { backgroundColor: '#c62828', color: 'white', border: 'none',
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '12px' },
};

export default ServiceCatalogPage;