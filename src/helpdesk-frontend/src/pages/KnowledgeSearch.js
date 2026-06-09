import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Filter
} from 'lucide-react';
import Layout from '../components/Layout';
import { catalogAPI } from '../services/api';

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

function KnowledgeSearch() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);

  const load = () => {
    setLoading(true);
    const params = {};
    if (selectedCategory && selectedCategory !== 'Todas') params.category = selectedCategory;
    if (query.trim()) params.q = query.trim();

    catalogAPI
      .get('/knowledge', { params })
      .then((res) => {
        let sorted = [...res.data];
        if (sortBy === 'recent') {
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'views') {
          sorted.sort((a, b) => b.viewCount - a.viewCount);
        } else if (sortBy === 'title') {
          sorted.sort((a, b) => a.title.localeCompare(b.title));
        }
        setArticles(sorted);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    catalogAPI.get('/knowledge/categories')
      .then((res) => setCategories(['Todas', ...res.data]))
      .catch(() => setCategories(['Todas', 'Software', 'Hardware', 'Redes', 'Correo', 'Cuentas']));
  }, []);

  useEffect(() => {
    load();
  }, [selectedCategory, sortBy]);

  const onSearchKey = (e) => {
    if (e.key === 'Enter') load();
  };

  const openArticle = (id) => {
    catalogAPI.get(`/knowledge/${id}`)
      .then((res) => setSelected(res.data))
      .catch(() => { });
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setQuery('');
    setSortBy('recent');
  };

  const hasActiveFilters = selectedCategory || query;

  return (
    <Layout>
      <main className="knowledge-content">
        {/* Header */}
        <div className="knowledge-header">
          <div className="knowledge-header-left">
            <BookOpen size={32} color={COLORS.Primario} />
            <div>
              <h1 className="knowledge-title">Base de Conocimiento</h1>
              <p className="knowledge-subtitle">Guías y soluciones para los problemas más comunes</p>
            </div>
          </div>
        </div>

        {/* Tarjeta de filtros */}
        <div className="knowledge-filters-card">
          {/* Buscador principal - siempre visible */}
          <div className="knowledge-search-bar">
            <div className="knowledge-search-wrapper">
              <Search size={16} color={COLORS.TextoSecundario} className="knowledge-search-icon" />
              <input
                className="knowledge-search-input"
                placeholder="Buscar artículos, guías y soluciones..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
              />
              {query && (
                <button className="knowledge-clear-btn" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              className="knowledge-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filtros
            </button>
          </div>

          {/* Filtros desplegables (en móvil) o inline (en desktop) */}
          <div className={`knowledge-filters ${showFilters ? 'knowledge-filters-open' : ''}`}>
            <div className="knowledge-filter-group">
              <label className="knowledge-filter-label">Categoría</label>
              <select
                className="knowledge-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="knowledge-filter-group">
              <label className="knowledge-filter-label">Ordenar por</label>
              <select
                className="knowledge-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Más recientes</option>
                <option value="views">Más vistos</option>
                <option value="title">Alfabético</option>
              </select>
            </div>

            <div className="knowledge-filter-info">
              <div className="knowledge-result-count">
                <BookOpen size={14} />
                {articles.length} artículos
              </div>
              {hasActiveFilters && (
                <button className="knowledge-reset-btn" onClick={resetFilters}>
                  <X size={14} />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid de artículos */}
        {loading ? (
          <div className="knowledge-loading">
            <BookOpen size={48} color={COLORS.TextoSecundario} className="knowledge-spinner" />
            <p className="knowledge-state-text">Cargando artículos...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="knowledge-empty">
            <Search size={48} color={COLORS.TextoSecundario} />
            <p className="knowledge-state-text">No se encontraron artículos.</p>
          </div>
        ) : (
          <div className="knowledge-grid">
            {articles.map((a) => (
              <button key={a.id} className="knowledge-card" onClick={() => openArticle(a.id)}>
                <div className="knowledge-card-header">
                  <span className="knowledge-cat-badge">
                    <Tag size={10} />
                    {a.category}
                  </span>
                  <span className="knowledge-views">
                    <Eye size={11} />
                    {a.viewCount}
                  </span>
                </div>
                <h3 className="knowledge-card-title">{a.title}</h3>
                <p className="knowledge-card-desc">{a.problem.substring(0, 100)}...</p>
                <div className="knowledge-card-footer">
                  <Calendar size={11} />
                  {new Date(a.createdAt).toLocaleDateString('es-EC')}
                  <span className="knowledge-dot">·</span>
                  <User size={11} />
                  {a.createdByName}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Modal de artículo */}
        {selected && (
          <div className="knowledge-overlay" onClick={() => setSelected(null)}>
            <div className="knowledge-modal" onClick={(e) => e.stopPropagation()}>
              <div className="knowledge-modal-header">
                <span className="knowledge-cat-badge">
                  <Tag size={10} />
                  {selected.category}
                </span>
                <button className="knowledge-close-btn" onClick={() => setSelected(null)}>
                  <X size={18} />
                </button>
              </div>
              <h2 className="knowledge-modal-title">{selected.title}</h2>
              <p className="knowledge-modal-meta">
                <FileText size={12} />
                Ticket {selected.ticketNumber} ·
                <Calendar size={12} />
                {new Date(selected.createdAt).toLocaleDateString('es-EC')} ·
                <User size={12} />
                {selected.createdByName}
              </p>

              <div className="knowledge-section">
                <div className="knowledge-section-title">
                  <AlertCircle size={14} />
                  Problema y síntomas
                </div>
                <div className="knowledge-section-content">{selected.problem}</div>
              </div>

              <div className="knowledge-section">
                <div className="knowledge-section-title">
                  <Lightbulb size={14} />
                  Causa raíz
                </div>
                <div className="knowledge-section-content">{selected.cause}</div>
              </div>

              <div className="knowledge-section">
                <div className="knowledge-section-title knowledge-section-highlight">
                  <CheckCircle size={14} />
                  Solución aplicada
                </div>
                <div className="knowledge-section-content knowledge-section-highlight-bg">{selected.solution}</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .knowledge-content {
          padding: 28px 32px;
          flex: 1;
          background-color: ${COLORS.Fondo};
          min-height: 100vh;
        }

        .knowledge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .knowledge-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .knowledge-title {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          color: ${COLORS.Texto};
        }

        .knowledge-subtitle {
          font-size: 13px;
          color: ${COLORS.TextoSecundario};
          margin-top: 4px;
        }

        .knowledge-filters-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid ${COLORS.Borde};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 20px 24px;
          margin-bottom: 24px;
        }

        .knowledge-search-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .knowledge-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .knowledge-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .knowledge-search-input {
          width: 100%;
          padding: 12px 16px 12px 40px;
          font-size: 14px;
          border: 1px solid ${COLORS.Borde};
          border-radius: 12px;
          outline: none;
          background-color: #f9fafb;
          transition: all 0.2s;
        }

        .knowledge-search-input:focus {
          border-color: ${COLORS.Primario};
          box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
        }

        .knowledge-clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: ${COLORS.TextoSecundario};
          display: flex;
          align-items: center;
        }

        .knowledge-filter-toggle {
          display: none;
          align-items: center;
          gap: 6px;
          background: #f9fafb;
          border: 1px solid ${COLORS.Borde};
          border-radius: 10px;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: ${COLORS.TextoSecundario};
        }

        .knowledge-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 20px;
          margin-top: 16px;
        }

        .knowledge-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .knowledge-filter-label {
          font-size: 11px;
          font-weight: 600;
          color: ${COLORS.TextoSecundario};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .knowledge-filter-select {
          padding: 10px 28px 10px 12px;
          font-size: 13px;
          border: 1px solid ${COLORS.Borde};
          border-radius: 10px;
          background-color: #f9fafb;
          cursor: pointer;
          outline: none;
          color: #374151;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          min-width: 160px;
        }

        .knowledge-filter-select:focus {
          border-color: ${COLORS.Primario};
          box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
        }

        .knowledge-filter-info {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          margin-left: auto;
        }

        .knowledge-result-count {
          font-size: 13px;
          font-weight: 600;
          color: ${COLORS.Primario};
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: ${COLORS.PrimarioLight};
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid ${COLORS.Primario}30;
        }

        .knowledge-reset-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f9fafb;
          border: 1px solid ${COLORS.Borde};
          border-radius: 10px;
          padding: 8px 14px;
          cursor: pointer;
          color: ${COLORS.Error};
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .knowledge-reset-btn:hover {
          background-color: #fee2e2;
          border-color: ${COLORS.Error};
        }

        .knowledge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .knowledge-card {
          background: #fff;
          border: 1px solid ${COLORS.Borde};
          border-radius: 16px;
          padding: 20px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          width: 100%;
        }

        .knowledge-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border-color: ${COLORS.Primario};
        }

        .knowledge-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .knowledge-cat-badge {
          background: ${COLORS.PrimarioLight};
          color: ${COLORS.Primario};
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .knowledge-views {
          font-size: 11px;
          color: ${COLORS.TextoSecundario};
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .knowledge-card-title {
          font-size: 15px;
          font-weight: 700;
          color: ${COLORS.Texto};
          margin: 4px 0;
        }

        .knowledge-card-desc {
          font-size: 13px;
          color: ${COLORS.TextoSecundario};
          margin: 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .knowledge-card-footer {
          font-size: 11px;
          color: ${COLORS.TextoSecundario};
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .knowledge-dot {
          margin: 0 4px;
        }

        .knowledge-loading, .knowledge-empty {
          background: #fff;
          border-radius: 20px;
          border: 1px solid ${COLORS.Borde};
          padding: 60px 20px;
          text-align: center;
        }

        .knowledge-state-text {
          color: ${COLORS.TextoSecundario};
          font-size: 14px;
          margin-top: 12px;
        }

        .knowledge-spinner {
          animation: spin 1s linear infinite;
        }

        .knowledge-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .knowledge-modal {
          background: #fff;
          border-radius: 20px;
          padding: 28px;
          width: 720px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.20);
        }

        .knowledge-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .knowledge-modal-title {
          font-size: 24px;
          font-weight: 700;
          margin: 12px 0 8px;
          color: ${COLORS.Texto};
        }

        .knowledge-modal-meta {
          font-size: 12px;
          color: ${COLORS.TextoSecundario};
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }

        .knowledge-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: ${COLORS.TextoSecundario};
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        }

        .knowledge-close-btn:hover {
          background-color: #f3f4f6;
        }

        .knowledge-section {
          margin-top: 20px;
        }

        .knowledge-section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: ${COLORS.TextoSecundario};
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .knowledge-section-highlight {
          color: ${COLORS.Exito};
        }

        .knowledge-section-content {
          background: #f9fafb;
          border: 1px solid ${COLORS.Borde};
          border-radius: 10px;
          padding: 14px;
          color: ${COLORS.Texto};
          font-size: 14px;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .knowledge-section-highlight-bg {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .knowledge-content {
            padding: 70px 12px 20px 12px;
          }

          .knowledge-header {
            margin-bottom: 16px;
          }

          .knowledge-header-left {
            gap: 12px;
          }

          .knowledge-title {
            font-size: 20px;
          }

          .knowledge-subtitle {
            font-size: 11px;
          }

          .knowledge-filters-card {
            padding: 16px;
          }

          .knowledge-search-bar {
            flex-direction: column;
          }

          .knowledge-filter-toggle {
            display: flex;
            justify-content: center;
          }

          .knowledge-filters {
            display: none;
            flex-direction: column;
            margin-top: 16px;
          }

          .knowledge-filters-open {
            display: flex;
          }

          .knowledge-filter-group {
            width: 100%;
          }

          .knowledge-filter-select {
            width: 100%;
          }

          .knowledge-filter-info {
            margin-left: 0;
            flex-direction: column;
            align-items: stretch;
          }

          .knowledge-result-count {
            justify-content: center;
          }

          .knowledge-reset-btn {
            justify-content: center;
          }

          .knowledge-grid {
            grid-template-columns: 1fr;
          }

          .knowledge-modal {
            padding: 20px;
          }

          .knowledge-modal-title {
            font-size: 18px;
          }

          .knowledge-modal-meta {
            font-size: 11px;
          }

          .knowledge-section-content {
            font-size: 13px;
          }
        }
      `}</style>
    </Layout>
  );
}

export default KnowledgeSearch;