import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    BookOpen,
    Eye,
    Calendar,
    User,
    X,
    FileText,
    AlertCircle,
    CheckCircle,
    Lightbulb,
    Tag,
    Pencil,
    Trash2,
    RefreshCw,
    FileSpreadsheet,
    RotateCcw,
    Filter
} from 'lucide-react';
import Layout from '../../components/Layout';
import { catalogAPI } from '../../services/api';
import * as XLSX from 'xlsx';

const COLORS = {
    Primario: '#2d6a9f',
    PrimarioOscuro: '#1e3a5f',
    PrimarioLight: '#eef2ff',
    Exito: '#10b981',
    Advertencia: '#f59e0b',
    Error: '#ef4444',
    Texto: '#1a1a2e',
    TextoSecundario: '#6b7280',
    Borde: '#e4e7eb',
    Fondo: '#f5f7fa',
};

function AdminKnowledge() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showFilters, setShowFilters] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: '',
        problem: '',
        cause: '',
        solution: '',
        category: '',
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadArticles();
        loadCategories();
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        try {
            const res = await catalogAPI.get('/knowledge?includeInactive=true');
            setArticles(res.data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar artículos');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await catalogAPI.get('/knowledge/categories');
            setCategories(res.data);
        } catch {
            setCategories(['Software', 'Hardware', 'Redes', 'Correo', 'Cuentas']);
        }
    };

    const filteredArticles = useMemo(() => {
        let filtered = articles.filter(a => {
            const matchSearch = search === '' ||
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.problem.toLowerCase().includes(search.toLowerCase()) ||
                a.solution.toLowerCase().includes(search.toLowerCase());
            const matchCategory = selectedCategory === '' || a.category === selectedCategory;
            return matchSearch && matchCategory;
        });

        if (!showInactive) {
            filtered = filtered.filter(a => a.isActive !== false);
        }

        return filtered;
    }, [articles, search, selectedCategory, showInactive]);

    const openEditModal = (article) => {
        setEditingArticle(article);
        setForm({
            title: article.title,
            problem: article.problem,
            cause: article.cause,
            solution: article.solution,
            category: article.category,
        });
        setEditModalOpen(true);
        setError('');
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setEditingArticle(null);
        setForm({
            title: '',
            problem: '',
            cause: '',
            solution: '',
            category: '',
        });
        setError('');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await catalogAPI.put(`/knowledge/${editingArticle.id}`, {
                title: form.title,
                problem: form.problem,
                cause: form.cause,
                solution: form.solution,
                category: form.category,
            });
            setSuccess('Artículo actualizado correctamente');
            setTimeout(() => {
                closeEditModal();
                loadArticles();
                setSuccess('');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al actualizar artículo');
            setSaving(false);
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`¿Desactivar el artículo "${title}"? Los usuarios ya no lo verán, pero podrás reactivarlo después.`)) return;
        try {
            await catalogAPI.delete(`/knowledge/${id}`);
            setSuccess('Artículo desactivado correctamente');
            loadArticles();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al desactivar artículo');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleReactivate = async (id, title) => {
        if (!window.confirm(`¿Reactivar el artículo "${title}"? Volverá a estar disponible para los usuarios.`)) return;
        try {
            await catalogAPI.post(`/knowledge/${id}/reactivate`);
            setSuccess('Artículo reactivado correctamente');
            loadArticles();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al reactivar artículo');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleExportExcel = () => {
        const exportData = filteredArticles.map(a => ({
            'Título': a.title,
            'Categoría': a.category,
            'Problema': a.problem,
            'Causa': a.cause,
            'Solución': a.solution,
            'Ticket': a.ticketNumber,
            'Creado por': a.createdByName,
            'Fecha': new Date(a.createdAt).toLocaleDateString('es-EC'),
            'Vistas': a.viewCount || 0,
            'Estado': a.isActive !== false ? 'Activo' : 'Inactivo',
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Base_Conocimiento');
        XLSX.writeFile(workbook, `Base_Conocimiento_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('');
    };

    const hasActiveFilters = search !== '' || selectedCategory !== '';
    const inactiveCount = articles.filter(a => a.isActive === false).length;

    return (
        <Layout>
            <div className="admin-knowledge-page">
                {/* Header */}
                <div className="admin-knowledge-header">
                    <div>
                        <h1 className="admin-knowledge-title">
                            <BookOpen size={isMobile ? 24 : 28} />
                            Gestión de Base de Conocimiento
                        </h1>
                        <p className="admin-knowledge-subtitle">
                            Administra los artículos, edita, desactiva o reactiva soluciones documentadas
                        </p>
                    </div>
                    <button className="admin-knowledge-refresh-btn" onClick={loadArticles}>
                        <RefreshCw size={16} />
                        Actualizar
                    </button>
                </div>

                {success && (
                    <div className="admin-knowledge-success">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}
                {error && (
                    <div className="admin-knowledge-error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Barra de filtros */}
                <div className="admin-knowledge-filters-card">
                    <div className="admin-knowledge-search-bar">
                        <div className="admin-knowledge-search-wrapper">
                            <Search size={16} className="admin-knowledge-search-icon" />
                            <input
                                className="admin-knowledge-search-input"
                                placeholder={isMobile ? "Buscar..." : "Buscar por título, problema o solución..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button className="admin-knowledge-clear-search" onClick={() => setSearch('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button className="admin-knowledge-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={14} />
                            Filtros
                        </button>
                    </div>

                    <div className={`admin-knowledge-filters ${showFilters ? 'admin-knowledge-filters-open' : ''}`}>
                        <div className="admin-knowledge-filter-group">
                            <label className="admin-knowledge-filter-label">Categoría</label>
                            <select className="admin-knowledge-filter-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value="">Todas las categorías</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={() => setShowInactive(!showInactive)}
                            className={`admin-knowledge-toggle-btn ${showInactive ? 'admin-knowledge-toggle-active' : ''}`}
                        >
                            <Eye size={14} />
                            {showInactive ? "Ocultar inactivos" : "Mostrar inactivos"}
                            {inactiveCount > 0 && <span className="admin-knowledge-inactive-count"> ({inactiveCount})</span>}
                        </button>

                        <div className="admin-knowledge-filter-info">
                            <div className="admin-knowledge-result-count">
                                <BookOpen size={12} />
                                {filteredArticles.length} de {articles.length}
                            </div>
                            <button onClick={handleExportExcel} className="admin-knowledge-export-btn">
                                <FileSpreadsheet size={14} />
                                Excel
                            </button>
                        </div>

                        {hasActiveFilters && (
                            <button className="admin-knowledge-clear-filters" onClick={clearFilters}>
                                <X size={14} />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabla de artículos */}
                {loading ? (
                    <div className="admin-knowledge-loading">
                        <RefreshCw size={32} className="admin-knowledge-spinner" />
                        <p>Cargando artículos...</p>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="admin-knowledge-empty">
                        <BookOpen size={48} color={COLORS.TextoSecundario} />
                        <p>{hasActiveFilters ? 'No hay artículos que coincidan con los filtros.' : 'No hay artículos en la base de conocimiento.'}</p>
                    </div>
                ) : (
                    <div className="admin-knowledge-table-card">
                        <div className="admin-knowledge-table-wrapper">
                            <table className="admin-knowledge-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Categoría</th>
                                        <th>Ticket</th>
                                        <th>Creado por</th>
                                        <th>Fecha</th>
                                        <th>Vistas</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredArticles.map((a) => (
                                        <tr key={a.id}>
                                            <td>
                                                <div className="admin-knowledge-article-title">{a.title}</div>
                                                <div className="admin-knowledge-article-preview">{a.problem?.substring(0, 60)}...</div>
                                            </td>
                                            <td><span className="admin-knowledge-category-badge">{a.category}</span></td>
                                            <td><span className="admin-knowledge-ticket-number">{a.ticketNumber}</span></td>
                                            <td>
                                                <div className="admin-knowledge-user-cell">
                                                    <User size={12} />
                                                    <span>{a.createdByName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="admin-knowledge-date-cell">
                                                    <Calendar size={12} />
                                                    <span>{new Date(a.createdAt).toLocaleDateString('es-EC')}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="admin-knowledge-view-cell">
                                                    <Eye size={12} />
                                                    <span>{a.viewCount || 0}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {a.isActive !== false ? (
                                                    <span className="admin-knowledge-active-badge">Activo</span>
                                                ) : (
                                                    <span className="admin-knowledge-inactive-badge">Inactivo</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="admin-knowledge-actions">
                                                    <button onClick={() => openEditModal(a)} className="admin-knowledge-edit-btn" title="Editar">
                                                        <Pencil size={15} color={COLORS.Primario} />
                                                    </button>
                                                    {a.isActive !== false ? (
                                                        <button onClick={() => handleDelete(a.id, a.title)} className="admin-knowledge-delete-btn" title="Desactivar">
                                                            <Trash2 size={15} color={COLORS.Error} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleReactivate(a.id, a.title)} className="admin-knowledge-reactivate-btn" title="Reactivar">
                                                            <RotateCcw size={15} color={COLORS.Exito} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => navigate(`/conocimiento`)} className="admin-knowledge-view-btn" title="Ver">
                                                        <Eye size={15} color={COLORS.TextoSecundario} />
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

            {/* MODAL DE EDICIÓN RESPONSIVE */}
            {editModalOpen && editingArticle && (
                <div className="admin-knowledge-modal-overlay" onClick={closeEditModal}>
                    <div className="admin-knowledge-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-knowledge-modal-header">
                            <div className="admin-knowledge-modal-header-icon">
                                <Pencil size={24} color="#fff" />
                            </div>
                            <div className="admin-knowledge-modal-header-text">
                                <h2>Editar Artículo</h2>
                                <p>Modifica la información del artículo de conocimiento</p>
                            </div>
                            <button className="admin-knowledge-modal-close" onClick={closeEditModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate}>
                            <div className="admin-knowledge-modal-body">
                                {error && (
                                    <div className="admin-knowledge-modal-error">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <div className="admin-knowledge-modal-field full-width">
                                    <label>Título *</label>
                                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                </div>

                                <div className="admin-knowledge-modal-field full-width">
                                    <label>Categoría *</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>

                                <div className="admin-knowledge-modal-field full-width">
                                    <label>Problema y síntomas *</label>
                                    <textarea value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} rows={4} required />
                                </div>

                                <div className="admin-knowledge-modal-field full-width">
                                    <label>Causa raíz *</label>
                                    <textarea value={form.cause} onChange={(e) => setForm({ ...form, cause: e.target.value })} rows={3} required />
                                </div>

                                <div className="admin-knowledge-modal-field full-width">
                                    <label>Solución aplicada *</label>
                                    <textarea value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} rows={4} required />
                                </div>
                            </div>

                            <div className="admin-knowledge-modal-footer">
                                <button type="button" className="admin-knowledge-modal-cancel" onClick={closeEditModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="admin-knowledge-modal-save" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .admin-knowledge-page {
                    padding: 28px 32px;
                    flex: 1;
                    background-color: ${COLORS.Fondo};
                    min-height: 100vh;
                }

                .admin-knowledge-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .admin-knowledge-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: ${COLORS.Texto};
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .admin-knowledge-subtitle {
                    font-size: 13px;
                    color: ${COLORS.TextoSecundario};
                }

                .admin-knowledge-refresh-btn {
                    background: #fff;
                    border: 1px solid #d1d5db;
                    color: #374151;
                    padding: 10px 18px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .admin-knowledge-success {
                    background-color: #ecfdf3;
                    color: #027a48;
                    padding: 14px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .admin-knowledge-error {
                    background-color: #fef3f2;
                    color: #b42318;
                    padding: 14px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .admin-knowledge-filters-card {
                    background: #fff;
                    border-radius: 16px;
                    border: 1px solid #eaecf0;
                    padding: 16px 20px;
                    margin-bottom: 20px;
                }

                .admin-knowledge-search-bar {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .admin-knowledge-search-wrapper {
                    position: relative;
                    flex: 1;
                    min-width: 200px;
                }

                .admin-knowledge-search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                }

                .admin-knowledge-search-input {
                    width: 100%;
                    padding: 10px 16px 10px 38px;
                    border-radius: 12px;
                    border: 1px solid #e4e7eb;
                    font-size: 14px;
                    outline: none;
                    background-color: #f9fafb;
                }

                .admin-knowledge-search-input:focus {
                    border-color: ${COLORS.Primario};
                    box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
                }

                .admin-knowledge-clear-search {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #9ca3af;
                }

                .admin-knowledge-filter-toggle {
                    display: none;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    background: #fff;
                    border: 1px solid #e4e7eb;
                    border-radius: 10px;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                }

                .admin-knowledge-filters {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    align-items: center;
                    margin-top: 16px;
                }

                .admin-knowledge-filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 180px;
                }

                .admin-knowledge-filter-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                }

                .admin-knowledge-filter-select {
                    padding: 10px 14px;
                    border-radius: 10px;
                    border: 1px solid #d0d5dd;
                    font-size: 14px;
                    background: #fff;
                    cursor: pointer;
                }

                .admin-knowledge-toggle-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 16px;
                    border-radius: 10px;
                    border: 1px solid #d1d5db;
                    background: #fff;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                }

                .admin-knowledge-toggle-active {
                    background: ${COLORS.PrimarioLight};
                    border-color: ${COLORS.Primario};
                    color: ${COLORS.Primario};
                }

                .admin-knowledge-inactive-count {
                    font-size: 11px;
                    font-weight: 600;
                }

                .admin-knowledge-filter-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-left: auto;
                }

                .admin-knowledge-result-count {
                    font-size: 13px;
                    color: #6b7280;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #f9fafb;
                    padding: 8px 14px;
                    border-radius: 10px;
                }

                .admin-knowledge-export-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border-radius: 10px;
                    border: 1px solid #10b981;
                    background: #fff;
                    color: #10b981;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                }

                .admin-knowledge-clear-filters {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border-radius: 10px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #dc2626;
                    cursor: pointer;
                    font-size: 13px;
                }

                .admin-knowledge-table-card {
                    width: 100%;
                    background: #fff;
                    border-radius: 16px;
                    border: 1px solid #eaecf0;
                    overflow: hidden;
                }

                .admin-knowledge-table-wrapper {
                    overflow-x: auto;
                }

                .admin-knowledge-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 800px;
                }

                .admin-knowledge-table th {
                    padding: 16px 20px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 700;
                    color: #667085;
                    background: #f9fafb;
                    border-bottom: 1px solid #eaecf0;
                }

                .admin-knowledge-table td {
                    padding: 16px 20px;
                    font-size: 13px;
                    color: #344054;
                    border-bottom: 1px solid #f1f3f5;
                }

                .admin-knowledge-article-title {
                    font-weight: 600;
                    color: #1a1a2e;
                    margin-bottom: 4px;
                }

                .admin-knowledge-article-preview {
                    font-size: 11px;
                    color: #9ca3af;
                }

                .admin-knowledge-category-badge {
                    background: ${COLORS.PrimarioLight};
                    color: ${COLORS.Primario};
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    display: inline-block;
                }

                .admin-knowledge-ticket-number {
                    font-weight: 700;
                    color: ${COLORS.Primario};
                    font-family: monospace;
                }

                .admin-knowledge-user-cell, .admin-knowledge-date-cell, .admin-knowledge-view-cell {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .admin-knowledge-active-badge {
                    background: #ecfdf5;
                    color: #10b981;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .admin-knowledge-inactive-badge {
                    background: #fef2f2;
                    color: #dc2626;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .admin-knowledge-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .admin-knowledge-edit-btn, .admin-knowledge-delete-btn, .admin-knowledge-reactivate-btn, .admin-knowledge-view-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    transition: background 0.2s;
                }

                .admin-knowledge-edit-btn:hover, .admin-knowledge-delete-btn:hover, .admin-knowledge-reactivate-btn:hover, .admin-knowledge-view-btn:hover {
                    background-color: #f3f4f6;
                }

                .admin-knowledge-loading, .admin-knowledge-empty {
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

                .admin-knowledge-spinner {
                    animation: spin 1s linear infinite;
                }

                .admin-knowledge-modal-overlay {
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

                .admin-knowledge-modal {
                    background: #fff;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 750px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }

                .admin-knowledge-modal-header {
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

                .admin-knowledge-modal-header-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 24px;
                    background: rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .admin-knowledge-modal-header-text {
                    flex: 1;
                }

                .admin-knowledge-modal-header-text h2 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0;
                }

                .admin-knowledge-modal-header-text p {
                    font-size: 13px;
                    color: rgba(255,255,255,0.8);
                    margin-top: 4px;
                }

                .admin-knowledge-modal-close {
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

                .admin-knowledge-modal-body {
                    padding: 24px;
                }

                .admin-knowledge-modal-field {
                    margin-bottom: 20px;
                }

                .admin-knowledge-modal-field.full-width {
                    grid-column: 1 / -1;
                }

                .admin-knowledge-modal-field label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                }

                .admin-knowledge-modal-field input,
                .admin-knowledge-modal-field select,
                .admin-knowledge-modal-field textarea {
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: 10px;
                    border: 1px solid #d1d5db;
                    font-size: 14px;
                    outline: none;
                    font-family: inherit;
                }

                .admin-knowledge-modal-field textarea {
                    resize: vertical;
                }

                .admin-knowledge-modal-field input:focus,
                .admin-knowledge-modal-field select:focus,
                .admin-knowledge-modal-field textarea:focus {
                    border-color: ${COLORS.Primario};
                    box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
                }

                .admin-knowledge-modal-error {
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

                .admin-knowledge-modal-footer {
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

                .admin-knowledge-modal-cancel {
                    padding: 10px 20px;
                    background: #fff;
                    border: 1px solid #d1d5db;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    cursor: pointer;
                }

                .admin-knowledge-modal-save {
                    padding: 10px 24px;
                    background: ${COLORS.Primario};
                    border: none;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #fff;
                    cursor: pointer;
                }

                .admin-knowledge-modal-save:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .admin-knowledge-page {
                        padding: 70px 12px 20px 12px;
                    }

                    .admin-knowledge-title {
                        font-size: 22px;
                    }

                    .admin-knowledge-subtitle {
                        font-size: 11px;
                    }

                    .admin-knowledge-filter-toggle {
                        display: flex;
                    }

                    .admin-knowledge-filters {
                        display: none;
                        flex-direction: column;
                        width: 100%;
                    }

                    .admin-knowledge-filters-open {
                        display: flex;
                    }

                    .admin-knowledge-filter-group {
                        width: 100%;
                    }

                    .admin-knowledge-filter-select {
                        width: 100%;
                    }

                    .admin-knowledge-toggle-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .admin-knowledge-filter-info {
                        margin-left: 0;
                        flex-direction: column;
                        width: 100%;
                    }

                    .admin-knowledge-result-count, 
                    .admin-knowledge-export-btn, 
                    .admin-knowledge-clear-filters {
                        width: 100%;
                        justify-content: center;
                    }

                    .admin-knowledge-table th, 
                    .admin-knowledge-table td {
                        padding: 12px 16px;
                    }

                    .admin-knowledge-modal {
                        max-width: 95%;
                    }

                    .admin-knowledge-modal-header {
                        padding: 16px 20px;
                    }

                    .admin-knowledge-modal-header-icon {
                        width: 40px;
                        height: 40px;
                    }

                    .admin-knowledge-modal-header-text h2 {
                        font-size: 16px;
                    }

                    .admin-knowledge-modal-body {
                        padding: 20px;
                    }

                    .admin-knowledge-modal-footer {
                        flex-direction: column;
                    }

                    .admin-knowledge-modal-cancel,
                    .admin-knowledge-modal-save {
                        width: 100%;
                        text-align: center;
                    }

                    .admin-knowledge-actions {
                        justify-content: center;
                    }
                }
            `}</style>
        </Layout>
    );
}

export default AdminKnowledge;