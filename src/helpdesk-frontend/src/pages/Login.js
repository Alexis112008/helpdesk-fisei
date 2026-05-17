import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.post('/auth/login', {
        email,
        password,
      });

      const { token, fullName, role, userId } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);

      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales incorrectas. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Panel izquierdo */}
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.logoIcon}>🎓</div>

          <h1 style={styles.systemTitle}>
            Sistema de
            <br />
            Help Desk
          </h1>

          <p style={styles.systemSubtitle}>
            Plataforma institucional de soporte técnico para la comunidad
            universitaria.
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              ⚡ Resolución rápida de incidentes
            </div>

            <div style={styles.feature}>
              🔒 Seguridad y privacidad garantizadas
            </div>

            <div style={styles.feature}>
              🕐 Disponible las 24 horas, 7 días
            </div>
          </div>

          <p style={styles.ditic}>
            DITIC — Dirección de Tecnologías de la Información
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={styles.right}>
        <div style={styles.formCard}>
          <h2 style={styles.title}>Iniciar sesión</h2>

          <p style={styles.subtitle}>
            Ingresa con tus credenciales institucionales
          </p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>Correo electrónico</label>

              <input
                type="email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@fisei.edu.ec"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contraseña</label>

              <input
                type="password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            <p style={styles.registerLink}>
              ¿No tienes cuenta?{' '}
              <span
                style={styles.link}
                onClick={() => navigate('/register')}
              >
                Regístrate
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Segoe UI, sans-serif',
  },

  left: {
    width: '45%',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },

  leftContent: {
    color: 'white',
    maxWidth: '360px',
  },

  logoIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },

  systemTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    lineHeight: '1.2',
  },

  systemSubtitle: {
    fontSize: '15px',
    opacity: '0.85',
    marginBottom: '32px',
    lineHeight: '1.6',
  },

  features: {
    marginBottom: '40px',
  },

  feature: {
    fontSize: '14px',
    marginBottom: '12px',
    opacity: '0.9',
  },

  ditic: {
    fontSize: '12px',
    opacity: '0.6',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    paddingTop: '20px',
  },

  right: {
    width: '55%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f7fa',
  },

  formCard: {
    background: 'white',
    padding: '48px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },

  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '8px',
  },

  subtitle: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '28px',
  },

  error: {
    color: '#e53e3e',
    fontSize: '14px',
    marginBottom: '16px',
    background: '#fff5f5',
    padding: '10px',
    borderRadius: '8px',
  },

  field: {
    marginBottom: '18px',
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: '8px',
  },

  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1a202c',
  },

  button: {
    width: '100%',
    padding: '13px',
    background: '#2d6a9f',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },

  registerLink: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#718096',
  },

  link: {
    color: '#2d6a9f',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default Login;