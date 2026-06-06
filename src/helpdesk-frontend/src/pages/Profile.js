import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Key, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Save,
  RefreshCw,
  Briefcase,
  Building2,
  Calendar
} from 'lucide-react';
import { authAPI } from '../services/api';
import Layout from '../components/Layout';

// Colores unificados con el Dashboard
const COLORS = {
  Primario: '#2d6a9f',
  PrimarioOscuro: '#1e3a5f',
  PrimarioLight: '#eef2ff',
  Exito: '#10b981',
  Advertencia: '#f59e0b',
  Error: '#ef4444',
  Texto: '#1a1a2e',
  TextoSecundario: '#6b7280',
  Borde: '#e4e7eb',
  Fondo: '#f5f7fa',
};

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

  const getRoleIcon = () => {
    switch(role) {
      case 'Admin': return <Shield size={20} color={COLORS.Primario} />;
      default: return <Briefcase size={20} color={COLORS.Primario} />;
    }
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: 20,
    border: `1px solid ${COLORS.Borde}`,
    padding: '24px 28px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>
          <RefreshCw size={24} style={styles.spinner} color={COLORS.Primario} />
          <span>Cargando perfil...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main style={styles.content}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerIcon}>
              <User size={32} color={COLORS.Primario} />
            </div>
            <div>
              <h1 style={styles.title}>Mi Perfil</h1>
              <p style={styles.subtitle}>Gestiona tu información personal y contraseña</p>
            </div>
          </div>

          {/* Mensaje de éxito/error */}
          {message.text && (
            <div style={{ 
              ...styles.message, 
              backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2', 
              borderColor: message.type === 'success' ? '#10b981' : '#ef4444',
              color: message.type === 'success' ? '#065f46' : '#991b1b'
            }}>
              {message.type === 'success' ? (
                <CheckCircle size={18} style={styles.messageIcon} color="#10b981" />
              ) : (
                <AlertCircle size={18} style={styles.messageIcon} color="#ef4444" />
              )}
              {message.text}
            </div>
          )}

          {/* Grid de tarjetas */}
          <div style={styles.grid}>
            {/* Tarjeta de Información Personal */}
            <div style={cardStyle}>
              <div style={styles.cardHeader}>
                <User size={20} color={COLORS.Primario} />
                <h2 style={styles.cardTitle}>Información Personal</h2>
              </div>
              <form onSubmit={handleUpdateProfile} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>ROL</label>
                  <div style={styles.roleBadge}>
                    {getRoleIcon()}
                    <span>{getRoleName()}</span>
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>NOMBRE COMPLETO</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>TELÉFONO</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Opcional"
                    style={styles.input}
                  />
                </div>
                <button type="submit" disabled={saving} style={styles.button}>
                  <Save size={16} style={{ marginRight: 8 }} />
                  {saving ? 'Guardando...' : 'Actualizar Perfil'}
                </button>
              </form>
            </div>

            {/* Tarjeta de Cambiar Contraseña */}
            <div style={cardStyle}>
              <div style={styles.cardHeader}>
                <Lock size={20} color={COLORS.Primario} />
                <h2 style={styles.cardTitle}>Cambiar Contraseña</h2>
              </div>
              <form onSubmit={handleChangePassword} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>CONTRASEÑA ACTUAL</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="••••••••"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>NUEVA CONTRASEÑA</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="••••••••"
                  />
                  <small style={styles.hint}>Mínimo 6 caracteres</small>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>CONFIRMAR NUEVA CONTRASEÑA</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" disabled={saving} style={styles.button}>
                  <RefreshCw size={16} style={{ marginRight: 8 }} />
                  {saving ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div style={{ ...cardStyle, marginTop: 24, textAlign: 'center', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Building2 size={14} color={COLORS.TextoSecundario} />
              <span style={{ fontSize: 12, color: COLORS.TextoSecundario }}>Departamento de Service Desk</span>
              <span style={{ color: COLORS.TextoSecundario }}>•</span>
              <Calendar size={14} color={COLORS.TextoSecundario} />
              <span style={{ fontSize: 12, color: COLORS.TextoSecundario }}>EISEI</span>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

const styles = {
  content: {
    padding: '28px 32px',
    flex: 1,
    backgroundColor: COLORS.Fondo,
    minHeight: '100vh',
  },

  container: {
    maxWidth: 1200,
    margin: '0 auto',
  },

  header: {
    marginBottom: 28,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.PrimarioLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    color: COLORS.Texto,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.TextoSecundario,
  },

  loading: {
    textAlign: 'center',
    padding: 60,
    fontSize: 14,
    color: COLORS.TextoSecundario,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  spinner: {
    animation: 'spin 1s linear infinite',
  },

  message: {
    padding: '14px 18px',
    borderRadius: 12,
    marginBottom: 24,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid',
  },

  messageIcon: {
    marginRight: 4,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: 28,
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: `1px solid ${COLORS.Borde}`,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: COLORS.Texto,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },

  label: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.TextoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  input: {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    color: COLORS.Texto,
    boxSizing: 'border-box',
  },

  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    backgroundColor: COLORS.PrimarioLight,
    borderRadius: 10,
    color: COLORS.Primario,
    fontSize: 14,
    fontWeight: 500,
  },

  hint: {
    fontSize: 11,
    color: COLORS.TextoSecundario,
    marginTop: 4,
    display: 'block',
  },

  button: {
    backgroundColor: COLORS.Primario,
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
};

// Añadir animaciones y efectos focus
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: ${COLORS.Primario} !important;
    box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1) !important;
    outline: none !important;
  }
  
  button:hover {
    transform: translateY(-1px);
  }
`;
document.head.appendChild(styleSheet);

export default Profile;