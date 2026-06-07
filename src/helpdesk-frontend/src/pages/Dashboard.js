import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Inbox, Ticket, Search, X, ChevronRight,
  Users, BookOpen, LayoutDashboard, Clock, TrendingUp,
  AlertCircle, CheckCircle, FolderKanban, UserCheck, Calendar,
  BarChart3, PieChart as PieChartIcon, Zap, Award, Target,
  Watch, Activity, ThumbsUp, Star, Flag, ListChecks, Download, FileText, FileSpreadsheet,
  Gauge, Timer, Rocket, UserPlus, UserMinus, Brain, Cpu
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend, LineChart, Line,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import Layout from '../components/Layout';
import { ticketAPI, authAPI } from '../services/api';
import { getConnection, joinTechnicianGroup, joinUserGroup } from '../services/realtime';
import { exportTickets, exportStatistics } from '../services/exportService';

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
  Vencido: '#ef4444',
  Info: '#3b82f6'
};

// Colores para gráficos
const CHART_COLORS = ['#2d6a9f', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6b7280'];

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');
  const userId = parseInt(localStorage.getItem('userId') || '0');

  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // 👇 NUEVOS ESTADOS PARA FILTROS
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const [performance, setPerformance] = useState({
    avgResponseTime: 0,
    avgResolutionTime: 0,
    efficiency: 0,
    overdue: 0,
    satisfaction: 0,
    monthlyProgress: 0,
    totalTechnicians: 0,
    activeTechnicians: 0,
    ticketsPerTechnician: 0,
    slaCompliance: 0,
    resolutionRate: 0
  });
  const [ticketsByPriority, setTicketsByPriority] = useState([]);
  const [ticketsByTechnician, setTicketsByTechnician] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  const isTech = ['TecnicoN1', 'TecnicoN2', 'DITIC', 'Proveedor'].includes(role);
  const isAdmin = role === 'Admin';

  // Limpiar filtros
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedTechnician('');
    loadData(); // Recargar datos sin filtros
  };

  const hasFilters = startDate !== '' || endDate !== '' || selectedTechnician !== '';

  // Obtener lista de técnicos (solo admin)
  const loadTechnicians = useCallback(async () => {
    if (!isAdmin) return;
    try {
      // ✅ Usar el endpoint existente /user/list
      const res = await authAPI.get('/user/list', {
        params: { page: 1, pageSize: 100 } // Traer muchos usuarios
      });

      // La respuesta viene en res.data.users
      const usersList = res.data.users || [];

      const techs = usersList.filter(u =>
        ['TecnicoN1', 'TecnicoN2', 'DITIC', 'Proveedor'].includes(u.roleName)
      );

      setTechnicians(techs);
      setPerformance(prev => ({
        ...prev,
        totalTechnicians: techs.length,
        activeTechnicians: techs.filter(t => t.isActive !== false).length
      }));
    } catch (err) {
      console.error('Error cargando técnicos:', err);
      // No mostrar error en UI para no molestar al usuario
    }
  }, [isAdmin]);

  // Calcular tickets por técnico
  const calculateTicketsByTechnician = useCallback(async (tickets) => {
    const techMap = new Map();
    tickets.forEach(ticket => {
      if (ticket.assignedTechnicianId) {
        const count = techMap.get(ticket.assignedTechnicianId) || 0;
        techMap.set(ticket.assignedTechnicianId, count + 1);
      }
    });

    const data = Array.from(techMap.entries())
      .map(([id, count]) => ({ technicianId: id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const enrichedData = await Promise.all(data.map(async (item) => {
      try {
        const res = await authAPI.get(`/user/${item.technicianId}`);
        return {
          name: res.data.fullName?.split(' ')[0] || `Técnico ${item.technicianId}`,
          tickets: item.count,
          fullName: res.data.fullName
        };
      } catch {
        return {
          name: `Técnico ${item.technicianId}`,
          tickets: item.count
        };
      }
    }));

    setTicketsByTechnician(enrichedData);
  }, []);

  // Calcular tendencia semanal mejorada
  const calculateWeeklyTrend = useCallback((tickets) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const created = new Array(7).fill(0);
    const closed = new Array(7).fill(0);
    const resolved = new Array(7).fill(0);

    tickets.forEach(ticket => {
      const createdDate = new Date(ticket.createdAt);
      const dayIdx = createdDate.getDay() === 0 ? 6 : createdDate.getDay() - 1;
      created[dayIdx]++;

      if (ticket.status === 'Cerrado') {
        const closedDate = new Date(ticket.updatedAt);
        const closeDayIdx = closedDate.getDay() === 0 ? 6 : closedDate.getDay() - 1;
        closed[closeDayIdx]++;
      }

      if (ticket.status === 'Resuelto' || ticket.status === 'Cerrado') {
        const resolvedDate = new Date(ticket.updatedAt);
        const resolvedDayIdx = resolvedDate.getDay() === 0 ? 6 : resolvedDate.getDay() - 1;
        resolved[resolvedDayIdx]++;
      }
    });

    setWeeklyTrend(days.map((day, i) => ({
      day,
      creados: created[i],
      cerrados: closed[i],
      resueltos: resolved[i]
    })));
  }, []);

  // Calcular métricas avanzadas para admin
  const calculateAdminMetrics = useCallback((tickets) => {
    if (!tickets || tickets.length === 0) return;

    const resolvedClosed = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado').length;
    const resolutionRate = Math.round((resolvedClosed / tickets.length) * 100);

    let slaCompliant = 0;
    let totalResolved = 0;
    tickets.forEach(ticket => {
      if (ticket.status === 'Resuelto' || ticket.status === 'Cerrado') {
        totalResolved++;
        const created = new Date(ticket.createdAt);
        const resolved = new Date(ticket.updatedAt);
        const hoursToResolve = (resolved - created) / (1000 * 60 * 60);
        if (hoursToResolve <= 48) {
          slaCompliant++;
        }
      }
    });
    const slaCompliance = totalResolved > 0 ? Math.round((slaCompliant / totalResolved) * 100) : 0;

    const assignedTickets = tickets.filter(t => t.assignedTechnicianId).length;
    const ticketsPerTechnician = performance.totalTechnicians > 0
      ? (assignedTickets / performance.totalTechnicians).toFixed(1)
      : 0;

    setPerformance(prev => ({
      ...prev,
      resolutionRate,
      slaCompliance,
      ticketsPerTechnician
    }));
  }, [performance.totalTechnicians]);

  // Calcular métricas de rendimiento
  const calculatePerformance = useCallback((tickets, statsData) => {
    if (!tickets || tickets.length === 0) {
      setPerformance(prev => ({
        ...prev,
        avgResponseTime: 0,
        avgResolutionTime: 0,
        efficiency: 0,
        overdue: 0,
        monthlyProgress: 0
      }));
      return;
    }

    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseCount = 0;
    let resolutionCount = 0;
    let overdueCount = 0;

    tickets.forEach(ticket => {
      if (ticket.actions && ticket.actions.length > 0) {
        const firstTechAction = ticket.actions.find(a => a.userId === userId);
        if (firstTechAction) {
          const created = new Date(ticket.createdAt);
          const responded = new Date(firstTechAction.createdAt);
          const responseHours = (responded - created) / (1000 * 60 * 60);
          if (responseHours > 0 && responseHours < 168) {
            totalResponseTime += responseHours;
            responseCount++;
          }
        }
      }

      if (ticket.status === 'Cerrado') {
        const created = new Date(ticket.createdAt);
        const closed = new Date(ticket.updatedAt);
        const resolutionHours = (closed - created) / (1000 * 60 * 60);
        if (resolutionHours > 0 && resolutionHours < 720) {
          totalResolutionTime += resolutionHours;
          resolutionCount++;
        }
      }

      if (ticket.status !== 'Cerrado' && ticket.status !== 'Resuelto') {
        const created = new Date(ticket.createdAt);
        const hoursSinceCreation = (new Date() - created) / (1000 * 60 * 60);
        if (hoursSinceCreation > 48) {
          overdueCount++;
        }
      }
    });

    const currentMonth = new Date().getMonth();
    const currentMonthTickets = tickets.filter(t => new Date(t.createdAt).getMonth() === currentMonth).length;
    const previousMonthTickets = tickets.filter(t => new Date(t.createdAt).getMonth() === currentMonth - 1).length;
    const monthlyProgress = previousMonthTickets > 0
      ? Math.round(((currentMonthTickets - previousMonthTickets) / previousMonthTickets) * 100)
      : currentMonthTickets > 0 ? 100 : 0;

    setPerformance(prev => ({
      ...prev,
      avgResponseTime: responseCount > 0 ? (totalResponseTime / responseCount).toFixed(1) : 0,
      avgResolutionTime: resolutionCount > 0 ? (totalResolutionTime / resolutionCount).toFixed(1) : 0,
      efficiency: statsData?.total > 0 ? Math.round((statsData.cerrados / statsData.total) * 100) : 0,
      overdue: overdueCount,
      monthlyProgress: monthlyProgress
    }));
  }, [userId]);

  // Calcular tickets por prioridad
  const getTicketsByPriority = (tickets) => {
    const priorities = ['Crítica', 'Alta', 'Media', 'Baja'];
    return priorities.map(p => ({
      name: p,
      value: tickets.filter(t => t.priority === p).length,
      color: p === 'Crítica' ? '#ef4444' : p === 'Alta' ? '#f97316' : p === 'Media' ? '#f59e0b' : '#10b981'
    })).filter(d => d.value > 0);
  };

  // Obtener datos para gráfico de tendencia mensual
  const getMonthlyTrendData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 6; i++) {
      const monthIndex = (new Date().getMonth() - i + 12) % 12;
      const monthName = months[monthIndex];
      const monthTickets = recentTickets.filter(t => {
        const date = new Date(t.createdAt);
        return date.getMonth() === monthIndex && date.getFullYear() === currentYear;
      }).length;
      const closedTickets = recentTickets.filter(t => {
        const date = new Date(t.createdAt);
        return t.status === 'Cerrado' && date.getMonth() === monthIndex && date.getFullYear() === currentYear;
      }).length;
      const resolvedTickets = recentTickets.filter(t => {
        const date = new Date(t.createdAt);
        return (t.status === 'Resuelto' || t.status === 'Cerrado') && date.getMonth() === monthIndex && date.getFullYear() === currentYear;
      }).length;

      data.unshift({ month: monthName, creados: monthTickets, cerrados: closedTickets, resueltos: resolvedTickets });
    }

    return data;
  };

  const loadData = useCallback(async () => {
    try {
      let tickets = [];
      let ticketsWithActions = [];

      if (isAdmin) {
        // 👇 CONSTRUIR URL CON FILTROS
        let url = '/ticket';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedTechnician) params.append('technicianId', selectedTechnician);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await ticketAPI.get(url);
        tickets = res.data;

        // Cargar acciones para métricas de rendimiento
        const detailedTickets = await Promise.all(
          tickets.slice(0, 50).map(async (t) => {
            try {
              const detail = await ticketAPI.get(`/ticket/${t.id}/detail`);
              return { ...t, actions: detail.data.actions || [] };
            } catch {
              return { ...t, actions: [] };
            }
          })
        );
        ticketsWithActions = detailedTickets;

        setStats({
          total: tickets.length,
          abiertos: tickets.filter(t => t.status === 'Abierto').length,
          enProceso: tickets.filter(t => t.status === 'En Proceso').length,
          escalados: tickets.filter(t => t.status === 'Escalado').length,
          resueltos: tickets.filter(t => t.status === 'Resuelto').length,
          cerrados: tickets.filter(t => t.status === 'Cerrado').length,
          vencidos: tickets.filter(t => t.status === 'Vencido').length,
        });

        setTicketsByPriority(getTicketsByPriority(tickets));
        calculatePerformance(ticketsWithActions, {
          total: tickets.length,
          cerrados: tickets.filter(t => t.status === 'Cerrado').length
        });
        calculateWeeklyTrend(tickets);
        calculateAdminMetrics(tickets);
        await loadTechnicians();

        // Calcular tickets por técnico después de tener técnicos
        const techMap = new Map();
        tickets.forEach(ticket => {
          if (ticket.assignedTechnicianId) {
            const count = techMap.get(ticket.assignedTechnicianId) || 0;
            techMap.set(ticket.assignedTechnicianId, count + 1);
          }
        });

        const techData = await Promise.all(
          Array.from(techMap.entries())
            .map(async ([id, count]) => {
              try {
                const res = await authAPI.get(`/user/${id}`);
                return {
                  name: res.data.fullName?.split(' ')[0] || `Técnico ${id}`,
                  tickets: count,
                  fullName: res.data.fullName
                };
              } catch {
                return { name: `Técnico ${id}`, tickets: count };
              }
            })
        );
        setTicketsByTechnician(techData.sort((a, b) => b.tickets - a.tickets).slice(0, 5));

      } else if (isTech) {
        const res = await ticketAPI.get('/ticket/assigned');
        tickets = res.data;

        const detailedTickets = await Promise.all(
          tickets.map(async (t) => {
            try {
              const detail = await ticketAPI.get(`/ticket/${t.id}/detail`);
              return { ...t, actions: detail.data.actions || [] };
            } catch {
              return { ...t, actions: [] };
            }
          })
        );
        ticketsWithActions = detailedTickets;

        setStats({
          total: tickets.length,
          enProceso: tickets.filter(t => t.status === 'En Proceso').length,
          escalados: tickets.filter(t => t.status === 'Escalado').length,
          resueltos: tickets.filter(t => t.status === 'Resuelto').length,
          cerrados: tickets.filter(t => t.status === 'Cerrado').length,
          vencidos: tickets.filter(t => t.status === 'Vencido').length,
        });

        setTicketsByPriority(getTicketsByPriority(tickets));
        calculatePerformance(ticketsWithActions, {
          total: tickets.length,
          cerrados: tickets.filter(t => t.status === 'Cerrado').length
        });
        calculateWeeklyTrend(tickets);
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
  }, [isAdmin, isTech, userId, calculatePerformance, calculateWeeklyTrend, calculateAdminMetrics, loadTechnicians, startDate, endDate, selectedTechnician]);

  // SignalR para tiempo real
  useEffect(() => {
    if (!isTech) return;

    let conn;
    (async () => {
      try {
        conn = await getConnection();
        await joinUserGroup(userId);
        await joinTechnicianGroup(userId);

        conn.on('ticket-updated', () => {
          loadData();
        });
        conn.on('ticket-closed', () => {
          loadData();
        });
        conn.on('ticket-assigned', () => {
          loadData();
        });
      } catch (err) {
        console.error('Error SignalR:', err);
      }
    })();

    return () => {
      if (conn) {
        conn.off('ticket-updated', loadData);
        conn.off('ticket-closed', loadData);
        conn.off('ticket-assigned', loadData);
      }
    };
  }, [isTech, userId, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        { name: 'Cerrados', value: stats.cerrados || 0, color: COLORS.Cerrado },
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
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  const StatCard = ({ icon, label, value, color, bg, trend, trendValue, suffix = '' }) => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: color }}>{value}{suffix}</div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</div>
          {trend && (
            <div style={{ fontSize: 10, color: trendValue >= 0 ? '#10b981' : '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              {trendValue >= 0 ? <TrendingUp size={10} /> : <TrendingUp size={10} style={{ transform: 'rotate(180deg)' }} />}
              {Math.abs(trendValue)}% vs mes anterior
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getPanelTitle = () => {
    if (isAdmin) return 'Panel de Administración';
    if (isTech) return 'Panel Técnico Profesional';
    return 'Panel de Usuario';
  };

  const getPanelDescription = () => {
    if (isAdmin) return 'Visión gerencial del sistema | Métricas clave y rendimiento';
    if (isTech) return 'Métricas de rendimiento y tickets asignados';
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
          <StatCard icon={<Ticket size={24} />} label="Asignados" value={stats.total} color={COLORS.Primario} bg="#eef2ff" trend={true} trendValue={performance.monthlyProgress} />
          <StatCard icon={<TrendingUp size={24} />} label="En Proceso" value={stats.enProceso} color={COLORS.EnProceso} bg="#fffbeb" />
          <StatCard icon={<AlertCircle size={24} />} label="Escalados" value={stats.escalados} color={COLORS.Escalado} bg="#f3e8ff" />
          <StatCard icon={<CheckCircle size={24} />} label="Resueltos" value={stats.resueltos} color={COLORS.Resuelto} bg="#ecfdf5" />
          <StatCard icon={<FolderKanban size={24} />} label="Cerrados" value={stats.cerrados} color={COLORS.Cerrado} bg="#f3f4f6" />
          <StatCard icon={<Flag size={24} />} label="SLA Cumplimiento" value={`${performance.slaCompliance || 0}%`} color={performance.slaCompliance >= 80 ? COLORS.Resuelto : COLORS.Vencido} bg="#ecfdf5" />
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

  // Funciones de exportación
  const handleExportExcel = () => {
    const ticketsToExport = filteredTickets.length > 0 ? filteredTickets : recentTickets;
    exportTickets(ticketsToExport, 'excel', isTech ? 'tech' : (isAdmin ? 'admin' : 'user'));
  };

  const handleExportPDF = () => {
    const ticketsToExport = filteredTickets.length > 0 ? filteredTickets : recentTickets;
    exportTickets(ticketsToExport, 'pdf', isTech ? 'tech' : (isAdmin ? 'admin' : 'user'));
  };

  const handleExportStats = () => {
    if (stats) {
      exportStatistics(stats, null, 'excel');
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

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleExportExcel} style={styles.exportBtnExcel} title="Exportar a Excel">
                <FileSpreadsheet size={16} style={{ marginRight: 6 }} />
                Excel
              </button>
              <button onClick={handleExportPDF} style={styles.exportBtnPDF} title="Exportar a PDF">
                <FileText size={16} style={{ marginRight: 6 }} />
                PDF
              </button>
              {isAdmin && (
                <button onClick={handleExportStats} style={styles.exportBtnStats} title="Exportar estadísticas">
                  <BarChart3 size={16} style={{ marginRight: 6 }} />
                  Estadísticas
                </button>
              )}
              {getMainButton()}
            </div>
          </div>
        </div>

        {/* 👇 NUEVA SECCIÓN: FILTROS DE FECHA Y TÉCNICO (solo admin) */}
        {isAdmin && !loading && (
          <div style={{ ...cardStyle, marginBottom: 28 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Fecha desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Fecha hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Técnico</label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, minWidth: 150, background: '#fff' }}
                >
                  <option value="">Todos los técnicos</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.fullName}</option>
                  ))}
                </select>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tarjetas de métricas de rendimiento (solo admin) */}
        {isAdmin && !loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gauge size={24} color={COLORS.Primario} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.Primario }}>{performance.resolutionRate || 0}%</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tasa de resolución</div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Timer size={24} color={COLORS.Resuelto} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.Resuelto }}>{performance.slaCompliance || 0}%</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>SLA (&lt;48h)</div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} color={COLORS.EnProceso} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.EnProceso }}>{performance.ticketsPerTechnician}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tickets por técnico</div>
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle, borderTop: `3px solid ${performance.overdue > 0 ? COLORS.Vencido : COLORS.Resuelto}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: performance.overdue > 0 ? '#fef2f2' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={24} color={performance.overdue > 0 ? COLORS.Vencido : COLORS.Cerrado} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: performance.overdue > 0 ? COLORS.Vencido : COLORS.Cerrado }}>{performance.overdue || 0}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tickets vencidos (&gt;48h)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tarjetas de métricas de rendimiento (solo técnico) */}
        {isTech && !loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Watch size={24} color={COLORS.Primario} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.Primario }}>{performance.avgResponseTime}h</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tiempo promedio respuesta</div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={24} color={COLORS.Resuelto} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.Resuelto }}>{performance.avgResolutionTime}h</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tiempo promedio resolución</div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} color={COLORS.EnProceso} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.EnProceso }}>{performance.efficiency}%</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Eficiencia (cerrados/asignados)</div>
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle, borderTop: `3px solid ${performance.overdue > 0 ? COLORS.Vencido : COLORS.Resuelto}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: performance.overdue > 0 ? '#fef2f2' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={24} color={performance.overdue > 0 ? COLORS.Vencido : COLORS.Cerrado} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: performance.overdue > 0 ? COLORS.Vencido : COLORS.Cerrado }}>{performance.overdue}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tickets vencidos (&gt;48h)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tarjetas de estadísticas generales */}
        {!loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 28 }}>
            {getStatCards()}
          </div>
        )}

        {/* GRÁFICOS */}
        {!loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20, marginBottom: 28 }}>

            {/* Gráfico de Barras - Tickets por mes */}
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

            {/* Gráfico de Pastel - Distribución por estado */}
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

        {/* Gráficos específicos para técnico */}
        {isTech && !loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20, marginBottom: 28 }}>

            {/* Tendencia de cierres semanal */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Activity size={18} color={COLORS.Primario} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Tendencia semanal</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="creados" fill={COLORS.Primario} radius={[4, 4, 0, 0]} name="Creados" />
                  <Bar dataKey="cerrados" fill={COLORS.Resuelto} radius={[4, 4, 0, 0]} name="Cerrados" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribución por prioridad */}
            {ticketsByPriority.length > 0 && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <ListChecks size={18} color={COLORS.Primario} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Distribución por prioridad</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={ticketsByPriority}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {ticketsByPriority.map((entry, index) => (
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

        {/* Gráficos específicos para admin */}
        {isAdmin && !loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20, marginBottom: 28 }}>

            {/* Tickets por técnico */}
            {ticketsByTechnician.length > 0 && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <Users size={18} color={COLORS.Primario} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Tickets por técnico (Top 5)</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ticketsByTechnician} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={11} width={80} />
                    <Tooltip />
                    <Bar dataKey="tickets" fill={COLORS.Primario} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tendencia de resolución mensual */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <AreaChart size={18} color={COLORS.Primario} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Tendencia de resolución (últimos 6 meses)</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={getMonthlyTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="creados" stackId="1" stroke={COLORS.Primario} fill={COLORS.PrimarioLight} name="Creados" />
                  <Area type="monotone" dataKey="resueltos" stackId="2" stroke={COLORS.Resuelto} fill={COLORS.Resuelto + '40'} name="Resueltos" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tendencia mensual (solo técnico) */}
        {isTech && !loading && (
          <div style={{ ...cardStyle, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <AreaChart size={18} color={COLORS.Primario} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Tendencia mensual (últimos 6 meses)</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={getMonthlyTrendData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="creados" stackId="1" stroke={COLORS.Primario} fill={COLORS.PrimarioLight} name="Creados" />
                <Area type="monotone" dataKey="cerrados" stackId="2" stroke={COLORS.Resuelto} fill={COLORS.Resuelto + '40'} name="Cerrados" />
              </AreaChart>
            </ResponsiveContainer>
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
                  {isTech ? 'Mis tickets asignados' : isAdmin ? 'Tickets recientes del sistema' : 'Mis tickets recientes'}
                </h3>
              </div>
              <button style={{ background: 'none', border: 'none', color: COLORS.Primario, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => navigate(isTech ? '/tecnico/panel' : isAdmin ? '/admin/tickets' : '/tickets')}>
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
                <QuickCard icon={<BarChart3 size={28} />} title="Mi Rendimiento" desc="Ver métricas detalladas" onClick={() => navigate('/tecnico/rendimiento')} />
              </>
            )}
            {isAdmin && (
              <>
                <QuickCard icon={<Users size={28} />} title="Usuarios" desc="Gestionar usuarios" onClick={() => navigate('/admin/usuarios')} />
                <QuickCard icon={<FolderKanban size={28} />} title="Tickets" desc="Ver todos los tickets" onClick={() => navigate('/admin/tickets')} />
                <QuickCard icon={<UserCheck size={28} />} title="Asignaciones" desc="Asignar técnicos" onClick={() => navigate('/admin/asignaciones')} />
                <QuickCard icon={<BookOpen size={28} />} title="Conocimiento" desc="Buscar soluciones" onClick={() => navigate('/conocimiento')} />
                <QuickCard icon={<BarChart3 size={28} />} title="Reportes" desc="Ver reportes detallados" onClick={() => navigate('/admin/reportes')} />
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
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      onClick={onClick}>
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d6a9f' }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>{desc}</div>
    </button>
  );
}

// Estilos para botones de exportación
const styles = {
  exportBtnExcel: {
    background: '#fff',
    border: '1px solid #10b981',
    color: '#10b981',
    padding: '10px 18px',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  exportBtnPDF: {
    background: '#fff',
    border: '1px solid #ef4444',
    color: '#ef4444',
    padding: '10px 18px',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  exportBtnStats: {
    background: '#fff',
    border: '1px solid #f59e0b',
    color: '#f59e0b',
    padding: '10px 18px',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
};

export default Dashboard;