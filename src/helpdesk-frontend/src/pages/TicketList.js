import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';

import Layout from '../components/Layout';

function TicketList() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(''); // ← NUEVO
  const [filterPriority, setFilterPriority] = useState(''); // ← NUEVO

  const role = localStorage.getItem('role');

  // ← NUEVO: filtrar tickets
  const filteredTickets = tickets.filter((t) => {
    const matchStatus = filterStatus === '' || t.status === filterStatus;
    const matchPriority = filterPriority === '' || t.priority === filterPriority;
    return matchStatus && matchPriority;
  });

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
      Vencido: '#b71c1c', // ← NUEVO
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

        {/* ← NUEVO: barra de filtros */}
        {!loading && tickets.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <select
              style={s.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Abierto">Abierto</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Escalado">Escalado</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cerrado">Cerrado</option>
              <option value="Vencido">Vencido</option>
            </select>

            <select
              style={s.filterSelect}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">Todas las prioridades</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>

            <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>
              {filteredTickets.length} de {tickets.length} tickets
            </span>
          </div>
        )}

        {loading ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>
              Cargando tickets...
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>
              {tickets.length === 0 
                ? 'No hay tickets registrados aún.' 
                : 'No hay tickets que coincidan con los filtros seleccionados.'}
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
                  {/* ← CAMBIADO: filteredTickets.map en lugar de tickets.map */}
                  {filteredTickets.map((t) => (
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

  // ← NUEVO: estilo para los filtros
  filterSelect: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #d0d5dd',
    fontSize: 14,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
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