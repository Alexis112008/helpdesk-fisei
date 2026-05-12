import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketList from './pages/TicketList';
import UserManagement from './pages/admin/UserManagement';
import ServiceCatalogPage from './pages/admin/ServiceCatalog';
import DamageCatalogPage from './pages/admin/DamageCatalog';
import Register from './pages/Register';

// Debe estar ANTES de function App()
function PrivateRoute({ children, adminOnly }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  if (!token) return <Navigate to="/" />;
  if (adminOnly && role !== 'Admin') return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/tickets" element={
          <PrivateRoute><TicketList /></PrivateRoute>
        } />
        <Route path="/crear-ticket" element={
          <PrivateRoute><CreateTicket /></PrivateRoute>
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
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;