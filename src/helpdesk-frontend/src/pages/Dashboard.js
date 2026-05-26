import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ticketAPI, authAPI } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');
  const userId = localStorage.getItem('userId');

  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const TECH_ROLES = ['TecnicoN1', 'TecnicoN2', 'DITIC', 'Proveedor'];
  const isTech = TECH_ROLES.includes(role);
  const isAdmin = role === 'Admin';

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isAdmin) {
          const res = await ticketAPI.get('/ticket');
          const tickets = res.data;
          setStats({
            total: tickets.length,
            abiertos: tickets.filter(t => t.status === 'Abierto').length,
            enProceso: tickets.filter(t => t.status === 'En Proceso').length,
            escalados: tickets.filter(t => t.status === 'Escalado').length,
            resueltos: tickets.filter(t => t.status === 'Resuelto').length,
            cerrados: tickets.filter(t => t.status === 'Cerrado').length,
            vencidos: tickets.filter(t => t.status === 'Vencido').length,
          });
          setRecentTickets(tickets.slice(0, 5));
          setFilteredTickets(tickets.slice(0, 5));
        } else if (isTech) {
          const res = await ticketAPI.get('/ticket/assigned');
          const tickets = res.data;
          setStats({
            total: tickets.length,
            enProceso: tickets.filter(t => t.status === 'En Proceso').length,
            escalados: tickets.filter(t => t.status === 'Escalado').length,
            vencidos: tickets.filter(t => t.status === 'Vencido').length,
          });
          setRecentTickets(tickets.slice(0, 5));
          setFilteredTickets(tickets.slice(0, 5));
        } else {
          const res = await ticketAPI.get(`/ticket/user/${userId}`);
          const tickets = res.data;
          setStats({
            total: tickets.length,
            abiertos: tickets.filter(t => t.status === 'Abierto').length,
            enProceso: tickets.filter(t => t.status === 'En Proceso').length,
            resueltos: tickets.filter(t => t.status === 'Resuelto').length,
            cerrados: tickets.filter(t => t.status === 'Cerrado').length,
          });
          setRecentTickets(tickets.slice(0, 5));
          setFilteredTickets(tickets.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Función para filtrar tickets por búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTickets(recentTickets);
    } else {
      const filtered = recentTickets.filter(ticket => 
        ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.priority?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTickets(filtered);
    }
  }, [searchTerm, recentTickets]);

  const statusColor = (s) => ({
    'Abierto': '#1565c0', 'En Proceso': '#f57f17',
    'Escalado': '#6a1b9a', 'Resuelto': '#2e7d32',
    'Cerrado': '#424242', 'Vencido': '#b71c1c',
  }[s] || '#333');

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <Layout>
      <main style={s.content}>
        {/* Encabezado */}
        <div style={s.welcomeCard}>
          <div>
            <h1 style={s.welcomeTitle}>
              {getGreeting()}, {fullName?.split(' ')[0]} 
            </h1>
            <p style={s.welcomeSub}>
              {isAdmin && 'Panel de administración — visión general del sistema'}
              {isTech && `Panel técnico — ${role}`}
              {!isAdmin && !isTech && 'Bienvenido al Help Desk FISEI · UTA'}
            </p>
          </div>
          {!isAdmin && !isTech && (
            <button style={s.newTicketBtn} onClick={() => navigate('/crear-ticket')}>
              + Nuevo Ticket
            </button>
          )}
          {isTech && (
            <button style={s.newTicketBtn} onClick={() => navigate('/tecnico/panel')}>
               Ver Bandeja
            </button>
          )}
          {isAdmin && (
            <button style={s.newTicketBtn} onClick={() => navigate('/admin/tickets')}>
               Ver Todos los Tickets
            </button>
          )}
        </div>

        {/* Stats - Dashboard diferente según el rol */}
        {!loading && stats && (
          <div style={isAdmin ? s.statsGridAdmin : s.statsGrid}>
            {/* Admin Stats */}
            {isAdmin && (
              <>
                <StatCard label="Total" value={stats.total} color="#4361ee" />
                <StatCard label="Abiertos" value={stats.abiertos} color="#1565c0" />
                <StatCard label="En Proceso" value={stats.enProceso} color="#f57f17" />
                <StatCard label="Escalados" value={stats.escalados} color="#6a1b9a" />
                <StatCard label="Resueltos" value={stats.resueltos} color="#2e7d32" />
                <StatCard label="Cerrados" value={stats.cerrados} color="#424242" />
                {stats.vencidos > 0 && (
                  <StatCard label="Vencidos" value={stats.vencidos} color="#b71c1c" />
                )}
              </>
            )}

            {/* Tech Stats */}
            {isTech && (
              <>
                <StatCard label="Total Asignados" value={stats.total} color="#4361ee" />
                <StatCard label="En Proceso" value={stats.enProceso} color="#f57f17" />
                <StatCard label="Escalados" value={stats.escalados} color="#6a1b9a" />
                {stats.vencidos > 0 && (
                  <StatCard label="Vencidos" value={stats.vencidos} color="#b71c1c" />
                )}
              </>
            )}

            {/* User Stats */}
            {!isAdmin && !isTech && (
              <>
                <StatCard label="Mis Tickets" value={stats.total} color="#4361ee" />
                <StatCard label="Abiertos" value={stats.abiertos} color="#1565c0" />
                <StatCard label="En Proceso" value={stats.enProceso} color="#f57f17" />
                <StatCard label="Resueltos" value={stats.resueltos} color="#2e7d32" />
                <StatCard label="Cerrados" value={stats.cerrados} color="#424242" />
              </>
            )}
          </div>
        )}

        {/* Buscador integrado */}
        <div style={s.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Buscar por número, título, estado o prioridad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={s.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={s.clearBtn}>
              ✕
            </button>
          )}
        </div>

        {/* Tickets recientes con filtro */}
        {!loading && filteredTickets.length > 0 && (
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>
                {isAdmin ? 'Tickets recientes' : isTech ? 'Mis tickets asignados' : 'Mis tickets recientes'}
                {searchTerm && <span style={s.searchBadge}> 🔍 {filteredTickets.length} resultados</span>}
              </h3>
              <button
                style={s.verTodosBtn}
                onClick={() => navigate(isAdmin ? '/admin/tickets' : isTech ? '/tecnico/panel' : '/tickets')}
              >
                Ver todos →
              </button>
            </div>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>N° Ticket</th>
                  <th style={s.th}>Título</th>
                  <th style={s.th}>Estado</th>
                  <th style={s.th}>Prioridad</th>
                  <th style={s.th}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    style={{ ...s.tr, cursor: 'pointer' }}
                    onClick={() => navigate(isTech ? `/tecnico/ticket/${t.id}` : `/tickets/${t.id}`)}
                  >
                    <td style={s.td}><span style={s.tno}>{t.ticketNumber}</span></td>
                    <td style={s.td}>{t.title}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, backgroundColor: statusColor(t.status) }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={s.td}>{t.priority}</td>
                    <td style={s.td}>{new Date(t.createdAt).toLocaleDateString('es-EC')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTickets.length === 0 && searchTerm && (
              <div style={s.noResults}>
                No se encontraron tickets para "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {/* Accesos rápidos */}
        <div style={s.quickGrid}>
          {!isAdmin && !isTech && (
            <>
              <QuickCard icon="🎫" title="Mis Tickets" desc="Ver el estado de tus solicitudes" onClick={() => navigate('/tickets')} />
              <QuickCard icon="➕" title="Nuevo Ticket" desc="Reportar un nuevo problema" onClick={() => navigate('/crear-ticket')} />
              <QuickCard icon="📚" title="Base de Conocimiento" desc="Buscar soluciones documentadas" onClick={() => navigate('/conocimiento')} />
            </>
          )}
          {isTech && (
            <>
              <QuickCard icon="📥" title="Bandeja de Entrada" desc="Ver tickets disponibles y asignados" onClick={() => navigate('/tecnico/panel')} />
              <QuickCard icon="📚" title="Base de Conocimiento" desc="Consultar soluciones anteriores" onClick={() => navigate('/conocimiento')} />
            </>
          )}
          {isAdmin && (
            <>
              <QuickCard icon="👤" title="Usuarios" desc="Gestionar usuarios del sistema" onClick={() => navigate('/admin/usuarios')} />
              <QuickCard icon="📋" title="Seguimiento" desc="Ver todos los tickets" onClick={() => navigate('/admin/tickets')} />
              <QuickCard icon="🔧" title="Asignaciones" desc="Asignar servicios a técnicos" onClick={() => navigate('/admin/asignaciones')} />
              <QuickCard icon="📚" title="Base de Conocimiento" desc="Consultar soluciones" onClick={() => navigate('/conocimiento')} />
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ ...s.statCard, borderTop: `4px solid ${color}` }}>
      <div style={s.statIcon}>{icon}</div>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function QuickCard({ icon, title, desc, onClick }) {
  return (
    <button style={s.quickCard} onClick={onClick}>
      <div style={s.quickIcon}>{icon}</div>
      <div style={s.quickTitle}>{title}</div>
      <div style={s.quickDesc}>{desc}</div>
    </button>
  );
}

const s = {
  content: { padding: '32px', flex: 1 },
  welcomeCard: {
    background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
    borderRadius: 16, padding: '28px 32px', marginBottom: 24,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    color: '#fff',
  },
  welcomeTitle: { fontSize: 26, fontWeight: 700, margin: 0 },
  welcomeSub: { fontSize: 14, opacity: 0.85, marginTop: 6 },
  newTicketBtn: {
    background: '#fff', color: '#4361ee', border: 'none',
    padding: '12px 20px', borderRadius: 10, fontWeight: 700,
    fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  statsGrid: {
    display: 'flex',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statsGridAdmin: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 16px',
    border: '1px solid #eaecf0',
    textAlign: 'center',
    flex: '1 1 160px',
    maxWidth: 200,
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: 600 },
  card: {
    background: '#fff', borderRadius: 16, border: '1px solid #eaecf0',
    padding: 24, marginBottom: 24,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 },
  searchBadge: { fontSize: 12, fontWeight: 'normal', color: '#6b7280', marginLeft: 8 },
  verTodosBtn: {
    background: 'none', border: 'none', color: '#4361ee',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f9fafb' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' },
  tr: { borderBottom: '1px solid #f1f3f5' },
  td: { padding: '14px 16px', fontSize: 13, color: '#344054' },
  tno: { fontWeight: 700, color: '#4361ee' },
  badge: { color: '#fff', padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 700, display: 'inline-block' },
  quickGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
  },
  quickCard: {
    background: '#fff', border: '1px solid #eaecf0', borderRadius: 14,
    padding: '20px 18px', textAlign: 'left', cursor: 'pointer',
    transition: 'all .2s',
  },
  quickIcon: { fontSize: 28, marginBottom: 10 },
  quickTitle: { fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 },
  quickDesc: { fontSize: 12, color: '#6b7280' },
  searchContainer: {
    position: 'relative',
    marginBottom: 24,
    width: '100%',
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 16px',
    fontSize: 14,
    border: '1px solid #eaecf0',
    borderRadius: 12,
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: '#fff',
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: 16,
    padding: '4px 8px',
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: 14,
  },
};

export default Dashboard;