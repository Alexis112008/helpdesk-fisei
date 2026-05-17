import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
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

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: '',
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = () => {
    authAPI.get('/user')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadRoles = () => {
    authAPI.get('/user/roles').then((res) => setRoles(res.data));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editUser) {
        await authAPI.put(`/user/${editUser.id}`, {
          fullName: form.fullName,
          isActive: true,
          roleId: parseInt(form.roleId),
        });
        setSuccess('Usuario actualizado correctamente');
      } else {
        await authAPI.post('/user', { ...form, roleId: parseInt(form.roleId) });
        setSuccess('Usuario creado correctamente');
      }
      setShowForm(false);
      setEditUser(null);
      setForm({ fullName: '', email: '', password: '', roleId: '' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      roleId: roles.find((r) => r.name === user.role)?.id || '',
    });
    setShowForm(true);
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
      Admin: '#1a237e', TecnicoN1: '#1565c0', TecnicoN2: '#0277bd',
      DITIC: '#00695c', Proveedor: '#4527a0', Usuario: '#558b2f',
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
          <button style={s.actionBtn} onClick={() => { setShowForm(true); setEditUser(null); setForm({ fullName: '', email: '', password: '', roleId: '' }); }}>
            <Plus size={16} /> Crear Usuario
          </button>
        </div>

        {success && <div style={s.success}>{success}</div>}
        {error && <div style={s.error}>{error}</div>}

        {showForm && (
          <div style={s.formCard}>
            <h4 style={s.formTitle}>{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.label}>Nombre completo</label>
                  <input style={s.input} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nombre Apellido" required />
                </div>
                {!editUser && (
                  <div style={s.field}>
                    <label style={s.label}>Correo institucional</label>
                    <input style={s.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@uta.edu.ec" required />
                  </div>
                )}
                {!editUser && (
                  <div style={s.field}>
                    <label style={s.label}>Contraseña</label>
                    <input style={s.input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
                  </div>
                )}
                <div style={s.field}>
                  <label style={s.label}>Rol</label>
                  <select style={s.input} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} required>
                    <option value="">-- Selecciona un rol --</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={s.formButtons}>
                <button type="submit" style={s.saveBtn}>{editUser ? 'Guardar Cambios' : 'Crear Usuario'}</button>
                <button type="button" style={s.cancelBtn} onClick={() => { setShowForm(false); setEditUser(null); }}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={s.stateContainer}><p style={s.stateText}>Cargando usuarios...</p></div>
        ) : (
          <div style={s.tableCard}>
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>Nombre</th>
                    <th style={s.th}>Correo</th>
                    <th style={s.th}>Rol</th>
                    <th style={s.th}>Estado</th>
                    <th style={s.th}>Fecha Registro</th>
                    <th style={s.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={s.tr}>
                      <td style={s.td}>{u.fullName}</td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}><span style={{ ...s.badge, backgroundColor: getRoleBadgeColor(u.role) }}>{u.role}</span></td>
                      <td style={s.td}><span style={{ ...s.badge, backgroundColor: u.isActive ? '#2e7d32' : '#c62828' }}>{u.isActive ? 'Activo' : 'Inactivo'}</span></td>
                      <td style={s.td}>{new Date(u.createdAt).toLocaleDateString('es-EC')}</td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          <button onClick={() => handleEdit(u)} style={s.iconBtn} title="Editar"><Pencil size={15} color="#4361ee" /></button>
                          {u.isActive && <button onClick={() => handleDeactivate(u.id)} style={s.iconBtn} title="Desactivar"><Trash2 size={15} color="#dc2626" /></button>}
                        </div>
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
  content: { padding: '32px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#4361ee', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  success: { backgroundColor: '#ecfdf3', color: '#027a48', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14 },
  error: { backgroundColor: '#fef3f2', color: '#b42318', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #eaecf0', padding: 32, marginBottom: 24 },
  formTitle: { fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 24 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  field: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d0d5dd', fontSize: 14, boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff' },
  formButtons: { display: 'flex', gap: 12, marginTop: 12 },
  saveBtn: { padding: '12px 24px', backgroundColor: '#4361ee', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
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
};

export default UserManagement;