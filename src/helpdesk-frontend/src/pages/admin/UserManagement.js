import React, { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Plus, Search, X } from 'lucide-react';
import { authAPI } from '../../services/api';
import Layout from '../../components/Layout';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    roleId: '',
    isActive: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10
  });

  // Filtros locales
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
  }, [filters, pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('pageSize', pagination.pageSize);
      if (filters.search) params.append('search', filters.search);
      if (filters.roleId) params.append('roleId', filters.roleId);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      
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

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers();
  };

  const handleResetFilters = () => {
    setFilters({ search: '', roleId: '', isActive: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
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
  };

  const hasFilters = search !== '' || filterRole !== '' || filterStatus !== '';

  const openCreate = () => {
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
    setShowForm(true);
  };

  const handleEdit = (user) => {
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
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      } else {
        if (!form.email.endsWith('@uta.edu.ec')) {
          setError('El correo debe ser @uta.edu.ec');
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
      }
      setShowForm(false);
      setEditUser(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('¿Desactivar este usuario?')) return;
    try {
      await authAPI.delete(`/user/${id}`);
      setSuccess('Usuario desactivado');
      loadUsers();
    } catch {
      setError('Error al desactivar usuario');
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
      <main style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Gestión de Usuarios</h1>
            <p style={s.subtitle}>Administra usuarios, roles y permisos del sistema</p>
          </div>
          <button style={s.actionBtn} onClick={openCreate}>
            <Plus size={16} /> Crear Usuario
          </button>
        </div>

        {success && <div style={s.success}>{success}</div>}
        {error && <div style={s.error}>{error}</div>}

        <div style={s.filterCard}>
          <div style={s.filterGrid}>
            <div style={s.filterField}>
              <label style={s.label}>Buscar</label>
              <input
                style={s.input}
                type="text"
                placeholder="Nombre o email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div style={s.filterField}>
              <label style={s.label}>Rol</label>
              <select
                style={s.input}
                value={filters.roleId}
                onChange={(e) => setFilters({ ...filters, roleId: e.target.value })}
              >
                <option value="">Todos</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div style={s.filterField}>
              <label style={s.label}>Estado</label>
              <select
                style={s.input}
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            <div style={s.filterButtons}>
              <button style={s.searchBtn} onClick={handleSearch}>
                <Search size={16} /> Buscar
              </button>
              <button style={s.resetBtn} onClick={handleResetFilters}>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div style={s.formCard}>
            <h4 style={s.formTitle}>{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>Nombre completo *</label>
                  <input
                    style={s.input}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Nombre Apellido"
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Correo institucional *</label>
                  <input
                    style={s.input}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="usuario@uta.edu.ec"
                    required
                  />
                </div>

                {!editUser && (
                  <div style={s.field}>
                    <label style={s.label}>Contraseña *</label>
                    <input
                      style={s.input}
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <div style={s.field}>
                  <label style={s.label}>Teléfono</label>
                  <input
                    style={s.input}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0987654321"
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Cédula</label>
                  <input
                    style={s.input}
                    value={form.cedula}
                    onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                    placeholder="1804567890"
                    maxLength={10}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Departamento / Facultad</label>
                  <input
                    style={s.input}
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="FISEI, Rectorado, DITIC..."
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Especialidad</label>
                  <input
                    style={s.input}
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    placeholder="Solo para técnicos: Redes, Hardware, Software..."
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Rol *</label>
                  <select
                    style={s.input}
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
                  <div style={s.field}>
                    <label style={s.label}>Estado</label>
                    <div style={s.toggleRow}>
                      <button
                        type="button"
                        style={{ ...s.toggleBtn, ...(form.isActive ? s.toggleActive : s.toggleInactive) }}
                        onClick={() => setForm({ ...form, isActive: true })}
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        style={{ ...s.toggleBtn, ...(!form.isActive ? s.toggleActive : s.toggleInactive) }}
                        onClick={() => setForm({ ...form, isActive: false })}
                      >
                        Inactivo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={s.formButtons}>
                <button type="submit" style={s.saveBtn}>
                  {editUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => { setShowForm(false); setEditUser(null); }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

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

          <select
            style={s.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          {hasFilters && (
            <button style={s.clearBtn} onClick={clearFilters}>
              <X size={13} /> Limpiar
            </button>
          )}

          <span style={s.resultCount}>
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
                      <td style={s.td}><strong>{u.fullName}</strong></td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>{u.phone || '—'}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: getRoleBadgeColor(u.roleName) }}>
                          {u.roleName}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, backgroundColor: u.isActive ? '#2e7d32' : '#c62828' }}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={s.td}>{new Date(u.createdAt).toLocaleDateString('es-EC')}</td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          <button onClick={() => handleEdit(u)} style={s.iconBtn} title="Editar">
                            <Pencil size={15} color="#4361ee" />
                          </button>
                          {u.isActive && (
                            <button onClick={() => handleDeactivate(u.id)} style={s.iconBtn} title="Desactivar">
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          )}
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
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </Layout>
  );
}

const s = {
  content: { padding: '32px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#4361ee', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  success: { backgroundColor: '#ecfdf3', color: '#027a48', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14 },
  error: { backgroundColor: '#fef3f2', color: '#b42318', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14 },
  filterCard: { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', padding: '20px 24px', marginBottom: 24 },
  filterGrid: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterField: { flex: 1, minWidth: '150px' },
  filterButtons: { display: 'flex', gap: 8 },
  searchBtn: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#4361ee', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 13 },
  resetBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d0d5dd', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 13 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', padding: 32, marginBottom: 24 },
  formTitle: { fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 24 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  field: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff' },
  toggleRow: { display: 'flex', gap: 8 },
  toggleBtn: { flex: 1, padding: '10px 0', borderRadius: 8, border: '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' },
  toggleActive: { backgroundColor: '#4361ee', color: '#fff', borderColor: '#4361ee' },
  toggleInactive: { backgroundColor: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' },
  formButtons: { display: 'flex', gap: 12, marginTop: 12 },
  saveBtn: { padding: '12px 24px', backgroundColor: '#4361ee', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  filtersBar: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
  searchWrapper: { position: 'relative', flex: '1 1 220px', minWidth: 180 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff' },
  filterSelect: { padding: '10px 14px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, backgroundColor: '#fff', cursor: 'pointer', outline: 'none' },
  clearBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  resultCount: { fontSize: 13, color: '#6b7280', marginLeft: 'auto' },
  tableCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', overflow: 'hidden' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f9fafb' },
  th: { padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#667085', borderBottom: '1px solid #eaecf0' },
  tr: { borderBottom: '1px solid #f1f3f5' },
  td: { padding: '18px 20px', fontSize: 14, color: '#344054' },
  badge: { color: '#fff', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block' },
  actions: { display: 'flex', gap: 4, alignItems: 'center' },
  iconBtn: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' },
  stateContainer: { padding: '60px 20px', textAlign: 'center' },
  stateText: { color: '#6b7280', fontSize: 15 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '20px', borderTop: '1px solid #eaecf0' },
  pageBtn: { padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d0d5dd', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  pageInfo: { fontSize: 13, color: '#344054' }
};

export default UserManagement;