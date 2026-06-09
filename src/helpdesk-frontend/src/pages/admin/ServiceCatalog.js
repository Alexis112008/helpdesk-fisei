import React, { useState, useEffect, useMemo } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  Save,
  Package,
  Briefcase,
  FileText,
  Clock,
  Shield,
  Wrench,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  UserCheck,
  UserX
} from 'lucide-react';
import { catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function ServiceCatalogPage() {
  const [services, setServices] = useState([]);
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDamage, setFilterDamage] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    attentionLevel: 1,
    estimatedTimeHours: 24,
    damageCatalogId: '',
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadServices();
    loadDamages();
  }, []);

  const loadServices = () => {
    setLoading(true);
    catalogAPI
      .get('/servicecatalog')
      .then((res) => setServices(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadDamages = () => {
    catalogAPI
      .get('/damagecatalog')
      .then((res) => setDamages(res.data))
      .catch((err) => console.error(err));
  };

  const filteredServices = useMemo(() => {
    return services.filter((sv) => {
      const matchSearch = search === '' ||
        sv.name.toLowerCase().includes(search.toLowerCase()) ||
        sv.category.toLowerCase().includes(search.toLowerCase());
      const matchLevel = filterLevel === '' || sv.attentionLevel === parseInt(filterLevel);
      const matchDamage = filterDamage === '' || sv.damageCatalogId === parseInt(filterDamage);
      return matchSearch && matchLevel && matchDamage;
    });
  }, [services, search, filterLevel, filterDamage]);

  const clearFilters = () => {
    setSearch('');
    setFilterLevel('');
    setFilterDamage('');
  };

  const hasFilters = search !== '' || filterLevel !== '' || filterDamage !== '';

  const openCreateModal = () => {
    setEditItem(null);
    setForm({
      name: '',
      description: '',
      category: '',
      attentionLevel: 1,
      estimatedTimeHours: 24,
      damageCatalogId: '',
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      attentionLevel: item.attentionLevel,
      estimatedTimeHours: item.estimatedTimeHours,
      damageCatalogId: item.damageCatalogId,
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editItem) {
        await catalogAPI.put(`/servicecatalog/${editItem.id}`, {
          name: form.name,
          description: form.description,
          category: form.category,
          attentionLevel: parseInt(form.attentionLevel),
          estimatedTimeHours: parseInt(form.estimatedTimeHours),
          damageCatalogId: parseInt(form.damageCatalogId),
        });
        setSuccess('Servicio actualizado correctamente');
      } else {
        await catalogAPI.post('/servicecatalog', {
          name: form.name,
          description: form.description,
          category: form.category,
          attentionLevel: parseInt(form.attentionLevel),
          estimatedTimeHours: parseInt(form.estimatedTimeHours),
          damageCatalogId: parseInt(form.damageCatalogId),
        });
        setSuccess('Servicio creado correctamente');
      }

      setTimeout(() => {
        closeModal();
        loadServices();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el servicio');
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar permanentemente el servicio "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await catalogAPI.delete(`/servicecatalog/${id}`);
      setSuccess('Servicio eliminado correctamente');
      loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el servicio');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getLevelName = (level) => {
    const names = {
      1: 'N1 - Técnico Básico',
      2: 'N2 - Técnico Profesional',
      3: 'N3 - DITIC',
      4: 'N4 - Proveedor Externo',
    };
    return names[level] || 'N1';
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#1565c0',
      2: '#00695c',
      3: '#6a1b9a',
      4: '#c62828',
    };
    return colors[level] || '#1565c0';
  };

  return (
    <Layout>
      <div className="service-catalog-page">
        <div className="service-catalog-header">
          <div>
            <h1 className="service-catalog-title">
              <Briefcase size={isMobile ? 24 : 28} />
              Catálogo de Servicios
            </h1>
            <p className="service-catalog-subtitle">Administra servicios y categorías tecnológicas</p>
          </div>
          <button className="service-catalog-new-btn" onClick={openCreateModal}>
            <Plus size={16} />
            Nuevo Servicio
          </button>
        </div>

        {success && (
          <div className="service-catalog-success">
            <CheckCircle size={18} />
            {success}
          </div>
        )}
        {error && !showModal && (
          <div className="service-catalog-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Barra de filtros */}
        <div className="service-catalog-filters-card">
          <div className="service-catalog-search-bar">
            <div className="service-catalog-search-wrapper">
              <Search size={16} className="service-catalog-search-icon" />
              <input
                className="service-catalog-search-input"
                placeholder={isMobile ? "Buscar..." : "Buscar servicio por nombre o categoría..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="service-catalog-clear-search" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="service-catalog-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} />
              Filtros
            </button>
          </div>

          <div className={`service-catalog-filters ${showFilters ? 'service-catalog-filters-open' : ''}`}>
            <div className="service-catalog-filter-group">
              <label className="service-catalog-filter-label">Nivel</label>
              <select className="service-catalog-filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                <option value="">Todos los niveles</option>
                <option value="1">N1 - Técnico Básico</option>
                <option value="2">N2 - Técnico Profesional</option>
                <option value="3">N3 - DITIC</option>
                <option value="4">N4 - Proveedor Externo</option>
              </select>
            </div>

            <div className="service-catalog-filter-group">
              <label className="service-catalog-filter-label">Tipo de Daño</label>
              <select className="service-catalog-filter-select" value={filterDamage} onChange={(e) => setFilterDamage(e.target.value)}>
                <option value="">Todos los tipos</option>
                {damages.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="service-catalog-stats">
              <Briefcase size={12} />
              {filteredServices.length} de {services.length} servicios
            </div>

            {hasFilters && (
              <button className="service-catalog-clear-filters" onClick={clearFilters}>
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="service-catalog-loading">
            <RefreshCw size={24} className="service-catalog-spinner" />
            <p>Cargando servicios...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="service-catalog-empty">
            <p>{hasFilters ? 'No hay servicios que coincidan con los filtros.' : 'No hay servicios registrados.'}</p>
          </div>
        ) : (
          <div className="service-catalog-table-card">
            <div className="service-catalog-table-wrapper">
              <table className="service-catalog-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Nivel</th>
                    <th>Tiempo Est.</th>
                    <th>Tipo de Daño</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((sItem) => (
                    <tr key={sItem.id}>
                      <td className="service-catalog-name">
                        <strong>{sItem.name}</strong>
                      </td>
                      <td>{sItem.category}</td>
                      <td>{sItem.description || '—'}</td>
                      <td>
                        <span className="service-catalog-level-badge" style={{ backgroundColor: getLevelColor(sItem.attentionLevel) }}>
                          <Shield size={12} style={{ marginRight: 4 }} />
                          {getLevelName(sItem.attentionLevel)}
                        </span>
                      </td>
                      <td>
                        <span className="service-catalog-time-badge">
                          <Clock size={12} style={{ marginRight: 4 }} />
                          {sItem.estimatedTimeHours}h
                        </span>
                      </td>
                      <td>{sItem.damageName || '—'}</td>
                      <td>
                        <div className="service-catalog-actions">
                          <button onClick={() => openEditModal(sItem)} className="service-catalog-edit-btn" title="Editar">
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button onClick={() => handleDelete(sItem.id, sItem.name)} className="service-catalog-delete-btn" title="Eliminar">
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CREAR/EDITAR SERVICIO RESPONSIVE */}
      {showModal && (
        <div className="service-catalog-modal-overlay" onClick={closeModal}>
          <div className="service-catalog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="service-catalog-modal-header">
              <div className="service-catalog-modal-header-icon">
                {editItem ? <Pencil size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
              </div>
              <div className="service-catalog-modal-header-text">
                <h2>{editItem ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                <p>{editItem ? 'Modifica los datos del servicio' : 'Completa los datos para crear un nuevo servicio'}</p>
              </div>
              <button className="service-catalog-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="service-catalog-modal-body">
                {error && (
                  <div className="service-catalog-modal-error">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="service-catalog-modal-field">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nombre del servicio"
                    required
                  />
                </div>

                <div className="service-catalog-modal-field">
                  <label>Categoría *</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Hardware, Software, Redes..."
                    required
                  />
                </div>

                <div className="service-catalog-modal-field full-width">
                  <label>Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descripción del servicio"
                    rows={3}
                  />
                </div>

                <div className="service-catalog-modal-field">
                  <label>Nivel de atención *</label>
                  <select
                    value={form.attentionLevel}
                    onChange={(e) => setForm({ ...form, attentionLevel: parseInt(e.target.value) })}
                  >
                    <option value={1}>N1 — Técnico Básico</option>
                    <option value={2}>N2 — Técnico Profesional</option>
                    <option value={3}>N3 — DITIC</option>
                    <option value={4}>N4 — Proveedor Externo</option>
                  </select>
                </div>

                <div className="service-catalog-modal-field">
                  <label>Tiempo estimado (horas) *</label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={form.estimatedTimeHours}
                    onChange={(e) => setForm({ ...form, estimatedTimeHours: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="service-catalog-modal-field">
                  <label>Categoría de daño *</label>
                  <select
                    value={form.damageCatalogId}
                    onChange={(e) => setForm({ ...form, damageCatalogId: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">-- Selecciona --</option>
                    {damages.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="service-catalog-modal-footer">
                <button type="button" className="service-catalog-modal-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="service-catalog-modal-save" disabled={saving}>
                  {saving ? 'Guardando...' : (editItem ? 'Guardar Cambios' : 'Crear Servicio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .service-catalog-page {
          padding: 28px 32px;
          flex: 1;
          min-height: 100vh;
          background-color: #f5f7fa;
        }

        .service-catalog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .service-catalog-title {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .service-catalog-subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .service-catalog-new-btn {
          background-color: #4361ee;
          color: #fff;
          border: none;
          padding: 12px 18px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .service-catalog-new-btn:hover {
          background-color: #304ffe;
          transform: translateY(-1px);
        }

        .service-catalog-success {
          background-color: #ecfdf3;
          color: #027a48;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .service-catalog-error {
          background-color: #fef3f2;
          color: #b42318;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .service-catalog-filters-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          padding: 16px 20px;
          margin-bottom: 24px;
        }

        .service-catalog-search-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .service-catalog-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .service-catalog-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .service-catalog-search-input {
          width: 100%;
          padding: 10px 16px 10px 38px;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
          font-size: 14px;
          outline: none;
          background: #f9fafb;
        }

        .service-catalog-search-input:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .service-catalog-clear-search {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
        }

        .service-catalog-filter-toggle {
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

        .service-catalog-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 16px;
        }

        .service-catalog-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }

        .service-catalog-filter-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .service-catalog-filter-select {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d0d5dd;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
        }

        .service-catalog-filter-select:focus {
          border-color: #4361ee;
          outline: none;
        }

        .service-catalog-stats {
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

        .service-catalog-clear-filters {
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

        .service-catalog-clear-filters:hover {
          background: #fee2e2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .service-catalog-table-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          overflow: hidden;
        }

        .service-catalog-table-wrapper {
          overflow-x: auto;
        }

        .service-catalog-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .service-catalog-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #667085;
          background: #f9fafb;
          border-bottom: 1px solid #eaecf0;
        }

        .service-catalog-table td {
          padding: 18px 20px;
          font-size: 14px;
          color: #344054;
          border-bottom: 1px solid #f1f3f5;
        }

        .service-catalog-table tr:hover td {
          background-color: #f9fafb;
        }

        .service-catalog-name {
          font-weight: 600;
        }

        .service-catalog-level-badge {
          color: #fff;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .service-catalog-time-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .service-catalog-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .service-catalog-edit-btn {
          background: #4361ee;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .service-catalog-edit-btn:hover {
          background: #304ffe;
          transform: translateY(-1px);
        }

        .service-catalog-delete-btn {
          background: #dc2626;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .service-catalog-delete-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .service-catalog-loading, .service-catalog-empty {
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

        .service-catalog-spinner {
          animation: spin 1s linear infinite;
        }

        /* Modal Responsive */
        .service-catalog-modal-overlay {
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

        .service-catalog-modal {
          background: #fff;
          border-radius: 24px;
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .service-catalog-modal-header {
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

        .service-catalog-modal-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-catalog-modal-header-text {
          flex: 1;
        }

        .service-catalog-modal-header-text h2 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .service-catalog-modal-header-text p {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          margin-top: 4px;
        }

        .service-catalog-modal-close {
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

        .service-catalog-modal-close:hover {
          background: rgba(255,255,255,0.3);
        }

        .service-catalog-modal-body {
          padding: 24px;
        }

        .service-catalog-modal-field {
          margin-bottom: 20px;
        }

        .service-catalog-modal-field.full-width {
          grid-column: 1 / -1;
        }

        .service-catalog-modal-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .service-catalog-modal-field input,
        .service-catalog-modal-field select,
        .service-catalog-modal-field textarea {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: border 0.2s, box-shadow 0.2s;
        }

        .service-catalog-modal-field input:focus,
        .service-catalog-modal-field select:focus,
        .service-catalog-modal-field textarea:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .service-catalog-modal-field textarea {
          resize: vertical;
        }

        .service-catalog-modal-error {
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

        .service-catalog-modal-footer {
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

        .service-catalog-modal-cancel {
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

        .service-catalog-modal-cancel:hover {
          background: #f3f4f6;
        }

        .service-catalog-modal-save {
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

        .service-catalog-modal-save:hover {
          background: #304ffe;
          transform: translateY(-1px);
        }

        .service-catalog-modal-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .service-catalog-page {
            padding: 70px 12px 20px 12px;
          }

          .service-catalog-title {
            font-size: 22px;
          }

          .service-catalog-subtitle {
            font-size: 12px;
          }

          .service-catalog-filter-toggle {
            display: flex;
          }

          .service-catalog-filters {
            display: none;
            flex-direction: column;
            width: 100%;
          }

          .service-catalog-filters-open {
            display: flex;
          }

          .service-catalog-filter-group {
            width: 100%;
          }

          .service-catalog-filter-select {
            width: 100%;
          }

          .service-catalog-stats {
            margin-left: 0;
            justify-content: center;
            width: 100%;
          }

          .service-catalog-clear-filters {
            width: 100%;
            justify-content: center;
          }

          .service-catalog-actions {
            flex-direction: column;
          }

          .service-catalog-edit-btn,
          .service-catalog-delete-btn {
            width: 100%;
            justify-content: center;
          }

          .service-catalog-table th,
          .service-catalog-table td {
            padding: 12px 16px;
          }

          .service-catalog-modal {
            max-width: 95%;
          }

          .service-catalog-modal-header {
            padding: 16px 20px;
          }

          .service-catalog-modal-header-icon {
            width: 40px;
            height: 40px;
          }

          .service-catalog-modal-header-text h2 {
            font-size: 16px;
          }

          .service-catalog-modal-body {
            padding: 20px;
          }

          .service-catalog-modal-footer {
            flex-direction: column;
          }

          .service-catalog-modal-cancel,
          .service-catalog-modal-save {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </Layout>
  );
}

export default ServiceCatalogPage;