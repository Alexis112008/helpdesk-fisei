import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketList from './pages/TicketList';
import UserManagement from './pages/admin/UserManagement';
import ServiceCatalogPage from './pages/admin/ServiceCatalog';
import DamageCatalogPage from './pages/admin/DamageCatalog';
import TechnicianAssignments from './pages/admin/TechnicianAssignments';
import Register from './pages/Register';
import AdminTickets from './pages/admin/AdminTickets';
import Profile from './pages/Profile';

// ----- Sprint 2 -----
import TechnicianPanel from './pages/TechnicianPanel';
import TicketDetailTech from './pages/TicketDetailTech';
import TicketDetailUser from './pages/TicketDetailUser';
import KnowledgeSearch from './pages/KnowledgeSearch';
import { NotificationProvider } from './components/NotificationProvider';

const TECH_ROLES = ['TecnicoN1', 'TecnicoN2', 'DITIC', 'Proveedor'];

function PrivateRoute({ children, adminOnly, techOnly }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/" />;
  if (adminOnly && role !== 'Admin') return <Navigate to="/dashboard" />;
  if (techOnly && !TECH_ROLES.includes(role)) return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />

          <Route path="/tickets" element={
            <PrivateRoute><TicketList /></PrivateRoute>
          } />
          <Route path="/perfil" element={
          <Profile />
          } />
          <Route path="/tickets/:id" element={
            <PrivateRoute><TicketDetailUser /></PrivateRoute>
          } />
          <Route path="/crear-ticket" element={
            <PrivateRoute><CreateTicket /></PrivateRoute>
          } />

          {/* HU5 - Panel del tecnico */}
          <Route path="/tecnico/panel" element={
            <PrivateRoute techOnly><TechnicianPanel /></PrivateRoute>
          } />
          <Route path="/tecnico/ticket/:id" element={
            <PrivateRoute techOnly><TicketDetailTech /></PrivateRoute>
          } />

          {/* HU8 - Base de conocimiento (accesible a todos los autenticados) */}
          <Route path="/conocimiento" element={
            <PrivateRoute><KnowledgeSearch /></PrivateRoute>
          } />

          <Route path="/admin/usuarios" element={
            <PrivateRoute adminOnly><UserManagement /></PrivateRoute>
          } />
          <Route path="/admin/servicios" element={
            <PrivateRoute adminOnly><ServiceCatalogPage /></PrivateRoute>
          } />
          <Route path="/admin/daños" element={
            <PrivateRoute adminOnly><DamageCatalogPage /></PrivateRoute>
          } />
          <Route path="/admin/asignaciones" element={
            <PrivateRoute adminOnly><TechnicianAssignments /></PrivateRoute>
          } />
          <Route path="/admin/tickets" element={
          <PrivateRoute adminOnly><AdminTickets /></PrivateRoute>
          } />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;