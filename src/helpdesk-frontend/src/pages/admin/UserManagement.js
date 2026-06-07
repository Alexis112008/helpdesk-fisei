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

  // Filtros locales
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

  // Filtrado reactivo local
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

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Shield size={12} style={{ marginRight: 4 }} />;
      default: return <Users size={12} style={{ marginRight: 4 }} />;
    }
  };

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>
              <Users size={28} style={{ marginRight: 12, color: '#4361ee', verticalAlign: 'middle' }} />
              Gestión de Usuarios
            </h1>
            <p style={s.subtitle}>Administra usuarios, roles y permisos del sistema</p>
          </div>
          <button style={s.actionBtn} onClick={openCreateModal}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Crear Usuario
          </button>
        </div>

        {success && (
          <div style={s.success}>
            <CheckCircle size={18} style={{ marginRight: 10 }} />
            {success}
          </div>
        )}
        {error && !showModal && (
          <div style={s.error}>
            <AlertCircle size={18} style={{ marginRight: 10 }} />
            {error}
          </div>
        )}

        {/* Barra de filtros - ÚNICA */}
        <div style={s.filtersBar}>
          <div style={s.searchWrapper}>
            <Search size={15} color="#9ca3af" style={s.searchIcon} />
            <input
              style={s.searchInput}
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={s.filterWrapper}>
            <Shield size={14} color="#6b7280" style={s.filterIcon} />
            <select
              style={s.filterSelect}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Todos los roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div style={s.filterWrapper}>
            <UserCheck size={14} color="#6b7280" style={s.filterIcon} />
            <select
              style={s.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          {hasFilters && (
            <button style={s.clearBtn} onClick={clearFilters}>
              <X size={13} style={{ marginRight: 4 }} />
              Limpiar
            </button>
          )}

          <span style={s.resultCount}>
            <Users size={12} style={{ marginRight: 4 }} />
            {filteredUsers.length} de {users.length} usuarios
          </span>
        </div>

        {loading ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={s.stateContainer}>
            <p style={s.stateText}>
              {hasFilters ? 'No hay usuarios que coincidan con los filtros.' : 'No hay usuarios registrados.'}
            </p>
          </div>
        ) : (
          <div style={s.tableCard}>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>Nombre</th>
                    <th style={s.th}>Correo</th>
                    <th style={s.th}>Teléfono</th>
                    <th style={s.th}>Rol</th>
                    <th style={s.th}>Estado</th>
                    <th style={s.th}>Fecha Registro</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={s.tr}>
                      <td style={s.td}>
                        <strong>{u.fullName}</strong>
                      </td>
                      <td style={s.td}>
                        <div style={s.emailCell}>
                          <Mail size={12} color="#6b7280" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={s.phoneCell}>
                          <Phone size={12} color="#6b7280" />
                          <span>{u.phone || '—'}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: getRoleBadgeColor(u.roleName) }}>
                          {getRoleIcon(u.roleName)}
                          {u.roleName}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: u.isActive ? '#2e7d32' : '#c62828' }}>
                          {u.isActive ? (
                            <UserCheck size={12} style={{ marginRight: 4 }} />
                          ) : (
                            <UserX size={12} style={{ marginRight: 4 }} />
                          )}
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={s.dateCell}>
                          <Calendar size={12} color="#9ca3af" />
                          <span>{new Date(u.createdAt).toLocaleDateString('es-EC')}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          <button onClick={() => openEditModal(u)} style={s.iconBtn} title="Editar">
                            <Pencil size={15} color="#4361ee" />
                          </button>
                          <button onClick={() => handleDelete(u.id)} style={s.iconBtn} title="Eliminar">
                            <Trash2 size={15} color="#dc2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.total > pagination.pageSize && (
              <div style={s.pagination}>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  style={{ ...s.pageBtn, opacity: pagination.page === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={14} style={{ marginRight: 4 }} />
                  Anterior
                </button>
                <span style={s.pageInfo}>
                  Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  style={{ ...s.pageBtn, opacity: pagination.page >= Math.ceil(pagination.total / pagination.pageSize) ? 0.5 : 1 }}
                >
                  Siguiente
                  <ChevronRight size={14} style={{ marginLeft: 4 }} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL DE CREAR/EDITAR USUARIO */}
      {showModal && (
        <div style={modalStyles.overlay} onClick={closeModal}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <div style={modalStyles.headerIcon}>
                {editUser ? <Pencil size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
              </div>
              <div style={modalStyles.headerText}>
                <h2 style={modalStyles.title}>
                  {editUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <p style={modalStyles.subtitle}>
                  {editUser ? 'Modifica la información del usuario' : 'Completa los datos para crear un nuevo usuario'}
                </p>
              </div>
              <button style={modalStyles.closeBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={modalStyles.content}>
                {error && (
                  <div style={modalStyles.error}>
                    <AlertCircle size={16} style={{ marginRight: 8 }} />
                    {error}
                  </div>
                )}
                {success && (
                  <div style={modalStyles.success}>
                    <CheckCircle size={16} style={{ marginRight: 8 }} />
                    {success}
                  </div>
                )}

                <div style={modalStyles.formGrid}>
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <User size={14} style={{ marginRight: 6 }} />
                      Nombre completo *
                    </label>
                    <input
                      style={modalStyles.input}
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Mail size={14} style={{ marginRight: 6 }} />
                      Correo institucional *
                    </label>
                    <input
                      style={modalStyles.input}
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="usuario@uta.edu.ec"
                      required
                    />
                  </div>

                  {!editUser && (
                    <div style={modalStyles.field}>
                      <label style={modalStyles.label}>
                        <Lock size={14} style={{ marginRight: 6 }} />
                        Contraseña *
                      </label>
                      <input
                        style={modalStyles.input}
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                    </div>
                  )}

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Phone size={14} style={{ marginRight: 6 }} />
                      Teléfono
                    </label>
                    <input
                      style={modalStyles.input}
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0987654321"
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <IdCard size={14} style={{ marginRight: 6 }} />
                      Cédula
                    </label>
                    <input
                      style={modalStyles.input}
                      type="text"
                      value={form.cedula}
                      onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                      placeholder="1804567890"
                      maxLength={10}
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Building size={14} style={{ marginRight: 6 }} />
                      Departamento / Facultad
                    </label>
                    <input
                      style={modalStyles.input}
                      type="text"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      placeholder="FISEI, Rectorado, DITIC..."
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Award size={14} style={{ marginRight: 6 }} />
                      Especialidad
                    </label>
                    <input
                      style={modalStyles.input}
                      type="text"
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                      placeholder="Solo para técnicos: Redes, Hardware, Software..."
                    />
                  </div>

                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>
                      <Shield size={14} style={{ marginRight: 6 }} />
                      Rol *
                    </label>
                    <select
                      style={modalStyles.select}
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
                    <div style={modalStyles.field}>
                      <label style={modalStyles.label}>Estado</label>
                      <div style={modalStyles.toggleGroup}>
                        <button
                          type="button"
                          style={{
                            ...modalStyles.toggleBtn,
                            ...(form.isActive ? modalStyles.toggleActive : modalStyles.toggleInactive)
                          }}
                          onClick={() => setForm({ ...form, isActive: true })}
                        >
                          <UserCheck size={14} style={{ marginRight: 6 }} />
                          Activo
                        </button>
                        <button
                          type="button"
                          style={{
                            ...modalStyles.toggleBtn,
                            ...(!form.isActive ? modalStyles.toggleActive : modalStyles.toggleInactive)
                          }}
                          onClick={() => setForm({ ...form, isActive: false })}
                        >
                          <UserX size={14} style={{ marginRight: 6 }} />
                          Inactivo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={modalStyles.footer}>
                <button type="button" style={modalStyles.cancelBtn} onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" style={modalStyles.saveBtn} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                      Guardando...
                    </>
                  ) : (
                    editUser ? 'Guardar Cambios' : 'Crear Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const s = {
  content: { padding: '32px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8, display: 'flex', alignItems: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4361ee',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14
  },
  success: {
    backgroundColor: '#ecfdf3',
    color: '#027a48',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center'
  },
  error: {
    backgroundColor: '#fef3f2',
    color: '#b42318',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center'
  },
  filtersBar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    padding: '16px 20px',
    borderRadius: 16,
    border: '1px solid #eaecf0',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 220px',
    minWidth: 180
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 38px',
    borderRadius: 12,
    border: '1px solid #e4e7eb',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s ease',
    '&:focus': {
      borderColor: '#4361ee',
      boxShadow: '0 0 0 3px rgba(67, 97, 238, 0.1)',
    }
  },
  filterWrapper: {
    position: 'relative',
    minWidth: 140,
  },
  filterIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  filterSelect: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    borderRadius: 10,
    border: '1px solid #d0d5dd',
    fontSize: 14,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    transition: 'all 0.2s ease',
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#374151',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
    }
  },
  resultCount: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center'
  },
  tableCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #eaecf0',
    overflow: 'hidden'
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f9fafb' },
  th: {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 700,
    color: '#667085',
    borderBottom: '1px solid #eaecf0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tr: { borderBottom: '1px solid #f1f3f5', transition: 'background-color 0.2s ease' },
  td: { padding: '18px 20px', fontSize: 14, color: '#344054' },
  emailCell: { display: 'flex', alignItems: 'center', gap: 6 },
  phoneCell: { display: 'flex', alignItems: 'center', gap: 6 },
  dateCell: { display: 'flex', alignItems: 'center', gap: 6 },
  badge: {
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center'
  },
  actions: { display: 'flex', gap: 4, alignItems: 'center' },
  iconBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  stateContainer: { padding: '60px 20px', textAlign: 'center' },
  stateText: { color: '#6b7280', fontSize: 15 },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: '20px',
    borderTop: '1px solid #eaecf0'
  },
  pageBtn: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center'
  },
  pageInfo: { fontSize: 13, color: '#344054' }
};

// Estilos del Modal
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'slideUp 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: 20,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s',
  },
  content: {
    padding: '24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  field: {
    marginBottom: 8,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  toggleGroup: {
    display: 'flex',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  toggleActive: {
    backgroundColor: '#4361ee',
    color: '#fff',
  },
  toggleInactive: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
  },
  success: {
    backgroundColor: '#ecfdf5',
    color: '#10b981',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '16px 24px',
    borderTop: '1px solid #eaecf0',
    backgroundColor: '#f9fafb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  saveBtn: {
    padding: '10px 24px',
    background: '#4361ee',
    border: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
};

// Agregar animaciones
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .modal-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
  .modal-cancel-btn:hover {
    background-color: #f3f4f6;
  }
  .modal-save-btn:hover {
    background-color: #1e3a5f;
  }
`;
document.head.appendChild(styleSheet);

export default UserManagement;