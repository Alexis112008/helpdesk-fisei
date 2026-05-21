import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';

import Layout from '../components/Layout';

function TicketList() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem('role');

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    // "Mis Tickets" siempre filtra por el usuario autenticado,
    // incluso si es Admin. Los admins ven todos los tickets desde
    // otras pantallas (Dashboard / reportes), no aquí.
    const url = `/ticket/user/${userId}`;

    ticketAPI
      .get(url)
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [role]);

  const getStatusColor = (status) => {
    const colors = {
      Abierto: '#1565c0',
      'En Proceso': '#f57f17',
      Escalado: '#6a1b9a',
      Resuelto: '#2e7d32',
      Cerrado: '#424242',
    };

    return colors[status] || '#333';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Baja: '#388e3c',
      Media: '#f57f17',
      Alta: '#e64a19',
      Crítica: '#b71c1c',
    };

    return colors[priority] || '#333';
  };

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Mis Tickets</h1>

            <p style={s.subtitle}>
              Tickets que has creado y su estado actual
            </p>
          </div>

          <button
            style={s.newButton}
            onClick={() =>
              navigate('/crear-ticket')
            }
          >
            + Nuevo Ticket
          </button>
        </div>

        {loading ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>
              Cargando tickets...
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>
              No hay tickets registrados aún.
            </p>
          </div>
        ) : (
          <div style={s.tableCard}>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>N° Ticket</th>
                    <th style={s.th}>Título</th>
                    <th style={s.th}>Prioridad</th>
                    <th style={s.th}>Estado</th>
                    <th style={s.th}>Nivel</th>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} style={s.tr}>
                      <td style={s.td}>
                        <span style={s.ticketNumber}>
                          {t.ticketNumber}
                        </span>
                      </td>

                      <td style={s.td}>
                        {t.title}
                      </td>

                      <td style={s.td}>
                        <span
                          style={{
                            ...s.badge,
                            backgroundColor:
                              getPriorityColor(
                                t.priority
                              ),
                          }}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td style={s.td}>
                        <span
                          style={{
                            ...s.badge,
                            backgroundColor:
                              getStatusColor(
                                t.status
                              ),
                          }}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td style={s.td}>
                        {t.levelName}
                      </td>

                      <td style={s.td}>
                        {new Date(
                          t.createdAt
                        ).toLocaleDateString(
                          'es-EC'
                        )}
                      </td>

                      <td style={s.td}>
                        <button
                          style={s.viewBtn}
                          onClick={() =>
                            navigate(`/tickets/${t.id}`)
                          }
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}

const s = {
  content: {
    padding: '32px',
    flex: 1,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },

  newButton: {
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '12px 18px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },

  tableCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #eaecf0',
    overflow: 'hidden',
  },

  tableWrapper: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  thead: {
    backgroundColor: '#f9fafb',
  },

  th: {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 700,
    color: '#667085',
    borderBottom: '1px solid #eaecf0',
  },

  tr: {
    borderBottom: '1px solid #f1f3f5',
  },

  td: {
    padding: '18px 20px',
    fontSize: 14,
    color: '#344054',
  },

  ticketNumber: {
    fontWeight: 700,
    color: '#4361ee',
  },

  badge: {
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block',
  },

  stateContainer: {
    padding: '60px 20px',
    textAlign: 'center',
  },

  stateText: {
    color: '#6b7280',
    fontSize: 15,
  },

  viewBtn: {
    background: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
};

export default TicketList;