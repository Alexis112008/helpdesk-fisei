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
      const response = await authAPI.post('/auth/login', { email, password });
      const { token, fullName, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('role', role);

      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales incorrectas. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>HelpDesk</h2>
        <p style={styles.subtitle}>Ingresa tus credenciales</p>

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

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#718096' }}>
              ¿No tienes cuenta?{' '}
            <span
            style={{ color: '#2d6a9f', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => navigate('/register')}
            >
            Regístrate
  </span>
</p>

        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', backgroundColor: '#f0f2f5',
  },
  card: {
    backgroundColor: 'white', padding: '40px', borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '380px',
  },
  title: {
    textAlign: 'center', color: '#1a237e', marginBottom: '8px',
  },
  subtitle: {
    textAlign: 'center', color: '#666', marginBottom: '24px',
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

export default Login;