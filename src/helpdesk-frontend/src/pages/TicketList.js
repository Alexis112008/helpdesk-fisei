import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';

function TicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketAPI.get('/ticket')
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      'Abierto': '#1565c0',
      'En Proceso': '#f57f17',
      'Escalado': '#6a1b9a',
      'Resuelto': '#2e7d32',
      'Cerrado': '#424242',
    };
    return colors[status] || '#333';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Baja': '#388e3c',
      'Media': '#f57f17',
      'Alta': '#e64a19',
      'Crítica': '#b71c1c',
    };
    return colors[priority] || '#333';
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2 style={styles.logo}>HelpDesk</h2>
        <div style={styles.navButtons}>
          <button onClick={() => navigate('/crear-ticket')} style={styles.newBtn}>
            + Nuevo Ticket
          </button>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            ← Volver
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <h3 style={styles.title}>Lista de Tickets</h3>

        {loading ? (
          <p style={styles.loading}>Cargando tickets...</p>
        ) : tickets.length === 0 ? (
          <p style={styles.empty}>No hay tickets registrados aún.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>N° Ticket</th>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Prioridad</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Nivel</th>
                  <th style={styles.th}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={styles.tr}>
                    <td style={styles.td}>{t.ticketNumber}</td>
                    <td style={styles.td}>{t.title}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: getPriorityColor(t.priority),
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: getStatusColor(t.status),
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={styles.td}>{t.levelName}</td>
                    <td style={styles.td}>
                      {new Date(t.createdAt).toLocaleDateString('es-EC')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  navButtons: { display: 'flex', gap: '12px' },
  newBtn: {
    backgroundColor: '#43a047', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
  },
  backBtn: {
    backgroundColor: 'transparent', color: 'white', border: '1px solid white',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
  },
  content: { padding: '40px 32px' },
  title: { color: '#1a237e', marginBottom: '24px' },
  loading: { color: '#666', textAlign: 'center' },
  empty: { color: '#666', textAlign: 'center' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white',
    borderRadius: '10px', overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  thead: { backgroundColor: '#1a237e' },
  th: { color: 'white', padding: '14px 16px', textAlign: 'left', fontWeight: '600' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px', color: '#333', fontSize: '14px' },
  badge: {
    color: 'white', padding: '4px 10px', borderRadius: '12px',
    fontSize: '12px', fontWeight: '600',
  },
};

export default TicketList;