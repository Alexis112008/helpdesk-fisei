import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  UserCheck,
  UserX
} from 'lucide-react';
import { catalogAPI } from '../../services/api';
import Layout from '../../components/Layout';

function DamageCatalogPage() {
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
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCode, setFilterCode] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    code: '',
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadDamages();
  }, []);

  const loadDamages = () => {
    setLoading(true);
    catalogAPI
      .get('/damagecatalog')
      .then((res) => setDamages(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredDamages = useMemo(() => {
    return damages.filter((d) => {
      const matchSearch =
        search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === '' ||
        (filterStatus === 'activo' && d.isActive) ||
        (filterStatus === 'inactivo' && !d.isActive);
      const matchCode =
        filterCode === '' ||
        d.code?.toLowerCase().includes(filterCode.toLowerCase());
      return matchSearch && matchStatus && matchCode;
    });
  }, [damages, search, filterStatus, filterCode]);

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterCode('');
  };

  const hasFilters = search !== '' || filterStatus !== '' || filterCode !== '';

  const openCreateModal = () => {
    setEditItem(null);
    setForm({ name: '', description: '', code: '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      code: item.code || '',
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
        await catalogAPI.put(`/damagecatalog/${editItem.id}`, {
          code: form.code,
          name: form.name,
          description: form.description,
        });
        setSuccess('Categoría actualizada correctamente');
      } else {
        await catalogAPI.post('/damagecatalog', {
          code: form.code,
          name: form.name,
          description: form.description,
        });
        setSuccess('Categoría creada correctamente');
      }

      setTimeout(() => {
        closeModal();
        loadDamages();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la categoría');
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar permanentemente la categoría "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await catalogAPI.delete(`/damagecatalog/${id}`);
      setSuccess('Categoría eliminada correctamente');
      loadDamages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la categoría');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return {
        bg: '#ecfdf5',
        color: '#10b981',
        icon: <CheckCircle size={12} style={{ marginRight: 4 }} />,
        text: 'Activo'
      };
    }
    return {
      bg: '#fef2f2',
      color: '#dc2626',
      icon: <UserX size={12} style={{ marginRight: 4 }} />,
      text: 'Inactivo'
    };
  };

  return (
    <Layout>
      <div className="damage-catalog-page">
        <div className="damage-catalog-header">
          <div>
            <h1 className="damage-catalog-title">
              <Package size={isMobile ? 24 : 28} />
              Catálogo de Daños
            </h1>
            <p className="damage-catalog-subtitle">Categorías de incidencias y averías</p>
          </div>
          <button className="damage-catalog-new-btn" onClick={openCreateModal}>
            <Plus size={16} />
            Nueva Categoría
          </button>
        </div>

        {success && (
          <div className="damage-catalog-success">
            <CheckCircle size={18} />
            {success}
          </div>
        )}
        {error && !showModal && (
          <div className="damage-catalog-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Barra de filtros */}
        <div className="damage-catalog-filters-card">
          <div className="damage-catalog-search-bar">
            <div className="damage-catalog-search-wrapper">
              <Search size={16} className="damage-catalog-search-icon" />
              <input
                className="damage-catalog-search-input"
                placeholder={isMobile ? "Buscar..." : "Buscar por nombre..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="damage-catalog-clear-search" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="damage-catalog-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} />
              Filtros
            </button>
          </div>

          <div className={`damage-catalog-filters ${showFilters ? 'damage-catalog-filters-open' : ''}`}>
            <div className="damage-catalog-filter-group">
              <label className="damage-catalog-filter-label">Código</label>
              <select
                className="damage-catalog-filter-select"
                value={filterCode}
                onChange={(e) => setFilterCode(e.target.value)}
              >
                <option value="">Todos los códigos</option>
                {[...new Set(damages.map(d => d.code).filter(Boolean))].map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <div className="damage-catalog-filter-group">
              <label className="damage-catalog-filter-label">Estado</label>
              <select
                className="damage-catalog-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="damage-catalog-stats">
              <Package size={12} />
              {filteredDamages.length} de {damages.length} categorías
            </div>

            {hasFilters && (
              <button className="damage-catalog-clear-filters" onClick={clearFilters}>
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="damage-catalog-loading">
            <RefreshCw size={24} className="damage-catalog-spinner" />
            <p>Cargando categorías...</p>
          </div>
        ) : filteredDamages.length === 0 ? (
          <div className="damage-catalog-empty">
            <p>{hasFilters ? 'No hay categorías que coincidan con los filtros.' : 'No hay categorías registradas.'}</p>
          </div>
        ) : (
          <div className="damage-catalog-table-card">
            <div className="damage-catalog-table-wrapper">
              <table className="damage-catalog-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Código</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDamages.map((d) => {
                    const status = getStatusBadge(d.isActive);
                    return (
                      <tr key={d.id}>
                        <td className="damage-catalog-name">
                          <strong>{d.name}</strong>
                        </td>
                        <td>{d.description || '—'}</td>
                        <td><span className="damage-catalog-code-badge">{d.code || '—'}</span></td>
                        <td>
                          <span className="damage-catalog-status-badge" style={{ backgroundColor: status.bg, color: status.color }}>
                            {status.icon}
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <div className="damage-catalog-actions">
                            <button onClick={() => openEditModal(d)} className="damage-catalog-edit-btn" title="Editar">
                              <Edit size={14} />
                              Editar
                            </button>
                            <button onClick={() => handleDelete(d.id, d.name)} className="damage-catalog-delete-btn" title="Eliminar">
                              <Trash2 size={14} />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CREAR/EDITAR CATEGORÍA RESPONSIVE */}
      {showModal && (
        <div className="damage-catalog-modal-overlay" onClick={closeModal}>
          <div className="damage-catalog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="damage-catalog-modal-header">
              <div className="damage-catalog-modal-header-icon">
                {editItem ? <Edit size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
              </div>
              <div className="damage-catalog-modal-header-text">
                <h2>{editItem ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                <p>{editItem ? 'Modifica los datos de la categoría' : 'Completa los datos para crear una nueva categoría'}</p>
              </div>
              <button className="damage-catalog-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="damage-catalog-modal-body">
                {error && (
                  <div className="damage-catalog-modal-error">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="damage-catalog-modal-field">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Hardware, Software, Redes"
                    required
                  />
                </div>

                <div className="damage-catalog-modal-field">
                  <label>Código *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="Ej: HW, SW, RED"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="damage-catalog-modal-field full-width">
                  <label>Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descripción de la categoría"
                    rows={3}
                  />
                </div>
              </div>

              <div className="damage-catalog-modal-footer">
                <button type="button" className="damage-catalog-modal-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="damage-catalog-modal-save" disabled={saving}>
                  {saving ? 'Guardando...' : (editItem ? 'Guardar Cambios' : 'Crear Categoría')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .damage-catalog-page {
          padding: 28px 32px;
          flex: 1;
          min-height: 100vh;
          background-color: #f5f7fa;
        }

        .damage-catalog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .damage-catalog-title {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .damage-catalog-subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .damage-catalog-new-btn {
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
        }

        .damage-catalog-success {
          background-color: #ecfdf3;
          color: #027a48;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .damage-catalog-error {
          background-color: #fef3f2;
          color: #b42318;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .damage-catalog-filters-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          padding: 16px 20px;
          margin-bottom: 24px;
        }

        .damage-catalog-search-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .damage-catalog-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .damage-catalog-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .damage-catalog-search-input {
          width: 100%;
          padding: 10px 16px 10px 38px;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
          font-size: 14px;
          outline: none;
          background: #f9fafb;
        }

        .damage-catalog-search-input:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .damage-catalog-clear-search {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
        }

        .damage-catalog-filter-toggle {
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

        .damage-catalog-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 16px;
        }

        .damage-catalog-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }

        .damage-catalog-filter-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .damage-catalog-filter-select {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d0d5dd;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
        }

        .damage-catalog-filter-select:focus {
          border-color: #4361ee;
          outline: none;
        }

        .damage-catalog-stats {
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

        .damage-catalog-clear-filters {
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

        .damage-catalog-clear-filters:hover {
          background: #fee2e2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .damage-catalog-table-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eaecf0;
          overflow: hidden;
        }

        .damage-catalog-table-wrapper {
          overflow-x: auto;
        }

        .damage-catalog-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 650px;
        }

        .damage-catalog-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #667085;
          background: #f9fafb;
          border-bottom: 1px solid #eaecf0;
        }

        .damage-catalog-table td {
          padding: 18px 20px;
          font-size: 14px;
          color: #344054;
          border-bottom: 1px solid #f1f3f5;
        }

        .damage-catalog-table tr:hover td {
          background-color: #f9fafb;
        }

        .damage-catalog-name {
          font-weight: 600;
        }

        .damage-catalog-code-badge {
          background: #eef2ff;
          color: #4361ee;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          font-family: monospace;
          display: inline-block;
        }

        .damage-catalog-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .damage-catalog-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .damage-catalog-edit-btn {
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

        .damage-catalog-edit-btn:hover {
          background: #304ffe;
          transform: translateY(-1px);
        }

        .damage-catalog-delete-btn {
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

        .damage-catalog-delete-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .damage-catalog-loading, .damage-catalog-empty {
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

        .damage-catalog-spinner {
          animation: spin 1s linear infinite;
        }

        /* Modal Responsive */
        .damage-catalog-modal-overlay {
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

        .damage-catalog-modal {
          background: #fff;
          border-radius: 24px;
          width: 100%;
          max-width: 550px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .damage-catalog-modal-header {
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

        .damage-catalog-modal-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .damage-catalog-modal-header-text {
          flex: 1;
        }

        .damage-catalog-modal-header-text h2 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .damage-catalog-modal-header-text p {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          margin-top: 4px;
        }

        .damage-catalog-modal-close {
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

        .damage-catalog-modal-close:hover {
          background: rgba(255,255,255,0.3);
        }

        .damage-catalog-modal-body {
          padding: 24px;
        }

        .damage-catalog-modal-field {
          margin-bottom: 20px;
        }

        .damage-catalog-modal-field.full-width {
          grid-column: 1 / -1;
        }

        .damage-catalog-modal-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .damage-catalog-modal-field input,
        .damage-catalog-modal-field select,
        .damage-catalog-modal-field textarea {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: border 0.2s, box-shadow 0.2s;
        }

        .damage-catalog-modal-field input:focus,
        .damage-catalog-modal-field select:focus,
        .damage-catalog-modal-field textarea:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .damage-catalog-modal-field textarea {
          resize: vertical;
        }

        .damage-catalog-modal-error {
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

        .damage-catalog-modal-footer {
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

        .damage-catalog-modal-cancel {
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

        .damage-catalog-modal-cancel:hover {
          background: #f3f4f6;
        }

        .damage-catalog-modal-save {
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

        .damage-catalog-modal-save:hover {
          background: #304ffe;
          transform: translateY(-1px);
        }

        .damage-catalog-modal-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .damage-catalog-page {
            padding: 70px 12px 20px 12px;
          }

          .damage-catalog-title {
            font-size: 22px;
          }

          .damage-catalog-subtitle {
            font-size: 12px;
          }

          .damage-catalog-filter-toggle {
            display: flex;
          }

          .damage-catalog-filters {
            display: none;
            flex-direction: column;
            width: 100%;
          }

          .damage-catalog-filters-open {
            display: flex;
          }

          .damage-catalog-filter-group {
            width: 100%;
          }

          .damage-catalog-filter-select {
            width: 100%;
          }

          .damage-catalog-stats {
            margin-left: 0;
            justify-content: center;
            width: 100%;
          }

          .damage-catalog-clear-filters {
            width: 100%;
            justify-content: center;
          }

          .damage-catalog-actions {
            flex-direction: column;
          }

          .damage-catalog-edit-btn,
          .damage-catalog-delete-btn {
            width: 100%;
            justify-content: center;
          }

          .damage-catalog-table th,
          .damage-catalog-table td {
            padding: 12px 16px;
          }

          .damage-catalog-modal {
            max-width: 95%;
          }

          .damage-catalog-modal-header {
            padding: 16px 20px;
          }

          .damage-catalog-modal-header-icon {
            width: 40px;
            height: 40px;
          }

          .damage-catalog-modal-header-text h2 {
            font-size: 16px;
          }

          .damage-catalog-modal-body {
            padding: 20px;
          }

          .damage-catalog-modal-footer {
            flex-direction: column;
          }

          .damage-catalog-modal-cancel,
          .damage-catalog-modal-save {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </Layout>
  );
}

export default DamageCatalogPage;