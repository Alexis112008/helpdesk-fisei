import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import "../../styles/usersManagement.css";

const AVATAR_COLORS = [
  "#1a73e8",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#0891b2",
];

const initialUsers = [
  {
    id: 1,
    initials: "CM",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@uta.edu.ec",
    role: "Técnico Nivel 1",
    dept: "Soporte Técnico",
    estado: "Activo",
    tickets: 45,
    last: "Hace 5 min",
  },
  {
    id: 2,
    initials: "LP",
    name: "Laura Pérez",
    email: "laura.perez@uta.edu.ec",
    role: "Técnico Nivel 2",
    dept: "Soporte Técnico",
    estado: "Activo",
    tickets: 28,
    last: "Hace 1 h",
  },
  {
    id: 3,
    initials: "MR",
    name: "Marco Rodríguez",
    email: "marco.rodriguez@uta.edu.ec",
    role: "Administrador",
    dept: "Administración",
    estado: "Activo",
    tickets: 12,
    last: "Hace 2 h",
  },
  {
    id: 4,
    initials: "AS",
    name: "Ana Salazar",
    email: "ana.salazar@uta.edu.ec",
    role: "Usuario",
    dept: "Docente",
    estado: "Inactivo",
    tickets: 3,
    last: "Hace 3 días",
  },
];

function roleBadgeClass(role) {
  if (role === "Técnico Nivel 1") return "badge-tecnico1";
  if (role === "Técnico Nivel 2") return "badge-tecnico2";
  if (role === "Administrador")   return "badge-admin";
  return "badge-usuario";
}

export default function UsersManagement() {
  const [users, setUsers] = useState(initialUsers);

  const deleteUser = (id) =>
    setUsers((u) => u.filter((x) => x.id !== id));

  return (
    <AdminLayout activeNavIndex={1}>

      {/* PAGE HEADER */}
      <div className="um-page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button className="um-btn-create">+ Crear Usuario</button>
      </div>

      {/* TABLE */}
      <div className="um-table-card">
        <table className="um-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Departamento</th>
              <th>Estado</th>
              <th>Tickets</th>
              <th>Última Actividad</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u, i) => (
              <tr key={u.id}>

                <td>
                  <div className="um-user-cell">
                    <div
                      className="um-user-avatar"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {u.initials}
                    </div>
                    <div>
                      <span className="um-user-name">{u.name}</span>
                      <span className="um-user-email">{u.email}</span>
                    </div>
                  </div>
                </td>

                <td>
                  <span className={`um-badge ${roleBadgeClass(u.role)}`}>
                    {u.role}
                  </span>
                </td>

                <td>{u.dept}</td>

                <td>
                  <span className={`um-badge ${u.estado === "Activo" ? "badge-activo" : "badge-inactivo"}`}>
                    {u.estado}
                  </span>
                </td>

                <td>{u.tickets}</td>

                <td>{u.last}</td>

                <td>
                  <div className="um-action-btns">
                    <button className="um-icon-btn" title="Editar">✏️</button>
                    <button
                      className="um-icon-btn"
                      title="Eliminar"
                      onClick={() => deleteUser(u.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </AdminLayout>
  );
}
