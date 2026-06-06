import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Inbox, Ticket, Search, X, ChevronRight,
  Users, BookOpen, LayoutDashboard, Clock, TrendingUp,
  AlertCircle, CheckCircle, FolderKanban, UserCheck, Calendar,
  BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';
import Layout from '../components/Layout';
import { ticketAPI } from '../services/api';

// Colores unificados
const COLORS = {
  Primario: '#2d6a9f',
  PrimarioOscuro: '#1e3a5f',
  PrimarioLight: '#eef2ff',
  Abierto: '#2d6a9f',
  EnProceso: '#f59e0b',
  Resuelto: '#10b981',
  Cerrado: '#6b7280',
  Escalado: '#8b5cf6',
  Vencido: '#ef4444'
};

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');
  const userId = localStorage.getItem('userId');

  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTickets, setFilteredTickets] = useState([]);

  const isTech = ['TecnicoN1', 'TecnicoN2', 'DITIC', 'Proveedor'].includes(role);
  const isAdmin = role === 'Admin';

  useEffect(() => {
    const loadData = async () => {
      try {
        let tickets = [];
        
        if (isAdmin) {
          const res = await ticketAPI.get('/ticket');
          tickets = res.data;
          setStats({
            total: tickets.length,
            abiertos: tickets.filter(t => t.status === 'Abierto').length,
            enProceso: tickets.filter(t => t.status === 'En Proceso').length,
            escalados: tickets.filter(t => t.status === 'Escalado').length,
            resueltos: tickets.filter(t => t.status === 'Resuelto').length,
            cerrados: tickets.filter(t => t.status === 'Cerrado').length,
            vencidos: tickets.filter(t => t.status === 'Vencido').length,
          });
        } else if (isTech) {
          const res = await ticketAPI.get('/ticket/assigned');
          tickets = res.data;
          setStats({
            total: tickets.length,
            enProceso: tickets.filter(t => t.status === 'En Proceso').length,
            escalados: tickets.filter(t => t.status === 'Escalado').length,
            resueltos: tickets.filter(t => t.status === 'Resuelto').length,
            vencidos: tickets.filter(t => t.status === 'Vencido').length,
          });
        } else {
          const res = await ticketAPI.get(`/ticket/user/${userId}`);
          tickets = res.data;
          setStats({
            total: tickets.length,
            abiertos: tickets.filter(t => t.status === 'Abierto').length,
            enProceso: tickets.filter(t => t.status === 'En Proceso').length,
            resueltos: tickets.filter(t => t.status === 'Resuelto').length,
            cerrados: tickets.filter(t => t.status === 'Cerrado').length,
          });
        }
        
        setRecentTickets(tickets);
        setFilteredTickets(tickets);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin, isTech, userId]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTickets(recentTickets);
    } else {
      const filtered = recentTickets.filter(ticket => 
        ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTickets(filtered);
    }
  }, [searchTerm, recentTickets]);

  const getBarChartData = () => {
    const months = {};
    recentTickets.forEach(ticket => {
      const date = new Date(ticket.createdAt);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      months[monthYear] = (months[monthYear] || 0) + 1;
    });
    return Object.entries(months).map(([name, tickets]) => ({ name, tickets }));
  };

  const getPieChartData = () => {
    if (!stats) return [];
    if (isAdmin) {
      return [
        { name: 'Abiertos', value: stats.abiertos, color: COLORS.Abierto },
        { name: 'En Proceso', value: stats.enProceso, color: COLORS.EnProceso },
        { name: 'Escalados', value: stats.escalados, color: COLORS.Escalado },
        { name: 'Resueltos', value: stats.resueltos, color: COLORS.Resuelto },
        { name: 'Cerrados', value: stats.cerrados, color: COLORS.Cerrado },
      ].filter(d => d.value > 0);
    } else if (isTech) {
      return [
        { name: 'En Proceso', value: stats.enProceso || 0, color: COLORS.EnProceso },
        { name: 'Escalados', value: stats.escalados || 0, color: COLORS.Escalado },
        { name: 'Resueltos', value: stats.resueltos || 0, color: COLORS.Resuelto },
        { name: 'Vencidos', value: stats.vencidos || 0, color: COLORS.Vencido },
      ].filter(d => d.value > 0);
    } else {
      return [
        { name: 'Abiertos', value: stats.abiertos || 0, color: COLORS.Abierto },
        { name: 'En Proceso', value: stats.enProceso || 0, color: COLORS.EnProceso },
        { name: 'Resueltos', value: stats.resueltos || 0, color: COLORS.Resuelto },
        { name: 'Cerrados', value: stats.cerrados || 0, color: COLORS.Cerrado },
      ].filter(d => d.value > 0);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getInitials = () => {
    if (!fullName) return 'U';
    return fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getStatusColor = (status) => COLORS[status] || '#6b7280';
  
  const getStatusBgColor = (status) => ({
    'Abierto': '#eef2ff',
    'En Proceso': '#fffbeb',
    'Escalado': '#f3e8ff',
    'Resuelto': '#ecfdf5',
    'Cerrado': '#f3f4f6',
    'Vencido': '#fef2f2',
  }[status] || '#f3f4f6');

  const getPriorityStyle = (priority) => {
    const colors = {
      'Baja': { bg: '#ecfdf5', color: '#10b981' },
      'Media': { bg: '#fffbeb', color: '#f59e0b' },
      'Alta': { bg: '#fff7ed', color: '#f97316' },
      'Crítica': { bg: '#fef2f2', color: '#ef4444' },
    };
    const style = colors[priority] || colors['Media'];
    return {
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.color,
    };
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: 20,
    padding: '20px 24px',
    border: '1px solid #e4e7eb',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  };

  const StatCard = ({ icon, label, value, color, bg }) => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: color }}>{value}</div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</div>
        </div>
      </div>
    </div>
  );

  const getPanelTitle = () => {
    if (isAdmin) return 'Panel de Administración';
    if (isTech) return 'Panel Técnico';
    return 'Panel de Usuario';
  };

  const getPanelDescription = () => {
    if (isAdmin) return 'Visión general del sistema';
    if (isTech) return 'Tus tickets asignados y estadísticas';
    return 'Tus tickets y actividad reciente';
  };

  const getMainButton = () => {
    if (isTech) {
      return (
        <button style={{
          background: '#fff',
          color: COLORS.Primario,
          border: 'none',
          padding: '12px 24px',
          borderRadius: 40,
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }} onClick={() => navigate('/tecnico/panel')}>
          <Inbox size={18} />
          Ver Bandeja
        </button>
      );
    }
    if (!isAdmin && !isTech) {
      return (
        <button style={{
          background: '#fff',
          color: COLORS.Primario,
          border: 'none',
          padding: '12px 24px',
          borderRadius: 40,
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }} onClick={() => navigate('/crear-ticket')}>
          <Plus size={18} />
          Nuevo Ticket
        </button>
      );
    }
    return null;
  };

  const getStatCards = () => {
    if (isAdmin) {
      return (
        <>
          <StatCard icon={<Ticket size={24} />} label="Total Tickets" value={stats.total} color={COLORS.Primario} bg="#eef2ff" />
          <StatCard icon={<Clock size={24} />} label="Abiertos" value={stats.abiertos} color={COLORS.Abierto} bg="#eef2ff" />
          <StatCard icon={<TrendingUp size={24} />} label="En Proceso" value={stats.enProceso} color={COLORS.EnProceso} bg="#fffbeb" />
          <StatCard icon={<AlertCircle size={24} />} label="Escalados" value={stats.escalados} color={COLORS.Escalado} bg="#f3e8ff" />
          <StatCard icon={<CheckCircle size={24} />} label="Resueltos" value={stats.resueltos} color={COLORS.Resuelto} bg="#ecfdf5" />
          <StatCard icon={<FolderKanban size={24} />} label="Cerrados" value={stats.cerrados} color={COLORS.Cerrado} bg="#f3f4f6" />
        </>
      );
    } else if (isTech) {
      return (
        <>
          <StatCard icon={<Ticket size={24} />} label="Asignados" value={stats.total} color={COLORS.Primario} bg="#eef2ff" />
          <StatCard icon={<TrendingUp size={24} />} label="En Proceso" value={stats.enProceso} color={COLORS.EnProceso} bg="#fffbeb" />
          <StatCard icon={<AlertCircle size={24} />} label="Escalados" value={stats.escalados} color={COLORS.Escalado} bg="#f3e8ff" />
          <StatCard icon={<CheckCircle size={24} />} label="Resueltos" value={stats.resueltos} color={COLORS.Resuelto} bg="#ecfdf5" />
          <StatCard icon={<AlertCircle size={24} />} label="Vencidos" value={stats.vencidos} color={COLORS.Vencido} bg="#fef2f2" />
        </>
      );
    } else {
      return (
        <>
          <StatCard icon={<Ticket size={24} />} label="Mis Tickets" value={stats.total} color={COLORS.Primario} bg="#eef2ff" />
          <StatCard icon={<Clock size={24} />} label="Abiertos" value={stats.abiertos} color={COLORS.Abierto} bg="#eef2ff" />
          <StatCard icon={<TrendingUp size={24} />} label="En Proceso" value={stats.enProceso} color={COLORS.EnProceso} bg="#fffbeb" />
          <StatCard icon={<CheckCircle size={24} />} label="Resueltos" value={stats.resueltos} color={COLORS.Resuelto} bg="#ecfdf5" />
          <StatCard icon={<FolderKanban size={24} />} label="Cerrados" value={stats.cerrados} color={COLORS.Cerrado} bg="#f3f4f6" />
        </>
      );
    }
  };

  return (
    <Layout>
      <div style={{ padding: '28px 32px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
        
        {/* Tarjeta de bienvenida */}
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
          color: '#fff',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 28,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700
              }}>{getInitials()}</div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                  {getGreeting()}, {fullName?.split(' ')[0] || 'Usuario'}
                </h1>
                <p style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
                  {getPanelTitle()} — {getPanelDescription()}
                </p>
              </div>
            </div>
            
            {getMainButton()}
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        {!loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 28 }}>
            {getStatCards()}
          </div>
        )}

        {/* GRÁFICOS */}
        {!loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20, marginBottom: 28 }}>
            
            {/* Gráfico de Barras */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <BarChart3 size={18} color={COLORS.Primario} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Tickets por mes</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={getBarChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="tickets" fill={COLORS.Primario} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Pastel */}
            {getPieChartData().length > 0 && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <PieChartIcon size={18} color={COLORS.Primario} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Distribución por estado</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Buscador */}
        <div style={{ ...cardStyle, marginBottom: 28, padding: '16px 24px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 450 }}>
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar por número, título o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px 12px 44px',
                fontSize: 13,
                border: '1px solid #e4e7eb',
                borderRadius: 40,
                outline: 'none',
                backgroundColor: '#f9fafb',
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.Primario}
              onBlur={(e) => e.target.style.borderColor = '#e4e7eb'}
            />
          </div>
        </div>

        {/* Tabla de tickets recientes */}
        {!loading && filteredTickets.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 28, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LayoutDashboard size={20} color={COLORS.Primario} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
                  {isTech ? 'Mis tickets asignados' : 'Mis tickets recientes'}
                </h3>
              </div>
              <button style={{ background: 'none', border: 'none', color: COLORS.Primario, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => navigate(isTech ? '/tecnico/panel' : '/tickets')}>
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #edf2f7', background: '#f9fafb' }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>N° Ticket</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Título</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Estado</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Prioridad</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.slice(0, 5).map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                        onClick={() => navigate(isTech ? `/tecnico/ticket/${t.id}` : `/tickets/${t.id}`)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '14px 20px', fontSize: 13 }}><span style={{ fontWeight: 700, color: COLORS.Primario, fontFamily: 'monospace' }}>{t.ticketNumber}</span></td>
                      <td style={{ padding: '14px 20px', fontSize: 13 }}>{t.title}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13 }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          backgroundColor: getStatusBgColor(t.status),
                          color: getStatusColor(t.status)
                        }}>{t.status}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13 }}>
                        <span style={getPriorityStyle(t.priority)}>{t.priority}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: '#6b7280' }}>
                        <Calendar size={12} style={{ marginRight: 4, opacity: 0.6, display: 'inline' }} />
                        {formatDate(t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Accesos rápidos según rol */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 16, letterSpacing: 0.5 }}>Accesos rápidos</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {!isAdmin && !isTech && (
              <>
                <QuickCard icon={<Ticket size={28} />} title="Mis Tickets" desc="Ver estado de tus solicitudes" onClick={() => navigate('/tickets')} />
                <QuickCard icon={<Plus size={28} />} title="Nuevo Ticket" desc="Reportar un nuevo problema" onClick={() => navigate('/crear-ticket')} />
                <QuickCard icon={<BookOpen size={28} />} title="Base de Conocimiento" desc="Buscar soluciones documentadas" onClick={() => navigate('/conocimiento')} />
              </>
            )}
            {isTech && (
              <>
                <QuickCard icon={<Inbox size={28} />} title="Bandeja" desc="Ver tickets disponibles" onClick={() => navigate('/tecnico/panel')} />
                <QuickCard icon={<BookOpen size={28} />} title="Conocimiento" desc="Consultar soluciones" onClick={() => navigate('/conocimiento')} />
              </>
            )}
            {isAdmin && (
              <>
                <QuickCard icon={<Users size={28} />} title="Usuarios" desc="Gestionar usuarios" onClick={() => navigate('/admin/usuarios')} />
                <QuickCard icon={<FolderKanban size={28} />} title="Tickets" desc="Ver todos los tickets" onClick={() => navigate('/admin/tickets')} />
                <QuickCard icon={<UserCheck size={28} />} title="Asignaciones" desc="Asignar técnicos" onClick={() => navigate('/admin/asignaciones')} />
                <QuickCard icon={<BookOpen size={28} />} title="Conocimiento" desc="Buscar soluciones" onClick={() => navigate('/conocimiento')} />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Componente QuickCard
function QuickCard({ icon, title, desc, onClick }) {
  return (
    <button style={{
      background: '#fff',
      border: '1px solid #e4e7eb',
      borderRadius: 20,
      padding: '24px 20px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%'
    }} onClick={onClick}>
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d6a9f' }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>{desc}</div>
    </button>
  );
}

export default Dashboard;