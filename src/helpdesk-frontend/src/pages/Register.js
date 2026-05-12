import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: ''
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!form.email.endsWith('@uta.edu.ec')) {
      setError('Solo se permiten correos @uta.edu.ec');
      return;
    }

    setLoading(true);
    try {
      await authAPI.post('/Auth/register', {
        fullName: form.fullName,
        email:    form.email,
        password: form.password
      });
      setSuccess('¡Cuenta creada exitosamente! Redirigiendo al login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.logoIcon}>🎓</div>
          <h1 style={styles.systemTitle}>Sistema de<br/>Service Desk</h1>
          <p style={styles.systemSubtitle}>
            Soporte técnico institucional para la comunidad universitaria UTA
          </p>
          <div style={styles.features}>
            <div style={styles.feature}>⚡ Resolución rápida de incidentes</div>
            <div style={styles.feature}>🔒 Seguridad y privacidad garantizadas</div>
            <div style={styles.feature}>🕐 Disponible las 24 horas, 7 días</div>
          </div>
          <p style={styles.ditic}>
            DITIC — Dirección de Tecnologías de la Información
          </p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formCard}>
          <h2 style={styles.title}>Crear cuenta</h2>
          <p style={styles.subtitle}>
            Regístrate con tu correo institucional
          </p>

          {error   && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre completo</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Tu nombre completo"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Correo institucional</label>
              <input
                style={styles.input}
                type="email"
                placeholder="usuario@uta.edu.ec"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirmar contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <p style={styles.loginLink}>
            ¿Ya tienes cuenta?{' '}
            <span
              style={styles.link}
              onClick={() => navigate('/')}
            >
              Inicia sesión
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container:     { display: 'flex', height: '100vh', fontFamily: 'Segoe UI, sans-serif' },
  left:          { width: '45%', background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  leftContent:   { color: 'white', maxWidth: '360px' },
  logoIcon:      { fontSize: '48px', marginBottom: '20px' },
  systemTitle:   { fontSize: '32px', fontWeight: '700', marginBottom: '16px', lineHeight: '1.2' },
  systemSubtitle:{ fontSize: '15px', opacity: '0.85', marginBottom: '32px', lineHeight: '1.6' },
  features:      { marginBottom: '40px' },
  feature:       { fontSize: '14px', marginBottom: '12px', opacity: '0.9' },
  ditic:         { fontSize: '12px', opacity: '0.6', borderTop: '1px solid rgba(255,255,255,0.2)',
                   paddingTop: '20px' },
  right:         { width: '55%', display: 'flex', alignItems: 'center',
                   justifyContent: 'center', background: '#f5f7fa' },
  formCard:      { background: 'white', padding: '48px', borderRadius: '16px',
                   width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title:         { fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' },
  subtitle:      { fontSize: '14px', color: '#718096', marginBottom: '28px' },
  error:         { color: '#e53e3e', fontSize: '14px', marginBottom: '16px',
                   background: '#fff5f5', padding: '10px', borderRadius: '8px' },
  success:       { color: '#2e7d32', fontSize: '14px', marginBottom: '16px',
                   background: '#e8f5e9', padding: '10px', borderRadius: '8px' },
  field:         { marginBottom: '18px' },
  label:         { display: 'block', fontSize: '14px', fontWeight: '500',
                   color: '#4a5568', marginBottom: '8px' },
  input:         { width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0',
                   borderRadius: '8px', fontSize: '14px', outline: 'none',
                   boxSizing: 'border-box', color: '#1a202c' },
  button:        { width: '100%', padding: '13px', background: '#2d6a9f',
                   color: 'white', border: 'none', borderRadius: '8px',
                   fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  loginLink:     { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#718096' },
  link:          { color: '#2d6a9f', cursor: 'pointer', fontWeight: '600' },
};

export default Register;