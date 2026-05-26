import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Layout from '../components/Layout';

function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Usar GET /api/user/{id} (es público por [AllowAnonymous])
      const res = await authAPI.get(`/user/${userId}`);
      setFormData({
        ...formData,
        fullName: res.data.fullName || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar datos del usuario' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Usar PUT /api/user/me (nuevo endpoint)
      await authAPI.put('/user/me', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });
      
      localStorage.setItem('fullName', formData.fullName);
      
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      setTimeout(() => loadUserData(), 1000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al actualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'Ingresa tu contraseña actual' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Usar PUT /api/user/me/password (nuevo endpoint)
      await authAPI.put('/user/me/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al cambiar contraseña' });
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = () => {
    switch(role) {
      case 'Admin': return 'Administrador';
      case 'TecnicoN1': return 'Técnico Nivel 1';
      case 'TecnicoN2': return 'Técnico Nivel 2';
      case 'DITIC': return 'DITIC';
      case 'Proveedor': return 'Proveedor Externo';
      default: return 'Usuario';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={s.loading}>Cargando perfil...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>Mi Perfil</h1>
          <p style={s.subtitle}>Gestiona tu información personal y contraseña</p>
        </div>

        {message.text && (
          <div style={{ ...s.message, backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24' }}>
            {message.text}
          </div>
        )}

        <div style={s.grid}>
          <div style={s.card}>
            <h2 style={s.cardTitle}>Información Personal</h2>
            <form onSubmit={handleUpdateProfile} style={s.form}>
              <div style={s.formGroup}>
                <label style={s.label}>Rol</label>
                <input type="text" value={getRoleName()} disabled style={{ ...s.input, ...s.disabled }} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Nombre completo</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Opcional"
                  style={s.input}
                />
              </div>
              <button type="submit" disabled={saving} style={s.button}>
                {saving ? 'Guardando...' : 'Actualizar Perfil'}
              </button>
            </form>
          </div>

          <div style={s.card}>
            <h2 style={s.cardTitle}>Cambiar Contraseña</h2>
            <form onSubmit={handleChangePassword} style={s.form}>
              <div style={s.formGroup}>
                <label style={s.label}>Contraseña actual</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Nueva contraseña</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
                <small style={s.hint}>Mínimo 6 caracteres</small>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Confirmar nueva contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
              </div>
              <button type="submit" disabled={saving} style={s.button}>
                {saving ? 'Guardando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  container: { maxWidth: 1200, margin: '0 auto' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  loading: { textAlign: 'center', padding: 40, fontSize: 16, color: '#6b7280' },
  message: { padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', padding: 24 },
  cardTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#111827' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  disabled: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  hint: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  button: { backgroundColor: '#4361ee', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
};

export default Profile;