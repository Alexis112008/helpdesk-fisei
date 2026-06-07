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
  FolderOpen,
  Tag,
  ChevronRight,
  Filter
} from 'lucide-react';
import Layout from '../components/Layout';
import { catalogAPI } from '../services/api';

// Colores unificados con el Dashboard
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

/**
 * HU8 — T8.4: Búsqueda de la base de conocimiento.
 * Filtros horizontales con combobox.
 */
function KnowledgeSearch() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('recent');

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
      .catch(() => {});
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setQuery('');
    setSortBy('recent');
  };

  const hasActiveFilters = selectedCategory || query;

  const cardStyle = {
    background: '#fff',
    borderRadius: 20,
    border: `1px solid ${COLORS.Borde}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  };

  return (
    <Layout>
      <main style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <BookOpen size={32} color={COLORS.Primario} />
            <div>
              <h1 style={styles.title}>Base de Conocimiento</h1>
              <p style={styles.subtitle}>Guías y soluciones para los problemas más comunes</p>
            </div>
          </div>
        </div>

        {/* Tarjeta de filtros */}
        <div style={{ ...cardStyle, padding: '20px 24px', marginBottom: 24 }}>
          <div style={styles.filterBar}>
            {/* Buscador */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Buscar</label>
              <div style={styles.searchWrapper}>
                <Search size={16} color={COLORS.TextoSecundario} style={styles.searchIcon} />
                <input
                  style={styles.searchInput}
                  placeholder="Buscar artículos, guías y soluciones..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKey}
                />
                {query && (
                  <button style={styles.clearBtn} onClick={() => setQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filtro Categoría */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Categoría</label>
              <div style={styles.selectWrapper}>
                <select
                  style={styles.filterSelect}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro Ordenar */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Ordenar por</label>
              <div style={styles.selectWrapper}>
                <select
                  style={styles.filterSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Más recientes</option>
                  <option value="views">Más vistos</option>
                  <option value="title">Alfabético</option>
                </select>
              </div>
            </div>

            {/* Contador y limpiar */}
            <div style={styles.filterInfo}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Resultados</label>
                <div style={styles.resultCount}>
                  <BookOpen size={14} style={{ marginRight: 4 }} />
                  {articles.length} artículos
                </div>
              </div>
              {hasActiveFilters && (
                <button style={styles.resetBtn} onClick={resetFilters}>
                  <X size={14} style={{ marginRight: 4 }} />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid de artículos */}
        {loading ? (
          <div style={{ ...cardStyle, padding: '60px 20px', textAlign: 'center' }}>
            <BookOpen size={48} color={COLORS.TextoSecundario} style={styles.spinner} />
            <p style={styles.stateText}>Cargando artículos...</p>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ ...cardStyle, padding: '60px 20px', textAlign: 'center' }}>
            <Search size={48} color={COLORS.TextoSecundario} />
            <p style={styles.stateText}>No se encontraron artículos.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {articles.map((a) => (
              <button key={a.id} style={styles.card} onClick={() => openArticle(a.id)}>
                <div style={styles.cardHeader}>
                  <span style={styles.catBadge}>
                    <Tag size={10} style={{ marginRight: 4 }} />
                    {a.category}
                  </span>
                  <span style={styles.views}>
                    <Eye size={11} style={{ marginRight: 3 }} />
                    {a.viewCount}
                  </span>
                </div>
                <h3 style={styles.cardTitle}>{a.title}</h3>
                <p style={styles.cardDesc}>{a.problem.substring(0, 100)}...</p>
                <div style={styles.cardFooter}>
                  <Calendar size={11} style={{ marginRight: 3 }} />
                  {new Date(a.createdAt).toLocaleDateString('es-EC')}
                  <span style={styles.dot}>·</span>
                  <User size={11} style={{ marginRight: 3 }} />
                  {a.createdByName}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Modal de artículo */}
        {selected && (
          <div style={styles.overlay} onClick={() => setSelected(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <span style={styles.catBadge}>
                  <Tag size={10} style={{ marginRight: 4 }} />
                  {selected.category}
                </span>
                <button style={styles.closeBtn} onClick={() => setSelected(null)}>
                  <X size={18} />
                </button>
              </div>
              <h2 style={styles.modalTitle}>{selected.title}</h2>
              <p style={styles.modalMeta}>
                <FileText size={12} style={{ marginRight: 4 }} />
                Ticket {selected.ticketNumber} ·
                <Calendar size={12} style={{ marginLeft: 8, marginRight: 4 }} />
                {new Date(selected.createdAt).toLocaleDateString('es-EC')} ·
                <User size={12} style={{ marginLeft: 8, marginRight: 4 }} />
                {selected.createdByName}
              </p>

              <Section 
                title="Problema y síntomas" 
                text={selected.problem} 
                icon={<AlertCircle size={14} />}
                color={COLORS.Error}
              />
              <Section 
                title="Causa raíz" 
                text={selected.cause} 
                icon={<Lightbulb size={14} />}
                color={COLORS.Advertencia}
              />
              <Section 
                title="Solución aplicada" 
                text={selected.solution} 
                icon={<CheckCircle size={14} />}
                color={COLORS.Exito}
                highlight 
              />
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}

function Section({ title, text, icon, color, highlight }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        color: color || COLORS.TextoSecundario,
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 0.5,
      }}>
        {icon}
        {title}
      </div>
      <div style={{
        background: highlight ? '#f0fdf4' : '#f9fafb',
        border: '1px solid ' + (highlight ? '#bbf7d0' : COLORS.Borde),
        borderRadius: 10,
        padding: 14,
        color: COLORS.Texto,
        fontSize: 14,
        whiteSpace: 'pre-wrap',
        lineHeight: 1.6,
      }}>{text}</div>
    </div>
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

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    color: COLORS.Texto,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.TextoSecundario,
    marginTop: 4,
  },

  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 20,
  },

  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },

  filterLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.TextoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  searchWrapper: {
    position: 'relative',
    minWidth: 250,
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
    padding: '10px 12px 10px 36px',
    fontSize: 13,
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 10,
    outline: 'none',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s',
  },

  clearBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.TextoSecundario,
    display: 'flex',
    alignItems: 'center',
  },

  selectWrapper: {
    position: 'relative',
  },

  filterSelect: {
    padding: '10px 28px 10px 12px',
    fontSize: 13,
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    outline: 'none',
    color: '#374151',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    minWidth: 160,
  },

  filterInfo: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    marginLeft: 'auto',
  },

  resultCount: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.Primario,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: COLORS.PrimarioLight,
    padding: '8px 14px',
    borderRadius: 10,
    border: `1px solid ${COLORS.Primario}30`,
  },

  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: '#f9fafb',
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 10,
    padding: '8px 14px',
    cursor: 'pointer',
    color: COLORS.Error,
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.2s',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },

  card: {
    background: '#fff',
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 16,
    padding: 20,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  catBadge: {
    background: COLORS.PrimarioLight,
    color: COLORS.Primario,
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
  },

  views: {
    fontSize: 11,
    color: COLORS.TextoSecundario,
    display: 'flex',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.Texto,
    margin: '4px 0',
  },

  cardDesc: {
    fontSize: 13,
    color: COLORS.TextoSecundario,
    margin: 0,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  cardFooter: {
    fontSize: 11,
    color: COLORS.TextoSecundario,
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },

  dot: {
    margin: '0 4px',
  },

  stateText: {
    color: COLORS.TextoSecundario,
    fontSize: 14,
    marginTop: 12,
  },

  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },

  modal: {
    background: '#fff',
    borderRadius: 20,
    padding: 28,
    width: 720,
    maxWidth: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 700,
    margin: '12px 0 8px',
    color: COLORS.Texto,
  },

  modalMeta: {
    fontSize: 12,
    color: COLORS.TextoSecundario,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },

  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.TextoSecundario,
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 6,
    transition: 'background-color 0.2s ease',
  },

  spinner: {
    animation: 'spin 1s linear infinite',
  },
};

// Añadir animaciones y efectos focus
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  input:focus, select:focus {
    border-color: ${COLORS.Primario} !important;
    box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1) !important;
    outline: none !important;
  }
  
  button:hover {
    transform: translateY(-1px);
  }
  
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    border-color: ${COLORS.Primario};
  }
  
  .close-btn:hover {
    background-color: #f3f4f6;
  }
  
  .reset-btn:hover {
    background-color: #fee2e2;
    border-color: ${COLORS.Error};
  }
`;
document.head.appendChild(styleSheet);

export default KnowledgeSearch;