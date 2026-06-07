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
    RotateCcw
} from 'lucide-react';
import Layout from '../../components/Layout';
import { catalogAPI } from '../../services/api';
import * as XLSX from 'xlsx';

// Colores unificados
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

    // Modal de edición
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [saving, setSaving] = useState(false);

    // Formulario de edición
    const [form, setForm] = useState({
        title: '',
        problem: '',
        cause: '',
        solution: '',
        category: '',
    });

    useEffect(() => {
        loadArticles();
        loadCategories();
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        try {
            // ✅ Traer todos los artículos (activos e inactivos) para el admin
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

    // Filtrar artículos (incluye filtro por inactivos si está activado)
    const filteredArticles = useMemo(() => {
        let filtered = articles.filter(a => {
            const matchSearch = search === '' ||
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.problem.toLowerCase().includes(search.toLowerCase()) ||
                a.solution.toLowerCase().includes(search.toLowerCase());
            const matchCategory = selectedCategory === '' || a.category === selectedCategory;
            return matchSearch && matchCategory;
        });

        // Si no se quiere mostrar inactivos, filtrarlos
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

    // Contar artículos inactivos
    const inactiveCount = articles.filter(a => a.isActive === false).length;

    return (
        <Layout>
            <div style={styles.content}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            <BookOpen size={28} style={{ marginRight: 12, color: COLORS.Primario, verticalAlign: 'middle' }} />
                            Gestión de Base de Conocimiento
                        </h1>
                        <p style={styles.subtitle}>
                            Administra los artículos, edita, desactiva o reactiva soluciones documentadas
                        </p>
                    </div>
                    <button style={styles.refreshBtn} onClick={loadArticles}>
                        <RefreshCw size={16} style={{ marginRight: 6 }} />
                        Actualizar
                    </button>
                </div>

                {success && (
                    <div style={styles.success}>
                        <CheckCircle size={18} style={{ marginRight: 10 }} />
                        {success}
                    </div>
                )}
                {error && (
                    <div style={styles.error}>
                        <AlertCircle size={18} style={{ marginRight: 10 }} />
                        {error}
                    </div>
                )}

                {/* Barra de filtros */}
                <div style={styles.filtersBar}>
                    <div style={styles.searchWrapper}>
                        <Search size={18} color="#9ca3af" style={styles.searchIcon} />
                        <input
                            style={styles.searchInput}
                            placeholder="Buscar por título, problema o solución..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button style={styles.clearSearchBtn} onClick={() => setSearch('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div style={styles.filterWrapper}>
                        <Tag size={14} color="#6b7280" style={styles.filterIcon} />
                        <select style={styles.filterSelect} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Toggle para mostrar/ocultar inactivos */}
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        style={{
                            ...styles.toggleBtn,
                            backgroundColor: showInactive ? COLORS.PrimarioLight : '#fff',
                            borderColor: showInactive ? COLORS.Primario : '#d1d5db',
                            color: showInactive ? COLORS.Primario : '#374151',
                        }}
                        title={showInactive ? "Ocultar artículos inactivos" : "Mostrar artículos inactivos"}
                    >
                        <Eye size={14} style={{ marginRight: 6 }} />
                        {showInactive ? "Ocultar inactivos" : "Mostrar inactivos"}
                        {inactiveCount > 0 && (
                            <span style={styles.inactiveCount}> ({inactiveCount})</span>
                        )}
                    </button>

                    {hasActiveFilters && (
                        <button style={styles.clearFiltersBtn} onClick={clearFilters}>
                            <X size={14} style={{ marginRight: 4 }} />
                            Limpiar filtros
                        </button>
                    )}

                    <div style={styles.resultCount}>
                        <BookOpen size={12} style={{ marginRight: 4 }} />
                        {filteredArticles.length} de {articles.length} artículos
                    </div>

                    <button onClick={handleExportExcel} style={styles.exportBtn}>
                        <FileSpreadsheet size={14} style={{ marginRight: 6 }} />
                        Exportar Excel
                    </button>
                </div>

                {/* Tabla de artículos */}
                {loading ? (
                    <div style={styles.stateContainer}>
                        <RefreshCw size={32} style={styles.spinner} />
                        <p style={styles.stateText}>Cargando artículos...</p>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div style={styles.stateContainer}>
                        <BookOpen size={48} color={COLORS.TextoSecundario} />
                        <p style={styles.stateText}>
                            {hasActiveFilters ? 'No hay artículos que coincidan con los filtros.' : 'No hay artículos en la base de conocimiento.'}
                        </p>
                    </div>
                ) : (
                    <div style={styles.tableCard}>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.theadRow}>
                                        <th style={styles.th}>Título</th>
                                        <th style={styles.th}>Categoría</th>
                                        <th style={styles.th}>Ticket</th>
                                        <th style={styles.th}>Creado por</th>
                                        <th style={styles.th}>Fecha</th>
                                        <th style={styles.th}>Vistas</th>
                                        <th style={styles.th}>Estado</th>
                                        <th style={styles.th}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredArticles.map((a) => (
                                        <tr key={a.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <span style={styles.articleTitle}>{a.title}</span>
                                                <span style={styles.articlePreview}>{a.problem?.substring(0, 60)}...</span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.categoryBadge}>{a.category}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.ticketNumber}>{a.ticketNumber}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.userCell}>
                                                    <User size={12} color="#6b7280" />
                                                    <span>{a.createdByName}</span>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.dateCell}>
                                                    <Calendar size={12} color="#9ca3af" />
                                                    <span>{new Date(a.createdAt).toLocaleDateString('es-EC')}</span>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.viewCell}>
                                                    <Eye size={12} color="#9ca3af" />
                                                    <span>{a.viewCount || 0}</span>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                {a.isActive !== false ? (
                                                    <span style={styles.activeBadge}>Activo</span>
                                                ) : (
                                                    <span style={styles.inactiveBadge}>Inactivo</span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.actions}>
                                                    <button onClick={() => openEditModal(a)} style={styles.editBtn} title="Editar">
                                                        <Pencil size={15} color={COLORS.Primario} />
                                                    </button>
                                                    {a.isActive !== false ? (
                                                        <button onClick={() => handleDelete(a.id, a.title)} style={styles.deleteBtn} title="Desactivar">
                                                            <Trash2 size={15} color={COLORS.Error} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleReactivate(a.id, a.title)} style={styles.reactivateBtn} title="Reactivar">
                                                            <RotateCcw size={15} color={COLORS.Exito} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/conocimiento`)}
                                                        style={styles.viewBtn}
                                                        title="Ver en base de conocimiento"
                                                    >
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

            {/* MODAL DE EDICIÓN */}
            {editModalOpen && editingArticle && (
                <div style={modalStyles.overlay} onClick={closeEditModal}>
                    <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={modalStyles.header}>
                            <div style={modalStyles.headerIcon}>
                                <Pencil size={24} color="#fff" />
                            </div>
                            <div style={modalStyles.headerText}>
                                <h2 style={modalStyles.title}>Editar Artículo</h2>
                                <p style={modalStyles.subtitle}>
                                    Modifica la información del artículo de conocimiento
                                </p>
                            </div>
                            <button style={modalStyles.closeBtn} onClick={closeEditModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate}>
                            <div style={modalStyles.content}>
                                {error && (
                                    <div style={modalStyles.error}>
                                        <AlertCircle size={16} style={{ marginRight: 8 }} />
                                        {error}
                                    </div>
                                )}

                                <div style={modalStyles.formGrid}>
                                    <div style={{ ...modalStyles.field, gridColumn: '1 / -1' }}>
                                        <label style={modalStyles.label}>
                                            <FileText size={14} style={{ marginRight: 6 }} />
                                            Título *
                                        </label>
                                        <input
                                            style={modalStyles.input}
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div style={{ ...modalStyles.field, gridColumn: '1 / -1' }}>
                                        <label style={modalStyles.label}>
                                            <Tag size={14} style={{ marginRight: 6 }} />
                                            Categoría *
                                        </label>
                                        <select
                                            style={modalStyles.select}
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            required
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ ...modalStyles.field, gridColumn: '1 / -1' }}>
                                        <label style={modalStyles.label}>
                                            <AlertCircle size={14} style={{ marginRight: 6 }} />
                                            Problema y síntomas *
                                        </label>
                                        <textarea
                                            style={modalStyles.textarea}
                                            value={form.problem}
                                            onChange={(e) => setForm({ ...form, problem: e.target.value })}
                                            rows={4}
                                            required
                                        />
                                    </div>

                                    <div style={{ ...modalStyles.field, gridColumn: '1 / -1' }}>
                                        <label style={modalStyles.label}>
                                            <Lightbulb size={14} style={{ marginRight: 6 }} />
                                            Causa raíz *
                                        </label>
                                        <textarea
                                            style={modalStyles.textarea}
                                            value={form.cause}
                                            onChange={(e) => setForm({ ...form, cause: e.target.value })}
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div style={{ ...modalStyles.field, gridColumn: '1 / -1' }}>
                                        <label style={modalStyles.label}>
                                            <CheckCircle size={14} style={{ marginRight: 6 }} />
                                            Solución aplicada *
                                        </label>
                                        <textarea
                                            style={modalStyles.textarea}
                                            value={form.solution}
                                            onChange={(e) => setForm({ ...form, solution: e.target.value })}
                                            rows={4}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={modalStyles.footer}>
                                <button type="button" style={modalStyles.cancelBtn} onClick={closeEditModal}>
                                    Cancelar
                                </button>
                                <button type="submit" style={modalStyles.saveBtn} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                                            Guardando...
                                        </>
                                    ) : (
                                        'Guardar Cambios'
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

const styles = {
    content: {
        padding: '28px 32px',
        flex: 1,
        backgroundColor: COLORS.Fondo,
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 700,
        color: COLORS.Texto,
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.TextoSecundario,
    },
    refreshBtn: {
        background: '#fff',
        border: '1px solid #d1d5db',
        color: '#374151',
        padding: '10px 18px',
        borderRadius: 12,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s',
    },
    success: {
        backgroundColor: '#ecfdf3',
        color: '#027a48',
        padding: 14,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
    },
    error: {
        backgroundColor: '#fef3f2',
        color: '#b42318',
        padding: 14,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
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
        flex: '1 1 260px',
        minWidth: 220,
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
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
            borderColor: COLORS.Primario,
            boxShadow: '0 0 0 3px rgba(67, 97, 238, 0.1)',
        }
    },
    clearSearchBtn: {
        position: 'absolute',
        right: 8,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
        padding: 4,
    },
    filterWrapper: {
        position: 'relative',
        minWidth: 180,
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
        padding: '10px 14px 10px 38px',
        borderRadius: 10,
        border: '1px solid #d0d5dd',
        fontSize: 14,
        backgroundColor: '#fff',
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        transition: 'all 0.2s ease',
    },
    toggleBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        borderRadius: 10,
        border: '1px solid #d1d5db',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all 0.2s ease',
    },
    inactiveCount: {
        fontSize: 11,
        fontWeight: 600,
        marginLeft: 4,
    },
    clearFiltersBtn: {
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
    },
    resultCount: {
        fontSize: 13,
        color: '#6b7280',
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: '8px 14px',
        borderRadius: 10,
    },
    exportBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        borderRadius: 10,
        border: '1px solid #10b981',
        backgroundColor: '#fff',
        color: '#10b981',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all 0.2s ease',
    },
    tableCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        border: '1px solid #eaecf0',
        overflow: 'hidden',
    },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    theadRow: { backgroundColor: '#f9fafb' },
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
    td: { padding: '16px 20px', fontSize: 13, color: '#344054' },
    articleTitle: { display: 'block', fontWeight: 600, color: '#1a1a2e', marginBottom: 4 },
    articlePreview: { display: 'block', fontSize: 11, color: '#9ca3af' },
    categoryBadge: {
        background: COLORS.PrimarioLight,
        color: COLORS.Primario,
        padding: '4px 10px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        display: 'inline-block',
    },
    ticketNumber: {
        fontWeight: 700,
        color: COLORS.Primario,
        fontFamily: 'monospace',
    },
    userCell: { display: 'flex', alignItems: 'center', gap: 6 },
    dateCell: { display: 'flex', alignItems: 'center', gap: 6 },
    viewCell: { display: 'flex', alignItems: 'center', gap: 6 },
    activeBadge: {
        background: '#ecfdf5',
        color: '#10b981',
        padding: '4px 10px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        display: 'inline-block',
    },
    inactiveBadge: {
        background: '#fef2f2',
        color: '#dc2626',
        padding: '4px 10px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        display: 'inline-block',
    },
    actions: { display: 'flex', gap: 8, alignItems: 'center' },
    editBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        borderRadius: 6,
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
    },
    deleteBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        borderRadius: 6,
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
    },
    reactivateBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        borderRadius: 6,
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
    },
    viewBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        borderRadius: 6,
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
    },
    stateContainer: {
        padding: '60px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
    },
    stateText: { color: '#6b7280', fontSize: 15 },
    spinner: { animation: 'spin 1s linear infinite' },
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
        maxWidth: 750,
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
    headerText: { flex: 1 },
    title: { fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 },
    subtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
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
    content: { padding: '24px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    field: { marginBottom: 8 },
    label: { display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
    input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
    select: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', backgroundColor: '#fff', cursor: 'pointer' },
    error: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center' },
    footer: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #eaecf0', backgroundColor: '#f9fafb', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    cancelBtn: { padding: '10px 20px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all 0.2s' },
    saveBtn: { padding: '10px 24px', background: COLORS.Primario, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' },
};

// Agregar animaciones
const styleSheetModal = document.createElement("style");
styleSheetModal.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .modal-close-btn:hover { background-color: rgba(255, 255, 255, 0.3); }
  .modal-cancel-btn:hover { background-color: #f3f4f6; }
  .modal-save-btn:hover { background-color: #1e3a5f; }
  .edit-btn:hover, .delete-btn:hover, .view-btn:hover, .reactivate-btn:hover { background-color: #f3f4f6; }
  .export-btn:hover { background-color: #10b981; color: #fff; }
  .toggle-btn:hover { background-color: #f3f4f6; }
`;
document.head.appendChild(styleSheetModal);

export default AdminKnowledge;