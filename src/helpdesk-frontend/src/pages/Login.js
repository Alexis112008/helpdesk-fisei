import React, { useState, useEffect } from 'react';
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
  UserPlus
} from 'lucide-react';
import { authAPI } from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Si es móvil, mostrar SOLO el formulario
  if (isMobile) {
    return (
      <div style={mobileStyles.container}>
        <div style={mobileStyles.card}>
          <div style={mobileStyles.logoIcon}>
            <GraduationCap size={48} color="#2d6a9f" />
          </div>

          <h1 style={mobileStyles.title}>HelpDesk FISEI</h1>
          <p style={mobileStyles.subtitle}>Ingresa con tus credenciales institucionales</p>

          {error && (
            <div style={mobileStyles.error}>
              <AlertCircle size={16} style={{ marginRight: 8 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={mobileStyles.field}>
              <label style={mobileStyles.label}>
                <Mail size={14} style={{ marginRight: 6 }} />
                Correo electrónico
              </label>
              <div style={mobileStyles.inputWrapper}>
                <Mail size={18} style={mobileStyles.inputIcon} color="#8a9bb5" />
                <input
                  type="email"
                  style={mobileStyles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@fisei.edu.ec"
                  required
                />
              </div>
            </div>

            <div style={mobileStyles.field}>
              <label style={mobileStyles.label}>
                <Lock size={14} style={{ marginRight: 6 }} />
                Contraseña
              </label>
              <div style={mobileStyles.inputWrapper}>
                <Lock size={18} style={mobileStyles.inputIcon} color="#8a9bb5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...mobileStyles.input, paddingRight: 48 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  style={mobileStyles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={mobileStyles.button}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={mobileStyles.spinner} />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn size={18} style={{ marginRight: 8 }} />
                  Iniciar Sesión
                </>
              )}
            </button>

            <p style={mobileStyles.registerLink}>
              ¿No tienes cuenta?{' '}
              <span
                style={mobileStyles.link}
                onClick={() => navigate('/register')}
              >
                Regístrate
              </span>
            </p>
          </form>

          <p style={mobileStyles.footer}>
            DITIC — Dirección de Tecnologías de la Información
          </p>
        </div>
      </div>
    );
  }

  // Estilos para DESKTOP (dos columnas)
  return (
    <div style={desktopStyles.container}>
      {/* Panel izquierdo */}
      <div style={desktopStyles.left}>
        <div style={desktopStyles.leftContent}>
          <div style={desktopStyles.logoIcon}>
            <GraduationCap size={56} color="#fff" />
          </div>

          <h1 style={desktopStyles.systemTitle}>
            Sistema de
            <br />
            Service Desk
          </h1>

          <p style={desktopStyles.systemSubtitle}>
            Plataforma institucional de soporte técnico para la comunidad
            universitaria.
          </p>

          <div style={desktopStyles.features}>
            <div style={desktopStyles.feature}>
              <Zap size={18} style={desktopStyles.featureIcon} />
              <span>Resolución rápida de incidentes</span>
            </div>

            <div style={desktopStyles.feature}>
              <Shield size={18} style={desktopStyles.featureIcon} />
              <span>Seguridad y privacidad garantizadas</span>
            </div>

            <div style={desktopStyles.feature}>
              <Clock size={18} style={desktopStyles.featureIcon} />
              <span>Disponible las 24 horas, 7 días</span>
            </div>
          </div>

          <p style={desktopStyles.ditic}>
            DITIC — Dirección de Tecnologías de la Información
          </p>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div style={desktopStyles.right}>
        <div style={desktopStyles.formCard}>
          <div style={desktopStyles.formHeader}>
            <LogIn size={32} color="#2d6a9f" />
            <h2 style={desktopStyles.title}>Iniciar sesión</h2>
          </div>

          <p style={desktopStyles.subtitle}>
            Ingresa con tus credenciales institucionales
          </p>

          {error && (
            <div style={desktopStyles.error}>
              <AlertCircle size={16} style={{ marginRight: 8 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={desktopStyles.field}>
              <label style={desktopStyles.label}>
                <Mail size={14} style={desktopStyles.labelIcon} />
                Correo electrónico
              </label>
              <div style={desktopStyles.inputWrapper}>
                <Mail size={18} style={desktopStyles.inputIcon} color="#8a9bb5" />
                <input
                  type="email"
                  style={desktopStyles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@fisei.edu.ec"
                  required
                />
              </div>
            </div>

            <div style={desktopStyles.field}>
              <label style={desktopStyles.label}>
                <Lock size={14} style={desktopStyles.labelIcon} />
                Contraseña
              </label>
              <div style={desktopStyles.inputWrapper}>
                <Lock size={18} style={desktopStyles.inputIcon} color="#8a9bb5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...desktopStyles.input, paddingRight: 48 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  style={desktopStyles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={desktopStyles.button}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={desktopStyles.spinner} />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn size={18} style={{ marginRight: 8 }} />
                  Iniciar Sesión
                </>
              )}
            </button>

            <p style={desktopStyles.registerLink}>
              ¿No tienes cuenta?{' '}
              <span
                style={desktopStyles.link}
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

// ========== ESTILOS PARA MÓVIL ==========
const mobileStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
    padding: '20px',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '32px 24px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#718096',
    textAlign: 'center',
    marginBottom: '28px',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px',
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
    padding: '14px 16px 14px 44px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1a202c',
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
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
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50px',
  },
  registerLink: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '13px',
    color: '#718096',
  },
  link: {
    color: '#2d6a9f',
    cursor: 'pointer',
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    fontSize: '11px',
    color: '#9ca3af',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '20px',
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

// ========== ESTILOS PARA DESKTOP ==========
const desktopStyles = {
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