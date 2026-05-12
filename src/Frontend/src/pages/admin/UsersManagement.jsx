import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import "../../styles/usersManagement.css";

/* ─────────────── CONSTANTES ─────────────── */

const ROLES = ["Administrador", "Técnico Nivel 1", "Técnico Nivel 2", "Usuario"];

const DEPARTAMENTOS = [
  "Administración",
  "Soporte Técnico",
  "Estudiante",
  "Docente",
];

const AVATAR_COLORS = [
  "#1a73e8", "#10b981", "#f59e0b",
  "#8b5cf6", "#ef4444", "#0891b2", "#ec4899",
];

const initialUsers = [
  {
    id: 1, initials: "CM", name: "Carlos Mendoza",
    email: "carlos.mendoza@uta.edu.ec", role: "Técnico Nivel 1",
    dept: "Soporte Técnico", estado: "Activo", tickets: 45, last: "Hace 5 min",
  },
  {
    id: 2, initials: "LP", name: "Laura Pérez",
    email: "laura.perez@uta.edu.ec", role: "Técnico Nivel 2",
    dept: "Soporte Técnico", estado: "Activo", tickets: 28, last: "Hace 1 h",
  },
  {
    id: 3, initials: "MR", name: "Marco Rodríguez",
    email: "marco.rodriguez@uta.edu.ec", role: "Administrador",
    dept: "Administración", estado: "Activo", tickets: 12, last: "Hace 2 h",
  },
  {
    id: 4, initials: "AS", name: "Ana Salazar",
    email: "ana.salazar@uta.edu.ec", role: "Usuario",
    dept: "Docente", estado: "Inactivo", tickets: 3, last: "Hace 3 días",
  },
  {
    id: 5, initials: "JT", name: "Jorge Torres",
    email: "jorge.torres@uta.edu.ec", role: "Técnico Nivel 1",
    dept: "Soporte Técnico", estado: "Activo", tickets: 61, last: "Hace 20 min",
  },
];

const EMPTY_FORM = {
  name: "", email: "", role: "Usuario",
  dept: DEPARTAMENTOS[0], estado: "Activo", password: "",
};

/* ─────────────── HELPERS ─────────────── */

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function roleBadgeClass(role) {
  if (role === "Técnico Nivel 1") return "badge-tecnico1";
  if (role === "Técnico Nivel 2") return "badge-tecnico2";
  if (role === "Administrador")   return "badge-admin";
  return "badge-usuario";
}

/* ─────────────── MODAL CREAR / EDITAR ─────────────── */

function UserModal({ mode, form, onChange, onSave, onClose, errors }) {
  const isEdit = mode === "edit";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h2>{isEdit ? "Editar Usuario" : "Crear Usuario"}</h2>
            <p>{isEdit ? "Modifica los datos del usuario seleccionado" : "Completa el formulario para registrar un nuevo usuario"}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          <div className={`field ${errors.name ? "field--error" : ""}`}>
            <label>Nombre completo <span className="required">*</span></label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Ej. Carlos Mendoza"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className={`field ${errors.email ? "field--error" : ""}`}>
            <label>Correo institucional <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="usuario@uta.edu.ec"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field-row">

            <div className={`field ${errors.role ? "field--error" : ""}`}>
              <label>Rol <span className="required">*</span></label>
              <div className="select-wrapper">
                <select name="role" value={form.role} onChange={onChange}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="select-arrow">▾</span>
              </div>
              {errors.role && <span className="field-error">{errors.role}</span>}
            </div>

            <div className="field">
              <label>Departamento</label>
              <div className="select-wrapper">
                <select name="dept" value={form.dept} onChange={onChange}>
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="select-arrow">▾</span>
              </div>
            </div>

          </div>

          <div className="field">
            <label>Estado</label>
            <div className="toggle-group">
              {["Activo", "Inactivo"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`toggle-btn ${form.estado === s ? "toggle-btn--on" : ""}`}
                  onClick={() => onChange({ target: { name: "estado", value: s } })}
                >
                  {s === "Activo" ? "✓ " : "○ "}{s}
                </button>
              ))}
            </div>
          </div>

          {!isEdit && (
            <div className={`field ${errors.password ? "field--error" : ""}`}>
              <label>Contraseña temporal <span className="required">*</span></label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
          )}

          <div className="role-preview">
            <span className="role-preview-label">Rol seleccionado:</span>
            <span className={`um-badge ${roleBadgeClass(form.role)}`}>{form.role}</span>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={onSave}>
            {isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─────────────── MODAL ELIMINAR ─────────────── */

function DeleteModal({ user, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h2>Eliminar usuario</h2>
            <p>Esta acción no se puede deshacer</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="delete-warning">
            <div className="delete-icon">🗑️</div>
            <p>¿Estás seguro de que deseas eliminar a <strong>{user.name}</strong>?</p>
            <p className="delete-sub">{user.email}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-delete" onClick={onConfirm}>Sí, eliminar</button>
        </div>

      </div>
    </div>
  );
}

/* ─────────────── COMPONENTE PRINCIPAL ─────────────── */

export default function UsersManagement() {
  const [users, setUsers]           = useState(initialUsers);
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [modal, setModal]           = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});

  /* ── Filtrado ── */
  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "Todos" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  /* ── Form ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                        e.name     = "El nombre es obligatorio";
    if (!form.email.trim())                                       e.email    = "El correo es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(form.email))                   e.email    = "Correo inválido";
    if (!form.role)                                               e.role     = "Selecciona un rol";
    if (modal === "create" && !form.password)                     e.password = "La contraseña es obligatoria";
    if (modal === "create" && form.password && form.password.length < 8) e.password = "Mínimo 8 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Abrir modales ── */
  const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setModal("create"); };
  const openEdit   = (u)  => { setSelectedUser(u); setForm({ ...u, password: "" }); setErrors({}); setModal("edit"); };
  const openDelete = (u)  => { setSelectedUser(u); setModal("delete"); };
  const closeModal = ()   => { setModal(null); setSelectedUser(null); };

  /* ── CRUD ── */
  const handleSave = () => {
    if (!validate()) return;
    if (modal === "create") {
      setUsers((u) => [{
        id: Date.now(), initials: getInitials(form.name),
        name: form.name, email: form.email, role: form.role,
        dept: form.dept, estado: form.estado, tickets: 0, last: "Ahora mismo",
      }, ...u]);
    } else {
      setUsers((u) =>
        u.map((usr) =>
          usr.id === selectedUser.id
            ? { ...usr, ...form, initials: getInitials(form.name) }
            : usr
        )
      );
    }
    closeModal();
  };

  const handleDelete = () => {
    setUsers((u) => u.filter((x) => x.id !== selectedUser.id));
    closeModal();
  };

  /* ── Resumen ── */
  const totalActivos   = users.filter((u) => u.estado === "Activo").length;
  const totalInactivos = users.filter((u) => u.estado === "Inactivo").length;

  return (
    <AdminLayout activeNavIndex={1}>

      {/* HEADER */}
      <div className="um-page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          ＋ Crear Usuario
        </button>
      </div>

      {/* STATS BAR */}
      <div className="um-stats-bar">
        <div className="um-stat">
          <span className="um-stat-num">{users.length}</span>
          <span className="um-stat-lbl">Total usuarios</span>
        </div>
        <div className="um-stat-divider" />
        <div className="um-stat">
          <span className="um-stat-num green">{totalActivos}</span>
          <span className="um-stat-lbl">Activos</span>
        </div>
        <div className="um-stat-divider" />
        <div className="um-stat">
          <span className="um-stat-num red">{totalInactivos}</span>
          <span className="um-stat-lbl">Inactivos</span>
        </div>
        <div className="um-stat-divider" />
        {ROLES.map((r) => (
          <div className="um-stat" key={r}>
            <span className="um-stat-num">{users.filter((u) => u.role === r).length}</span>
            <span className="um-stat-lbl">{r}</span>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="um-filters">
        <div className="um-search">
          <span className="um-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="um-search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <div className="um-role-filters">
          {["Todos", ...ROLES].map((r) => (
            <button
              key={r}
              className={`um-role-chip ${filterRole === r ? "active" : ""}`}
              onClick={() => setFilterRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
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
              <th>Última actividad</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="um-empty">
                  <div className="um-empty-icon">🔎</div>
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => (
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
                    <span className={`um-badge ${roleBadgeClass(u.role)}`}>{u.role}</span>
                  </td>
                  <td className="um-dept">{u.dept}</td>
                  <td>
                    <span className={`um-badge ${u.estado === "Activo" ? "badge-activo" : "badge-inactivo"}`}>
                      {u.estado === "Activo" ? "● " : "○ "}{u.estado}
                    </span>
                  </td>
                  <td className="um-tickets">{u.tickets}</td>
                  <td className="um-last">{u.last}</td>
                  <td>
                    <div className="um-action-btns">
                      <button className="um-icon-btn um-icon-btn--edit" title="Editar" onClick={() => openEdit(u)}>✏️</button>
                      <button className="um-icon-btn um-icon-btn--delete" title="Eliminar" onClick={() => openDelete(u)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="um-table-footer">
          Mostrando <strong>{filtered.length}</strong> de <strong>{users.length}</strong> usuarios
        </div>
      </div>

      {/* MODALES */}
      {(modal === "create" || modal === "edit") && (
        <UserModal
          mode={modal}
          form={form}
          onChange={handleChange}
          onSave={handleSave}
          onClose={closeModal}
          errors={errors}
        />
      )}

      {modal === "delete" && selectedUser && (
        <DeleteModal
          user={selectedUser}
          onConfirm={handleDelete}
          onClose={closeModal}
        />
      )}

    </AdminLayout>
  );
}
