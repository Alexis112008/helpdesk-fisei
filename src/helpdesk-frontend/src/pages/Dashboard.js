import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const fullName = localStorage.getItem('fullName');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2 style={styles.logo}>SmartCampus HelpDesk</h2>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{fullName}</span>
          <span style={styles.userRole}>{role}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </div>

      <div style={styles.content}>
        <h3 style={styles.welcome}>Bienvenido, {fullName} 👋</h3>

        <div style={styles.cards}>
          <div style={styles.card} onClick={() => navigate('/tickets')}>
            <div style={styles.cardIcon}>🎫</div>
            <h4 style={styles.cardTitle}>Mis Tickets</h4>
            <p style={styles.cardDesc}>Ver todos los tickets registrados</p>
          </div>

          <div style={styles.card} onClick={() => navigate('/crear-ticket')}>
            <div style={styles.cardIcon}>➕</div>
            <h4 style={styles.cardTitle}>Nuevo Ticket</h4>
            <p style={styles.cardDesc}>Registrar un nuevo ticket de soporte</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  navbar: {
    backgroundColor: '#1a237e', padding: '16px 32px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  logo: { color: 'white', margin: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { color: 'white', fontWeight: '600' },
  userRole: {
    backgroundColor: '#3949ab', color: 'white', padding: '4px 10px',
    borderRadius: '12px', fontSize: '12px',
  },
  logoutBtn: {
    backgroundColor: '#c62828', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
  },
  content: { padding: '40px 32px' },
  welcome: { color: '#1a237e', marginBottom: '32px', fontSize: '22px' },
  cards: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  card: {
    backgroundColor: 'white', padding: '32px', borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', cursor: 'pointer',
    width: '220px', textAlign: 'center',
    transition: 'transform 0.2s',
  },
  cardIcon: { fontSize: '48px', marginBottom: '12px' },
  cardTitle: { color: '#1a237e', marginBottom: '8px' },
  cardDesc: { color: '#666', fontSize: '14px' },
};

export default Dashboard;