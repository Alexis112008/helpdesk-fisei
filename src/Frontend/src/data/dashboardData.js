export const barData = [
  { day: "Lun", tickets: 12 },
  { day: "Mar", tickets: 19 },
  { day: "Mié", tickets: 14 },
  { day: "Jue", tickets: 22 },
  { day: "Vie", tickets: 18 },
  { day: "Sáb", tickets: 5 },
  { day: "Dom", tickets: 3 },
];

export const pieData = [
  { name: "Abierto", value: 28, color: "#3b82f6" },
  { name: "En Progreso", value: 45, color: "#f59e0b" },
  { name: "Cerrado", value: 89, color: "#10b981" },
  { name: "Escalado", value: 8, color: "#ef4444" },
];

export const navItems = [
  { icon: "⊞", label: "Dashboard" },
  { icon: "👤", label: "Usuarios" },
  { icon: "🗂️", label: "Catálogo de Daños" },
  { icon: "🗄️", label: "Catálogo de Servicios" },
  { icon: "📖", label: "Base de Conocimiento" },
  { icon: "⚙️", label: "Configuración" },
];

export const statCards = [
  {
    icon: "🎫",
    iconClass: "blue",
    badge: "+12%",
    pos: true,
    number: 170,
    label: "Total Tickets",
  },
  {
    icon: "⏰",
    iconClass: "orange",
    badge: "+5%",
    pos: true,
    number: 28,
    label: "Tickets Abiertos",
  },
  {
    icon: "🕐",
    iconClass: "purple",
    badge: "-3%",
    pos: false,
    number: 45,
    label: "En Progreso",
  },
  {
    icon: "✅",
    iconClass: "green",
    badge: "+18%",
    pos: true,
    number: 12,
    label: "Cerrados Hoy",
  },
];