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
    switch (role) {
      case 'Admin': return 'Administrador';
      case 'TecnicoN1': return 'Técnico Nivel 1';
      case 'TecnicoN2': return 'Técnico Nivel 2';
      case 'DITIC': return 'DITIC';
      case 'Proveedor': return 'Proveedor Externo';
      default: return 'Usuario';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
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
        <div className="profile-loading">
          <RefreshCw size={24} className="profile-spinner" color={COLORS.Primario} />
          <span>Cargando perfil...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="profile-content">
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-header-icon">
              <User size={32} color={COLORS.Primario} />
            </div>
            <div>
              <h1 className="profile-title">Mi Perfil</h1>
              <p className="profile-subtitle">Gestiona tu información personal y contraseña</p>
            </div>
          </div>

          {/* Mensaje de éxito/error */}
          {message.text && (
            <div className={`profile-message profile-message-${message.type}`}>
              {message.type === 'success' ? (
                <CheckCircle size={18} className="profile-message-icon" />
              ) : (
                <AlertCircle size={18} className="profile-message-icon" />
              )}
              {message.text}
            </div>
          )}

          {/* Grid de tarjetas */}
          <div className="profile-grid">
            {/* Tarjeta de Información Personal */}
            <div style={cardStyle}>
              <div className="profile-card-header">
                <User size={20} color={COLORS.Primario} />
                <h2 className="profile-card-title">Información Personal</h2>
              </div>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="profile-form-group">
                  <label className="profile-label">ROL</label>
                  <div className="profile-role-badge">
                    {getRoleIcon()}
                    <span>{getRoleName()}</span>
                  </div>
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">NOMBRE COMPLETO</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="profile-input"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="profile-input"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">TELÉFONO</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Opcional"
                    className="profile-input"
                  />
                </div>
                <button type="submit" disabled={saving} className="profile-btn profile-btn-primary">
                  <Save size={16} className="profile-btn-icon" />
                  {saving ? 'Guardando...' : 'Actualizar Perfil'}
                </button>
              </form>
            </div>

            {/* Tarjeta de Cambiar Contraseña */}
            <div style={cardStyle}>
              <div className="profile-card-header">
                <Lock size={20} color={COLORS.Primario} />
                <h2 className="profile-card-title">Cambiar Contraseña</h2>
              </div>
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="profile-form-group">
                  <label className="profile-label">CONTRASEÑA ACTUAL</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    className="profile-input"
                    placeholder="••••••••"
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">NUEVA CONTRASEÑA</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="profile-input"
                    placeholder="••••••••"
                  />
                  <small className="profile-hint">Mínimo 6 caracteres</small>
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">CONFIRMAR NUEVA CONTRASEÑA</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="profile-input"
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" disabled={saving} className="profile-btn profile-btn-primary">
                  <RefreshCw size={16} className="profile-btn-icon profile-spinner-animation" />
                  {saving ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="profile-footer">
            <div className="profile-footer-content">
              <Building2 size={14} color={COLORS.TextoSecundario} />
              <span>Departamento de Service Desk</span>
              <span>•</span>
              <Calendar size={14} color={COLORS.TextoSecundario} />
              <span>FISEI</span>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .profile-content {
          padding: 28px 32px;
          flex: 1;
          background-color: ${COLORS.Fondo};
          min-height: 100vh;
        }

        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-header {
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 16;
        }

        .profile-header-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background-color: ${COLORS.PrimarioLight};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-title {
          font-size: 26px;
          font-weight: 700;
          color: ${COLORS.Texto};
          margin-bottom: 4px;
        }

        .profile-subtitle {
          font-size: 13px;
          color: ${COLORS.TextoSecundario};
        }

        .profile-loading {
          text-align: center;
          padding: 60px;
          font-size: 14px;
          color: ${COLORS.TextoSecundario};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .profile-spinner {
          animation: spin 1s linear infinite;
        }

        .profile-message {
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid;
        }

        .profile-message-success {
          background-color: #ecfdf5;
          border-color: #10b981;
          color: #065f46;
        }

        .profile-message-error {
          background-color: #fef2f2;
          border-color: #ef4444;
          color: #991b1b;
        }

        .profile-message-icon {
          margin-right: 4px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 28px;
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid ${COLORS.Borde};
        }

        .profile-card-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: ${COLORS.Texto};
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .profile-label {
          font-size: 11px;
          font-weight: 600;
          color: ${COLORS.TextoSecundario};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid ${COLORS.Borde};
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          background-color: #fff;
          color: ${COLORS.Texto};
          box-sizing: border-box;
        }

        .profile-input:focus {
          border-color: ${COLORS.Primario};
          box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
          outline: none;
        }

        .profile-role-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background-color: ${COLORS.PrimarioLight};
          border-radius: 10px;
          color: ${COLORS.Primario};
          font-size: 14px;
          font-weight: 500;
        }

        .profile-hint {
          font-size: 11px;
          color: ${COLORS.TextoSecundario};
          margin-top: 4px;
          display: block;
        }

        .profile-btn {
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .profile-btn-primary {
          background-color: ${COLORS.Primario};
          color: #fff;
        }

        .profile-btn-primary:hover {
          transform: translateY(-1px);
        }

        .profile-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .profile-btn-icon {
          margin-right: 8px;
        }

        .profile-footer {
          margin-top: 24px;
          background: #fff;
          border-radius: 20px;
          border: 1px solid ${COLORS.Borde};
          text-align: center;
          padding: 16px 20px;
        }

        .profile-footer-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
          color: ${COLORS.TextoSecundario};
        }

        .profile-spinner-animation {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .profile-content {
            padding: 70px 12px 20px 12px;
          }

          .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .profile-header-icon {
            width: 48px;
            height: 48px;
          }

          .profile-title {
            font-size: 22px;
          }

          .profile-subtitle {
            font-size: 12px;
          }

          .profile-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .profile-card-header {
            margin-bottom: 18px;
            padding-bottom: 12px;
          }

          .profile-card-title {
            font-size: 16px;
          }

          .profile-input {
            padding: 12px;
            font-size: 16px;
          }

          .profile-btn {
            padding: 12px;
          }

          .profile-footer {
            margin-top: 20px;
            padding: 12px 16px;
          }

          .profile-footer-content {
            font-size: 10px;
            gap: 6px;
          }
        }
      `}</style>
    </Layout>
  );
}

export default Profile;