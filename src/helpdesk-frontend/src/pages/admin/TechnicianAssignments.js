import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Power,
  PowerOff,
  User,
  Mail,
  Briefcase,
  Shield,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  RefreshCw,
  UserCog,
  Tag,
  Search,
  Filter
} from 'lucide-react';
import { authAPI, catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function TechnicianAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const [form, setForm] = useState({
    technicianId: '',
    serviceCatalogId: '',
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getTechnicianLevel = (role) => {
    switch (role) {
      case 'TecnicoN1': return 1;
      case 'TecnicoN2': return 2;
      case 'DITIC': return 3;
      case 'Proveedor': return 4;
      default: return null;
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tech, svc, asg] = await Promise.all([
        authAPI.get('/technicians/list'),
        catalogAPI.get('/servicecatalog'),
        authAPI.get('/technicians/assignments'),
      ]);
      setTechnicians(tech.data);
      setServices(svc.data);
      setAssignments(asg.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const selectedTechnician = technicians.find(
    (t) => t.id === parseInt(form.technicianId)
  );

  const filteredTechnicians = useMemo(() => {
    if (!filterLevel) return technicians;
    return technicians.filter(t => getTechnicianLevel(t.role) === parseInt(filterLevel));
  }, [technicians, filterLevel]);

  const filteredAssignments = useMemo(() => {
    if (!search) return assignments;
    return assignments.filter(a => {
      const tech = technicians.find(t => t.id === a.technicianId);
      const service = services.find(s => s.id === a.serviceCatalogId);
      return (tech?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        service?.name?.toLowerCase().includes(search.toLowerCase()));
    });
  }, [assignments, technicians, services, search]);

  const openCreateModal = () => {
    setForm({ technicianId: '', serviceCatalogId: '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!form.technicianId || !form.serviceCatalogId) {
      setError('Debe seleccionar técnico y servicio');
      setSaving(false);
      return;
    }

    try {
      await authAPI.post('/technicians/assignments', {
        technicianId: parseInt(form.technicianId),
        serviceCatalogId: parseInt(form.serviceCatalogId),
      });
      setSuccess('Asignación creada correctamente');
      setTimeout(() => {
        closeModal();
        loadAll();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear asignación');
      setSaving(false);
    }
  };

  const handleToggleActive = async (id, currentState) => {
    try {
      await authAPI.patch(`/technicians/assignments/${id}/active`, !currentState, {
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccess(currentState ? 'Asignación desactivada' : 'Asignación activada');
      loadAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al cambiar estado');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id, techName, serviceName) => {
    if (!window.confirm(`¿Eliminar la asignación de "${techName}" al servicio "${serviceName}"?`)) return;
    try {
      await authAPI.delete(`/technicians/assignments/${id}`);
      setSuccess('Asignación eliminada correctamente');
      loadAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al eliminar asignación');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getServiceName = (id) => {
    const s = services.find((x) => x.id === id);
    return s ? s.name : `Servicio #${id}`;
  };

  const getServiceCategory = (id) => {
    const s = services.find((x) => x.id === id);
    return s ? s.category : '';
  };

  const getLevelBadge = (role) => {
    const level = getTechnicianLevel(role);
    const colors = {
      1: { bg: '#dbeafe', color: '#1e40af', text: 'N1 — Técnico Básico' },
      2: { bg: '#e0e7ff', color: '#3730a3', text: 'N2 — Técnico Profesional' },
      3: { bg: '#ddd6fe', color: '#5b21b6', text: 'N3 — DITIC' },
      4: { bg: '#fce7f3', color: '#9d174d', text: 'N4 — Proveedor Externo' },
    };
    return colors[level] || colors[1];
  };

  const getRoleColor = (role) => {
    const colors = {
      TecnicoN1: '#1565c0',
      TecnicoN2: '#0277bd',
      DITIC: '#00695c',
      Proveedor: '#4527a0',
    };
    return colors[role] || '#555';
  };

  const clearFilters = () => {
    setSearch('');
    setFilterLevel('');
  };

  const hasFilters = search !== '' || filterLevel !== '';

  return (
    <Layout>
      <div className="tech-assignments-page">
        <div className="tech-assignments-header">
          <div>
            <h1 className="tech-assignments-title">
              <UserCog size={isMobile ? 24 : 28} />
              Asignación de Servicios
            </h1>
            <p className="tech-assignments-subtitle">
              Define qué servicios atiende cada técnico
            </p>
          </div>
          <button className="tech-assignments-new-btn" onClick={openCreateModal}>
            <Plus size={16} />
            Nueva Asignación
          </button>
        </div>

        {success && (
          <div className="tech-assignments-success">
            <CheckCircle size={18} />
            {success}
          </div>
        )}
        {error && !showModal && (
          <div className="tech-assignments-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Barra de filtros */}
        <div className="tech-assignments-filters-card">
          <div className="tech-assignments-search-bar">
            <div className="tech-assignments-search-wrapper">
              <Search size={16} className="tech-assignments-search-icon" />
              <input
                className="tech-assignments-search-input"
                placeholder={isMobile ? "Buscar..." : "Buscar técnico o servicio..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="tech-assignments-clear-search" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="tech-assignments-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} />
              Filtros
            </button>
          </div>

          <div className={`tech-assignments-filters ${showFilters ? 'tech-assignments-filters-open' : ''}`}>
            <div className="tech-assignments-filter-group">
              <label className="tech-assignments-filter-label">Nivel</label>
              <select className="tech-assignments-filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                <option value="">Todos los niveles</option>
                <option value="1">N1 - Técnico Básico</option>
                <option value="2">N2 - Técnico Profesional</option>
                <option value="3">N3 - DITIC</option>
                <option value="4">N4 - Proveedor Externo</option>
              </select>
            </div>

            <div className="tech-assignments-stats">
              <UserCog size={12} />
              {filteredTechnicians.length} técnicos
            </div>

            {hasFilters && (
              <button className="tech-assignments-clear-filters" onClick={clearFilters}>
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="tech-assignments-loading">
            <RefreshCw size={24} className="tech-assignments-spinner" />
            <p>Cargando asignaciones...</p>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="tech-assignments-empty">
            <p>
              {hasFilters ? 'No hay técnicos que coincidan con los filtros.' : 'No hay técnicos registrados.'}
            </p>
          </div>
        ) : (
          <div className="tech-assignments-grid">
            {filteredTechnicians.map((t) => {
              const lvl = getLevelBadge(t.role);
              const techAssignments = assignments.filter(a => a.technicianId === t.id);
              return (
                <div key={t.id} className="tech-assignments-card">
                  <div className="tech-assignments-card-header">
                    <div>
                      <h3 className="tech-assignments-tech-name">
                        <User size={14} />
                        {t.fullName}
                      </h3>
                      <p className="tech-assignments-tech-email">
                        <Mail size={11} />
                        {t.email}
                      </p>
                    </div>
                    <div className="tech-assignments-badges">
                      <span className="tech-assignments-role-badge" style={{ backgroundColor: getRoleColor(t.role) }}>
                        {t.role}
                      </span>
                      <span className="tech-assignments-level-badge" style={{ background: lvl.bg, color: lvl.color }}>
                        {lvl.text}
                      </span>
                    </div>
                  </div>

                  <div className="tech-assignments-divider" />

                  <div className="tech-assignments-services">
                    <div className="tech-assignments-services-header">
                      <Briefcase size={12} />
                      Servicios asignados ({techAssignments.length})
                    </div>

                    {techAssignments.length === 0 ? (
                      <p className="tech-assignments-no-services">Sin asignaciones</p>
                    ) : (
                      <ul className="tech-assignments-services-list">
                        {techAssignments.map((a) => (
                          <li key={a.id} className="tech-assignments-service-item">
                            <div className="tech-assignments-service-info">
                              <div className="tech-assignments-service-name">
                                <Tag size={12} />
                                {getServiceName(a.serviceCatalogId)}
                                {!a.isActive && (
                                  <span className="tech-assignments-inactive-badge">Inactivo</span>
                                )}
                              </div>
                              <div className="tech-assignments-service-category">
                                {getServiceCategory(a.serviceCatalogId)}
                              </div>
                            </div>
                            <div className="tech-assignments-service-actions">
                              <button
                                className="tech-assignments-icon-btn"
                                onClick={() => handleToggleActive(a.id, a.isActive)}
                                title={a.isActive ? 'Desactivar' : 'Activar'}
                              >
                                {a.isActive ? (
                                  <PowerOff size={14} color="#dc2626" />
                                ) : (
                                  <Power size={14} color="#16a34a" />
                                )}
                              </button>
                              <button
                                className="tech-assignments-icon-btn"
                                onClick={() => handleDelete(a.id, t.fullName, getServiceName(a.serviceCatalogId))}
                                title="Eliminar"
                              >
                                <Trash2 size={14} color="#dc2626" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CREAR ASIGNACIÓN RESPONSIVE */}
      {showModal && (
        <div className="tech-assignments-modal-overlay" onClick={closeModal}>
          <div className="tech-assignments-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tech-assignments-modal-header">
              <div className="tech-assignments-modal-header-icon">
                <Plus size={24} color="#fff" />
              </div>
              <div className="tech-assignments-modal-header-text">
                <h2>Nueva Asignación</h2>
                <p>Asigna un servicio a un técnico</p>
              </div>
              <button className="tech-assignments-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="tech-assignments-modal-body">
                {error && (
                  <div className="tech-assignments-modal-error">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="tech-assignments-modal-field">
                  <label>Técnico *</label>
                  <select
                    value={form.technicianId}
                    onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
                    required
                  >
                    <option value="">-- Selecciona un técnico --</option>
                    {filteredTechnicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="tech-assignments-modal-field">
                  <label>Servicio *</label>
                  <select
                    value={form.serviceCatalogId}
                    onChange={(e) => setForm({ ...form, serviceCatalogId: e.target.value })}
                    required
                  >
                    <option value="">-- Selecciona un servicio --</option>
                    {services.map((sv) => (
                      <option key={sv.id} value={sv.id}>
                        {sv.name} {sv.category ? `(${sv.category})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTechnician && (
                  <div className="tech-assignments-modal-level-info">
                    <div className="tech-assignments-modal-level-label">
                      <Shield size={12} />
                      Nivel de atención:
                    </div>
                    <div className="tech-assignments-modal-level-badge">
                      <span style={{
                        background: getLevelBadge(selectedTechnician.role).bg,
                        color: getLevelBadge(selectedTechnician.role).color,
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {getLevelBadge(selectedTechnician.role).text}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="tech-assignments-modal-footer">
                <button type="button" className="tech-assignments-modal-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="tech-assignments-modal-save" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tech-assignments-page {
          padding: 28px 32px;
          flex: 1;
          background-color: #f5f7fa;
          min-height: 100vh;
        }

        .tech-assignments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .tech-assignments-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tech-assignments-subtitle {
          font-size: 13px;
          color: #6b7280;
        }

        .tech-assignments-new-btn {
          background-color: #4361ee;
          color: #fff;
          border: none;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .tech-assignments-success {
          background-color: #ecfdf3;
          color: #027a48;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tech-assignments-error {
          background-color: #fef3f2;
          color: #b42318;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tech-assignments-filters-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          padding: 16px 20px;
          margin-bottom: 24px;
        }

        .tech-assignments-search-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tech-assignments-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .tech-assignments-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .tech-assignments-search-input {
          width: 100%;
          padding: 10px 16px 10px 38px;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
          font-size: 14px;
          outline: none;
          background: #f9fafb;
        }

        .tech-assignments-search-input:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .tech-assignments-clear-search {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
        }

        .tech-assignments-filter-toggle {
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

        .tech-assignments-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 16px;
        }

        .tech-assignments-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }

        .tech-assignments-filter-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tech-assignments-filter-select {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d0d5dd;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
        }

        .tech-assignments-stats {
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

        .tech-assignments-clear-filters {
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
        }

        .tech-assignments-clear-filters:hover {
          background: #fee2e2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .tech-assignments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 20px;
        }

        .tech-assignments-card {
          background: #fff;
          border: 1px solid #e4e7eb;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .tech-assignments-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tech-assignments-tech-name {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tech-assignments-tech-email {
          font-size: 11px;
          color: #8a9bb5;
          margin: 4px 0 0 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tech-assignments-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .tech-assignments-role-badge {
          color: #fff;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .tech-assignments-level-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .tech-assignments-divider {
          height: 1px;
          background: #f0f2f5;
          margin: 14px 0;
        }

        .tech-assignments-services-header {
          font-size: 11px;
          font-weight: 700;
          color: #8a9bb5;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tech-assignments-no-services {
          font-size: 12px;
          color: #9ca3af;
          font-style: italic;
          margin: 0;
          padding: 12px 0;
        }

        .tech-assignments-services-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tech-assignments-service-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #f9fafb;
          border-radius: 10px;
          margin-bottom: 6px;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tech-assignments-service-info {
          flex: 1;
          min-width: 0;
        }

        .tech-assignments-service-name {
          font-size: 12px;
          font-weight: 600;
          color: #1a1a2e;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tech-assignments-inactive-badge {
          background: #fee2e2;
          color: #991b1b;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 8px;
        }

        .tech-assignments-service-category {
          font-size: 10px;
          color: #8a9bb5;
          margin-top: 2px;
        }

        .tech-assignments-service-actions {
          display: flex;
          gap: 4px;
        }

        .tech-assignments-icon-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tech-assignments-icon-btn:hover {
          background-color: #f3f4f6;
        }

        .tech-assignments-loading, .tech-assignments-empty {
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

        .tech-assignments-spinner {
          animation: spin 1s linear infinite;
        }

        /* Modal Responsive */
        .tech-assignments-modal-overlay {
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

        .tech-assignments-modal {
          background: #fff;
          border-radius: 24px;
          width: 100%;
          max-width: 550px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .tech-assignments-modal-header {
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

        .tech-assignments-modal-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tech-assignments-modal-header-text {
          flex: 1;
        }

        .tech-assignments-modal-header-text h2 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .tech-assignments-modal-header-text p {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          margin-top: 4px;
        }

        .tech-assignments-modal-close {
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
        }

        .tech-assignments-modal-body {
          padding: 24px;
        }

        .tech-assignments-modal-field {
          margin-bottom: 20px;
        }

        .tech-assignments-modal-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .tech-assignments-modal-field select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
          background: #fff;
          cursor: pointer;
        }

        .tech-assignments-modal-field select:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .tech-assignments-modal-level-info {
          background: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 12px;
          padding: 14px;
          margin-top: 16px;
        }

        .tech-assignments-modal-level-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tech-assignments-modal-error {
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

        .tech-assignments-modal-footer {
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

        .tech-assignments-modal-cancel {
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

        .tech-assignments-modal-cancel:hover {
          background: #f3f4f6;
        }

        .tech-assignments-modal-save {
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

        .tech-assignments-modal-save:hover {
          background: #304ffe;
          transform: translateY(-1px);
        }

        .tech-assignments-modal-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .tech-assignments-page {
            padding: 70px 12px 20px 12px;
          }

          .tech-assignments-title {
            font-size: 22px;
          }

          .tech-assignments-subtitle {
            font-size: 11px;
          }

          .tech-assignments-filter-toggle {
            display: flex;
          }

          .tech-assignments-filters {
            display: none;
            flex-direction: column;
            width: 100%;
          }

          .tech-assignments-filters-open {
            display: flex;
          }

          .tech-assignments-filter-group {
            width: 100%;
          }

          .tech-assignments-filter-select {
            width: 100%;
          }

          .tech-assignments-stats {
            margin-left: 0;
            justify-content: center;
            width: 100%;
          }

          .tech-assignments-clear-filters {
            width: 100%;
            justify-content: center;
          }

          .tech-assignments-grid {
            grid-template-columns: 1fr;
          }

          .tech-assignments-card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .tech-assignments-badges {
            align-items: flex-start;
            flex-direction: row;
            flex-wrap: wrap;
          }

          .tech-assignments-service-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .tech-assignments-service-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .tech-assignments-modal {
            max-width: 95%;
          }

          .tech-assignments-modal-header {
            padding: 16px 20px;
          }

          .tech-assignments-modal-header-icon {
            width: 40px;
            height: 40px;
          }

          .tech-assignments-modal-header-text h2 {
            font-size: 16px;
          }

          .tech-assignments-modal-body {
            padding: 20px;
          }

          .tech-assignments-modal-footer {
            flex-direction: column;
          }

          .tech-assignments-modal-cancel,
          .tech-assignments-modal-save {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </Layout>
  );
}

export default TechnicianAssignments;