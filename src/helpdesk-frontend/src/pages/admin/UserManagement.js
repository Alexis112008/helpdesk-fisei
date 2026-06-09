import React, { useState, useEffect, useMemo } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  Users,
  Mail,
  Phone,
  FileText,
  Award,
  Building,
  UserCheck,
  UserX,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Shield,
  Lock,
  User,
  RefreshCw
} from 'lucide-react';
import { authAPI } from '../../services/api';
import Layout from '../../components/Layout';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10
  });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    cedula: '',
    department: '',
    specialty: '',
    roleId: '',
    isActive: true,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('pageSize', pagination.pageSize);
      if (search) params.append('search', search);
      if (filterRole) params.append('roleName', filterRole);
      if (filterStatus) params.append('isActive', filterStatus === 'activo' ? 'true' : 'false');

      const response = await authAPI.get(`/user/list?${params}`);
      setUsers(response.data.users);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (err) {
      console.error(err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = () => {
    authAPI.get('/user/roles').then((res) => setRoles(res.data));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        search === '' ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === '' || u.roleName === filterRole;
      const matchStatus =
        filterStatus === '' ||
        (filterStatus === 'activo' && u.isActive) ||
        (filterStatus === 'inactivo' && !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  const clearFilters = () => {
    setSearch('');
    setFilterRole('');
    setFilterStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers();
  };

  const hasFilters = search !== '' || filterRole !== '' || filterStatus !== '';

  const openCreateModal = () => {
    setEditUser(null);
    setForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      cedula: '',
      department: '',
      specialty: '',
      roleId: '',
      isActive: true
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      phone: user.phone || '',
      cedula: user.cedula || '',
      department: user.department || '',
      specialty: user.specialty || '',
      roleId: roles.find((r) => r.name === user.roleName)?.id || '',
      isActive: user.isActive,
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editUser) {
        await authAPI.put(`/user/${editUser.id}`, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          cedula: form.cedula,
          department: form.department,
          specialty: form.specialty,
          roleId: parseInt(form.roleId),
          isActive: form.isActive,
        });
        setSuccess('Usuario actualizado correctamente');
        setTimeout(() => {
          closeModal();
          loadUsers();
        }, 1500);
      } else {
        if (!form.email.endsWith('@uta.edu.ec')) {
          setError('El correo debe ser @uta.edu.ec');
          setSaving(false);
          return;
        }
        await authAPI.post('/user', {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          cedula: form.cedula,
          department: form.department,
          specialty: form.specialty,
          roleId: parseInt(form.roleId),
        });
        setSuccess('Usuario creado correctamente');
        setTimeout(() => {
          closeModal();
          loadUsers();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar usuario');
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario permanentemente? Esta acción no se puede deshacer.')) return;
    try {
      await authAPI.delete(`/user/${id}`);
      setSuccess('Usuario eliminado correctamente');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar usuario');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Admin: '#1a237e',
      TecnicoN1: '#1565c0',
      TecnicoN2: '#0277bd',
      DITIC: '#00695c',
      Proveedor: '#4527a0',
      Usuario: '#558b2f',
    };
    return colors[role] || '#555';
  };

  return (
    <Layout>
      <div className="user-management-page">
        <div className="user-management-header">
          <div>
            <h1 className="user-management-title">
              <Users size={isMobile ? 24 : 28} />
              Gestión de Usuarios
            </h1>
            <p className="user-management-subtitle">Administra usuarios, roles y permisos del sistema</p>
          </div>
          <button className="user-management-create-btn" onClick={openCreateModal}>
            <Plus size={16} />
            Crear Usuario
          </button>
        </div>

        {success && (
          <div className="user-management-success">
            <CheckCircle size={18} />
            {success}
          </div>
        )}
        {error && !showModal && (
          <div className="user-management-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Barra de filtros */}
        <div className="user-management-filters-card">
          <div className="user-management-search-bar">
            <div className="user-management-search-wrapper">
              <Search size={16} className="user-management-search-icon" />
              <input
                className="user-management-search-input"
                placeholder={isMobile ? "Buscar..." : "Buscar por nombre o correo..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              />
              {search && (
                <button className="user-management-clear-search" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="user-management-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} />
              Filtros
            </button>
          </div>

          <div className={`user-management-filters ${showFilters ? 'user-management-filters-open' : ''}`}>
            <div className="user-management-filter-group">
              <label className="user-management-filter-label">Rol</label>
              <select className="user-management-filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="">Todos los roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="user-management-filter-group">
              <label className="user-management-filter-label">Estado</label>
              <select className="user-management-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="user-management-stats">
              <Users size={12} />
              {filteredUsers.length} de {users.length} usuarios
            </div>

            {hasFilters && (
              <button className="user-management-clear-filters" onClick={clearFilters}>
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="user-management-loading">
            <RefreshCw size={24} className="user-management-spinner" />
            <p>Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="user-management-empty">
            <p>{hasFilters ? 'No hay usuarios que coincidan con los filtros.' : 'No hay usuarios registrados.'}</p>
          </div>
        ) : (
          <div className="user-management-table-card">
            <div className="user-management-table-wrapper">
              <table className="user-management-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="user-management-name">
                        <strong>{u.fullName}</strong>
                      </td>
                      <td>
                        <div className="user-management-email-cell">
                          <Mail size={12} />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-management-phone-cell">
                          <Phone size={12} />
                          <span>{u.phone || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="user-management-role-badge" style={{ backgroundColor: getRoleBadgeColor(u.roleName) }}>
                          {u.roleName}
                        </span>
                      </td>
                      <td>
                        <span className="user-management-status-badge" style={{ backgroundColor: u.isActive ? '#2e7d32' : '#c62828' }}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="user-management-date-cell">
                          <Calendar size={12} />
                          <span>{new Date(u.createdAt).toLocaleDateString('es-EC')}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-management-actions">
                          <button onClick={() => openEditModal(u)} className="user-management-edit-btn" title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(u.id)} className="user-management-delete-btn" title="Eliminar">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.total > pagination.pageSize && (
              <div className="user-management-pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="user-management-page-btn"
                >
                  <ChevronLeft size={14} />
                  Anterior
                </button>
                <span className="user-management-page-info">
                  Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  className="user-management-page-btn"
                >
                  Siguiente
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CREAR/EDITAR USUARIO RESPONSIVE */}
      {showModal && (
        <div className="user-management-modal-overlay" onClick={closeModal}>
          <div className="user-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-management-modal-header">
              <div className="user-management-modal-header-icon">
                {editUser ? <Pencil size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
              </div>
              <div className="user-management-modal-header-text">
                <h2>{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <p>{editUser ? 'Modifica la información del usuario' : 'Completa los datos para crear un nuevo usuario'}</p>
              </div>
              <button className="user-management-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="user-management-modal-body">
                {error && (
                  <div className="user-management-modal-error">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="user-management-modal-field">
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div className="user-management-modal-field">
                  <label>Correo institucional *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="usuario@uta.edu.ec"
                    required
                  />
                </div>

                {!editUser && (
                  <div className="user-management-modal-field">
                    <label>Contraseña *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <div className="user-management-modal-field">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0987654321"
                  />
                </div>

                <div className="user-management-modal-field">
                  <label>Cédula</label>
                  <input
                    type="text"
                    value={form.cedula}
                    onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                    placeholder="1804567890"
                    maxLength={10}
                  />
                </div>

                <div className="user-management-modal-field">
                  <label>Departamento / Facultad</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="FISEI, Rectorado, DITIC..."
                  />
                </div>

                <div className="user-management-modal-field">
                  <label>Especialidad</label>
                  <input
                    type="text"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    placeholder="Solo para técnicos: Redes, Hardware, Software..."
                  />
                </div>

                <div className="user-management-modal-field">
                  <label>Rol *</label>
                  <select
                    value={form.roleId}
                    onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                    required
                  >
                    <option value="">-- Selecciona un rol --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {editUser && (
                  <div className="user-management-modal-field">
                    <label>Estado</label>
                    <div className="user-management-toggle-group">
                      <button
                        type="button"
                        className={`user-management-toggle-btn ${form.isActive ? 'user-management-toggle-active' : ''}`}
                        onClick={() => setForm({ ...form, isActive: true })}
                      >
                        <UserCheck size={14} />
                        Activo
                      </button>
                      <button
                        type="button"
                        className={`user-management-toggle-btn ${!form.isActive ? 'user-management-toggle-active' : ''}`}
                        onClick={() => setForm({ ...form, isActive: false })}
                      >
                        <UserX size={14} />
                        Inactivo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-management-modal-footer">
                <button type="button" className="user-management-modal-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="user-management-modal-save" disabled={saving}>
                  {saving ? 'Guardando...' : (editUser ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .user-management-page {
          padding: 28px 32px;
          flex: 1;
          background-color: #f5f7fa;
          min-height: 100vh;
        }

        .user-management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .user-management-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-management-subtitle {
          font-size: 13px;
          color: #6b7280;
        }

        .user-management-create-btn {
          background-color: #4361ee;
          color: #fff;
          border: none;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .user-management-create-btn:hover {
          background-color: #304ffe;
          transform: translateY(-1px);
        }

        .user-management-success {
          background-color: #ecfdf3;
          color: #027a48;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-management-error {
          background-color: #fef3f2;
          color: #b42318;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-management-filters-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          padding: 16px 20px;
          margin-bottom: 24px;
        }

        .user-management-search-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .user-management-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .user-management-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .user-management-search-input {
          width: 100%;
          padding: 10px 16px 10px 38px;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
          font-size: 14px;
          outline: none;
          background: #f9fafb;
        }

        .user-management-search-input:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .user-management-clear-search {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
        }

        .user-management-filter-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #f9fafb;
          border: 1px solid #eaecf0;
          border-radius: 10px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .user-management-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 16px;
        }

        .user-management-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }

        .user-management-filter-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .user-management-filter-select {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d0d5dd;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
        }

        .user-management-filter-select:focus {
          border-color: #4361ee;
          outline: none;
        }

        .user-management-stats {
          font-size: 13px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f9fafb;
          padding: 8px 14px;
          border-radius: 10px;
          margin-left: auto;
        }

        .user-management-clear-filters {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .user-management-clear-filters:hover {
          background: #fee2e2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .user-management-table-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          overflow: hidden;
        }

        .user-management-table-wrapper {
          overflow-x: auto;
        }

        .user-management-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        .user-management-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #667085;
          background: #f9fafb;
          border-bottom: 1px solid #eaecf0;
        }

        .user-management-table td {
          padding: 18px 20px;
          font-size: 14px;
          color: #344054;
          border-bottom: 1px solid #f1f3f5;
        }

        .user-management-table tr:hover td {
          background-color: #f9fafb;
        }

        .user-management-name {
          font-weight: 600;
        }

        .user-management-email-cell, .user-management-phone-cell, .user-management-date-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-management-role-badge {
          color: #fff;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .user-management-status-badge {
          color: #fff;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .user-management-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .user-management-edit-btn, .user-management-delete-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-management-edit-btn:hover {
          background: #eef2ff;
          color: #4361ee;
        }

        .user-management-delete-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .user-management-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-top: 1px solid #eaecf0;
          flex-wrap: wrap;
        }

        .user-management-page-btn {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .user-management-page-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .user-management-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .user-management-page-info {
          font-size: 13px;
          color: #344054;
        }

        .user-management-loading, .user-management-empty {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .user-management-spinner {
          animation: spin 1s linear infinite;
        }

        /* Modal Responsive */
        .user-management-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .user-management-modal {
          background: #fff;
          border-radius: 24px;
          width: 100%;
          max-width: 680px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .user-management-modal-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          position: sticky;
          top: 0;
        }

        .user-management-modal-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-management-modal-header-text {
          flex: 1;
        }

        .user-management-modal-header-text h2 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .user-management-modal-header-text p {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          margin-top: 4px;
        }

        .user-management-modal-close {
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 20px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          transition: background 0.2s;
        }

        .user-management-modal-close:hover {
          background: rgba(255,255,255,0.3);
        }

        .user-management-modal-body {
          padding: 24px;
        }

        .user-management-modal-field {
          margin-bottom: 20px;
        }

        .user-management-modal-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .user-management-modal-field input,
        .user-management-modal-field select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border 0.2s, box-shadow 0.2s;
        }

        .user-management-modal-field input:focus,
        .user-management-modal-field select:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .user-management-modal-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-management-toggle-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .user-management-toggle-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #fff;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .user-management-toggle-active {
          background-color: #4361ee;
          color: #fff;
          border-color: #4361ee;
        }

        .user-management-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #eaecf0;
          background: #f9fafb;
          border-bottom-left-radius: 24px;
          border-bottom-right-radius: 24px;
          position: sticky;
          bottom: 0;
        }

        .user-management-modal-cancel {
          padding: 10px 20px;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-management-modal-cancel:hover {
          background: #f3f4f6;
        }

        .user-management-modal-save {
          padding: 10px 24px;
          background: #4361ee;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-management-modal-save:hover {
          background: #304ffe;
          transform: translateY(-1px);
        }

        .user-management-modal-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .user-management-page {
            padding: 70px 12px 20px 12px;
          }

          .user-management-title {
            font-size: 22px;
          }

          .user-management-subtitle {
            font-size: 11px;
          }

          .user-management-filter-toggle {
            display: flex;
          }

          .user-management-filters {
            display: none;
            flex-direction: column;
            width: 100%;
          }

          .user-management-filters-open {
            display: flex;
          }

          .user-management-filter-group {
            width: 100%;
          }

          .user-management-filter-select {
            width: 100%;
          }

          .user-management-stats {
            margin-left: 0;
            justify-content: center;
            width: 100%;
          }

          .user-management-clear-filters {
            width: 100%;
            justify-content: center;
          }

          .user-management-pagination {
            flex-direction: column;
            gap: 12px;
          }

          .user-management-actions {
            justify-content: center;
          }

          .user-management-modal {
            max-width: 95%;
          }

          .user-management-modal-header {
            padding: 16px 20px;
          }

          .user-management-modal-header-icon {
            width: 40px;
            height: 40px;
          }

          .user-management-modal-header-text h2 {
            font-size: 16px;
          }

          .user-management-modal-body {
            padding: 20px;
          }

          .user-management-modal-footer {
            flex-direction: column;
          }

          .user-management-modal-cancel,
          .user-management-modal-save {
            width: 100%;
            text-align: center;
          }

          .user-management-toggle-group {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}

export default UserManagement;