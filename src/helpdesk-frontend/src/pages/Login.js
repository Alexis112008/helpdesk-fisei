import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  LogIn, 
  GraduationCap, 
  Zap, 
  Shield, 
  Clock,
  AlertCircle,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import { authAPI } from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          <div style={styles.logoIcon}>
            <GraduationCap size={56} color="#fff" />
          </div>

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
              <Zap size={18} style={styles.featureIcon} />
              <span>Resolución rápida de incidentes</span>
            </div>

            <div style={styles.feature}>
              <Shield size={18} style={styles.featureIcon} />
              <span>Seguridad y privacidad garantizadas</span>
            </div>

            <div style={styles.feature}>
              <Clock size={18} style={styles.featureIcon} />
              <span>Disponible las 24 horas, 7 días</span>
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
          <div style={styles.formHeader}>
            <LogIn size={32} color="#2d6a9f" />
            <h2 style={styles.title}>Iniciar sesión</h2>
          </div>

          <p style={styles.subtitle}>
            Ingresa con tus credenciales institucionales
          </p>

          {error && (
            <div style={styles.error}>
              <AlertCircle size={16} style={{ marginRight: 8 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>
                <Mail size={14} style={styles.labelIcon} />
                Correo electrónico
              </label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} color="#8a9bb5" />
                <input
                  type="email"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@fisei.edu.ec"
                  required
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                <Lock size={14} style={styles.labelIcon} />
                Contraseña
              </label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} color="#8a9bb5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...styles.input, paddingRight: 48 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={styles.spinner} />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn size={18} style={{ marginRight: 8 }} />
                  Iniciar Sesión
                </>
              )}
            </button>

            <p style={styles.registerLink}>
              ¿No tienes cuenta?{' '}
              <span
                style={styles.link}
                onClick={() => navigate('/register')}
              >
                <UserPlus size={14} style={{ marginRight: 4 }} />
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
    fontFamily: 'Segoe UI, system-ui, sans-serif',
  },

  left: {
    width: '45%',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    position: 'relative',
    overflow: 'hidden',
  },

  leftContent: {
    color: 'white',
    maxWidth: '380px',
    zIndex: 2,
  },

  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  systemTitle: {
    fontSize: '36px',
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
    marginBottom: '48px',
  },

  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: '14px',
    marginBottom: '14px',
    opacity: '0.9',
  },

  featureIcon: {
    opacity: 0.9,
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
    borderRadius: '24px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },

  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },

  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0,
  },

  subtitle: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '28px',
  },

  error: {
    display: 'flex',
    alignItems: 'center',
    color: '#e53e3e',
    fontSize: '13px',
    marginBottom: '20px',
    background: '#fff5f5',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #feb2b2',
  },

  field: {
    marginBottom: '20px',
  },

  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px',
  },

  labelIcon: {
    color: '#8a9bb5',
  },

  inputWrapper: {
    position: 'relative',
  },

  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },

  input: {
    width: '100%',
    padding: '12px 16px 12px 44px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1a202c',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },

  passwordToggle: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: 0,
    opacity: 0.6,
  },

  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #2d6a9f 0%, #1e3a5f 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  registerLink: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '13px',
    color: '#718096',
  },

  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: '#2d6a9f',
    cursor: 'pointer',
    fontWeight: '600',
  },

  spinner: {
    width: 18,
    height: 18,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: 8,
  },
};

// Añadir animación para el spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Login;