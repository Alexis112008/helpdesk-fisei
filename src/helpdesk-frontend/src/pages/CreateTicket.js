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
    location: '',          // ← NUEVO: ubicación del equipo/aula
    assetCode: '',         // ← NUEVO: código de activo / equipo
    damageCatalogId: '',
    serviceCatalogId: '',
    userId: parseInt(localStorage.getItem('userId')) || 0,
  });

  useEffect(() => {
    catalogAPI.get('/damagecatalog').then((res) => setDamages(res.data));
  }, []);

  const handleDamageChange = (e) => {
    const damageId = e.target.value;
    setForm({ ...form, damageCatalogId: damageId, serviceCatalogId: '' });
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
    if (!form.serviceCatalogId) {
      setError('Debes seleccionar un servicio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        location: form.location,
        assetCode: form.assetCode,
        damageCatalogId: parseInt(form.damageCatalogId),
        serviceCatalogId: parseInt(form.serviceCatalogId),
        userId: form.userId,
      };
      await ticketAPI.post('/ticket', payload);
      setSuccess('¡Ticket creado exitosamente! Será asignado automáticamente a un técnico.');
      setTimeout(() => navigate('/tickets'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el ticket. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Servicio seleccionado para mostrar info
  const selectedService = services.find(
    (sv) => sv.id === parseInt(form.serviceCatalogId)
  );

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h1 style={s.formTitle}>Crear Nuevo Ticket</h1>
            <p style={s.formSubtitle}>
              Completa todos los campos para registrar el problema. Un técnico será
              asignado automáticamente.
            </p>
          </div>

          {success && <div style={s.success}>{success}</div>}
          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={handleSubmit}>

            {/* ── Sección: Información del problema ── */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Información del problema</h3>

              <div style={s.field}>
                <label style={s.label}>Título *</label>
                <input
                  style={s.input}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Describe brevemente el problema"
                  required
                  maxLength={120}
                />
                <span style={s.hint}>{form.title.length}/120 caracteres</span>
              </div>

              <div style={s.field}>
                <label style={s.label}>Descripción detallada *</label>
                <textarea
                  style={s.textarea}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe el problema con detalle: qué ocurrió, desde cuándo, qué estabas haciendo..."
                  required
                />
              </div>

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Prioridad *</label>
                  <select
                    style={s.input}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="Baja">🟢 Baja — No urgente</option>
                    <option value="Media">🟡 Media — Requiere atención</option>
                    <option value="Alta">🟠 Alta — Impacto significativo</option>
                    <option value="Crítica">🔴 Crítica — Sistema caído</option>
                  </select>
                </div>

                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Categoría de daño *</label>
                  <select
                    style={s.input}
                    value={form.damageCatalogId}
                    onChange={handleDamageChange}
                    required
                  >
                    <option value="">-- Selecciona categoría --</option>
                    {damages.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Servicio afectado *</label>
                <select
                  style={s.input}
                  value={form.serviceCatalogId}
                  onChange={(e) => setForm({ ...form, serviceCatalogId: e.target.value })}
                  required
                  disabled={!form.damageCatalogId}
                >
                  <option value="">
                    {form.damageCatalogId
                      ? '-- Selecciona el servicio --'
                      : '-- Primero selecciona una categoría de daño --'}
                  </option>
                  {services.map((sv) => (
                    <option key={sv.id} value={sv.id}>{sv.name}</option>
                  ))}
                </select>
                {/* Info del nivel de atención del servicio seleccionado */}
                {selectedService && (
                  <div style={s.serviceInfo}>
                    <span style={s.serviceInfoIcon}>ℹ️</span>
                    Este servicio será atendido por un técnico de{' '}
                    <strong>Nivel {selectedService.attentionLevel}</strong>.
                  </div>
                )}
              </div>
            </div>

            {/*Sección: Ubicación y equipo*/}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Ubicación y equipo</h3>

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Ubicación / Aula *</label>
                  <input
                    style={s.input}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ej: Laboratorio 3B, Bloque A piso 2"
                    required
                  />
                </div>

                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Código de activo / Equipo</label>
                  <input
                    style={s.input}
                    value={form.assetCode}
                    onChange={(e) => setForm({ ...form, assetCode: e.target.value })}
                    placeholder="Ej: PC-LAB3B-05, IMP-OF201"
                  />
                  <span style={s.hint}>
                    Si conoces el código del equipo, ingrésalo para agilizar la atención
                  </span>
                </div>
              </div>
            </div>

            {/*Info automática*/}
            <div style={s.infoBox}>
              <span style={s.infoIcon}>⚡</span>
              <div>
                <strong>Asignación automática:</strong> Al crear el ticket, el sistema lo
                asignará al técnico disponible con menor carga de trabajo según el servicio
                y nivel de atención requerido.
              </div>
            </div>

            <button type="submit" style={s.submitBtn} disabled={loading}>
              {loading ? 'Creando ticket...' : 'Crear Ticket'}
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
}

const s = {
  content: { padding: '32px', flex: 1 },
  formCard: { width: '100%', maxWidth: 850, backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', padding: 32, boxSizing: 'border-box' },
  formHeader: { marginBottom: 28 },
  formTitle: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 },
  formSubtitle: { fontSize: 14, color: '#6b7280' },
  success: { backgroundColor: '#ecfdf3', color: '#027a48', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14 },
  error: { backgroundColor: '#fef3f2', color: '#b42318', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14 },
  // Secciones
  section: { marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f1f3f5' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 18, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 },
  // Campos
  row: { display: 'flex', gap: 20 },
  field: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff' },
  textarea: { width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', outline: 'none', fontFamily: 'inherit' },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4, display: 'block' },
  serviceInfo: { marginTop: 8, fontSize: 13, color: '#374151', backgroundColor: '#eff6ff', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 },
  serviceInfoIcon: { fontSize: 14 },
  // Info box
  infoBox: { display: 'flex', gap: 10, alignItems: 'flex-start', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#166534' },
  infoIcon: { fontSize: 16, marginTop: 1 },
  submitBtn: { width: '100%', padding: '14px', border: 'none', borderRadius: 10, backgroundColor: '#4361ee', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 10 },
};

export default CreateTicket;