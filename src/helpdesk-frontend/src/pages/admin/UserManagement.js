import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers]     = useState([]);
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', roleId: ''
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = () => {
    authAPI.get('/user')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadRoles = () => {
    authAPI.get('/user/roles')
      .then(res => setRoles(res.data));
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
          roleId:   parseInt(form.roleId)
        });
        setSuccess('Usuario actualizado correctamente');
      } else {
        await authAPI.post('/user', {
          ...form,
          roleId: parseInt(form.roleId)
        });
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
      email:    user.email,
      password: '',
      roleId:   roles.find(r => r.name === user.role)?.id || ''
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
      'Admin':      '#1a237e',
      'TecnicoN1':  '#1565c0',
      'TecnicoN2':  '#0277bd',
      'DITIC':      '#00695c',
      'Proveedor':  '#4527a0',
      'Usuario':    '#558b2f',
    };
    return colors[role] || '#555';
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <h2 style={styles.logo}>HelpDesk</h2>
        <div style={styles.navRight}>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            ← Dashboard
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/'); }}
            style={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Gestión de Usuarios</h3>
            <p style={styles.subtitle}>
              Administra usuarios, roles y permisos del sistema
            </p>
          </div>
          <button onClick={() => {
            setShowForm(true);
            setEditUser(null);
            setForm({ fullName: '', email: '', password: '', roleId: '' });
          }} style={styles.newBtn}>
            + Crear Usuario
          </button>
        </div>

        {success && <div style={styles.success}>{success}</div>}
        {error   && <div style={styles.error}>{error}</div>}

        {/* Formulario crear/editar */}
        {showForm && (
          <div style={styles.formCard}>
            <h4 style={styles.formTitle}>
              {editUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h4>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Nombre completo</label>
                  <input
                    style={styles.input}
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Nombre Apellido"
                    required
                  />
                </div>

                {!editUser && (
                  <div style={styles.field}>
                    <label style={styles.label}>Correo institucional</label>
                    <input
                      style={styles.input}
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="usuario@uta.edu.ec"
                      required
                    />
                  </div>
                )}

                {!editUser && (
                  <div style={styles.field}>
                    <label style={styles.label}>Contraseña</label>
                    <input
                      style={styles.input}
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}

                <div style={styles.field}>
                  <label style={styles.label}>Rol</label>
                  <select
                    style={styles.input}
                    value={form.roleId}
                    onChange={e => setForm({ ...form, roleId: e.target.value })}
                    required
                  >
                    <option value="">-- Selecciona un rol --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formButtons}>
                <button type="submit" style={styles.saveBtn}>
                  {editUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
                <button type="button" style={styles.cancelBtn}
                  onClick={() => { setShowForm(false); setEditUser(null); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de usuarios */}
        {loading ? (
          <p style={{ color: '#666', textAlign: 'center' }}>Cargando usuarios...</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Rol</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Fecha Registro</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>{u.fullName}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: getRoleBadgeColor(u.role)
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: u.isActive ? '#2e7d32' : '#c62828'
                      }}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(u.createdAt).toLocaleDateString('es-EC')}
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => handleEdit(u)}
                        style={styles.editBtn}>
                        Editar
                      </button>
                      {u.isActive && (
                        <button onClick={() => handleDeactivate(u.id)}
                          style={styles.deactivateBtn}>
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:    { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  navbar:       { backgroundColor: '#1a237e', padding: '16px 32px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo:         { color: 'white', margin: 0 },
  navRight:     { display: 'flex', gap: '12px' },
  backBtn:      { backgroundColor: 'transparent', color: 'white',
                  border: '1px solid white', padding: '8px 16px',
                  borderRadius: '6px', cursor: 'pointer' },
  logoutBtn:    { backgroundColor: '#c62828', color: 'white', border: 'none',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' },
  content:      { padding: '32px' },
  header:       { display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '24px' },
  title:        { color: '#1a237e', margin: 0 },
  subtitle:     { color: '#666', margin: '4px 0 0', fontSize: '14px' },
  newBtn:       { backgroundColor: '#1a237e', color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600' },
  success:      { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '12px',
                  borderRadius: '6px', marginBottom: '16px' },
  error:        { backgroundColor: '#ffebee', color: '#c62828', padding: '12px',
                  borderRadius: '6px', marginBottom: '16px' },
  formCard:     { backgroundColor: 'white', padding: '24px', borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  formTitle:    { color: '#1a237e', marginBottom: '20px' },
  formGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field:        { marginBottom: '4px' },
  label:        { display: 'block', marginBottom: '6px', color: '#333',
                  fontWeight: '500', fontSize: '14px' },
  input:        { width: '100%', padding: '10px', borderRadius: '6px',
                  border: '1px solid #ddd', fontSize: '14px',
                  boxSizing: 'border-box' },
  formButtons:  { display: 'flex', gap: '12px', marginTop: '20px' },
  saveBtn:      { padding: '10px 24px', backgroundColor: '#1a237e', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontWeight: '600' },
  cancelBtn:    { padding: '10px 24px', backgroundColor: '#e0e0e0', color: '#333',
                  border: 'none', borderRadius: '6px', cursor: 'pointer' },
  tableWrapper: { overflowX: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white',
                  borderRadius: '10px', overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  thead:        { backgroundColor: '#1a237e' },
  th:           { color: 'white', padding: '14px 16px', textAlign: 'left',
                  fontWeight: '600', fontSize: '14px' },
  tr:           { borderBottom: '1px solid #eee' },
  td:           { padding: '12px 16px', color: '#333', fontSize: '14px' },
  badge:        { color: 'white', padding: '4px 10px', borderRadius: '12px',
                  fontSize: '12px', fontWeight: '600' },
  editBtn:      { backgroundColor: '#1565c0', color: 'white', border: 'none',
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '12px', marginRight: '8px' },
  deactivateBtn:{ backgroundColor: '#c62828', color: 'white', border: 'none',
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '12px' },
};

export default UserManagement;