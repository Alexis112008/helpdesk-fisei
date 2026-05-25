import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { catalogAPI } from '../services/api';

/**
 * HU8 — T8.4: Búsqueda de la base de conocimiento.
 * Filtros por categoría + palabra clave; detalle modal al hacer clic.
 */
function KnowledgeSearch() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (activeCategory !== 'Todas') params.category = activeCategory;
    if (query.trim()) params.q = query.trim();

    catalogAPI
      .get('/knowledge', { params })
      .then((res) => setArticles(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Cargar categorías al iniciar
    catalogAPI.get('/knowledge/categories')
      .then((res) => setCategories(['Todas', ...res.data]))
      .catch(() => setCategories(['Todas', 'Software', 'Hardware', 'Redes', 'Correo', 'Cuentas']));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const onSearchKey = (e) => {
    if (e.key === 'Enter') load();
  };

  const openArticle = (id) => {
    catalogAPI.get(`/knowledge/${id}`)
      .then((res) => setSelected(res.data))
      .catch(() => {});
  };

  return (
    <Layout>
      <h1 style={s.title}>Base de Conocimiento</h1>
      <p style={s.subtitle}>Guías y soluciones para los problemas más comunes</p>

      <input
        style={s.search}
        placeholder="Buscar artículos, guías y soluciones..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onSearchKey}
      />

      <div style={s.layout}>
        <aside style={s.sidebar}>
          <div style={s.sidebarTitle}>CATEGORÍAS</div>
          {categories.map((c) => (
            <button
              key={c}
              style={{
                ...s.catBtn,
                ...(activeCategory === c ? s.catBtnActive : {}),
              }}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </aside>

        <div style={s.grid}>
          {loading ? (
            <div style={s.empty}>Cargando...</div>
          ) : articles.length === 0 ? (
            <div style={s.empty}>No se encontraron artículos.</div>
          ) : (
            articles.map((a) => (
              <button key={a.id} style={s.card} onClick={() => openArticle(a.id)}>
                <div style={s.cardHeader}>
                  <span style={s.catBadge}>{a.category}</span>
                  <span style={s.views}>👁 {a.viewCount}</span>
                </div>
                <h3 style={s.cardTitle}>{a.title}</h3>
                <p style={s.cardDesc}>{a.problem}</p>
                <div style={s.cardFooter}>
                  {new Date(a.createdAt).toLocaleDateString('es-EC')} · {a.createdByName}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.catBadge}>{selected.category}</span>
              <button style={s.closeBtn} onClick={() => setSelected(null)}>×</button>
            </div>
            <h2 style={s.modalTitle}>{selected.title}</h2>
            <p style={s.modalMeta}>
              Ticket {selected.ticketNumber} ·
              {' '}{new Date(selected.createdAt).toLocaleDateString('es-EC')} ·
              {' '}{selected.createdByName}
            </p>

            <Section title="Problema identificado" text={selected.problem} />
            <Section title="Causa raíz" text={selected.cause} />
            <Section title="Síntomas observados" text={selected.symptoms} />
            <Section title="Solución aplicada" text={selected.solution} highlight />
          </div>
        </div>
      )}
    </Layout>
  );
}

function Section({ title, text, highlight }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: '#6b7280',
        textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5,
      }}>{title}</div>
      <div style={{
        background: highlight ? '#f0fdf4' : '#f9fafb',
        border: '1px solid ' + (highlight ? '#bbf7d0' : '#eaecf0'),
        borderRadius: 8, padding: 14, color: '#111', fontSize: 14,
        whiteSpace: 'pre-wrap',
      }}>{text}</div>
    </div>
  );
}

const s = {
  title: { fontSize: 26, fontWeight: 700, margin: 0, color: '#111' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 18 },
  search: {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1px solid #d1d5db', fontSize: 14, marginBottom: 20,
    outline: 'none', boxSizing: 'border-box',
  },
  layout: { display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 4 },
  sidebarTitle: {
    fontSize: 11, fontWeight: 700, color: '#9ca3af',
    marginBottom: 8, letterSpacing: 0.5,
  },
  catBtn: {
    padding: '8px 12px', textAlign: 'left', background: 'none',
    border: 'none', borderRadius: 8, color: '#4b5563', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
  },
  catBtnActive: { background: '#eef2ff', color: '#3730a3', fontWeight: 700 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#fff', border: '1px solid #eaecf0', borderRadius: 12,
    padding: 18, textAlign: 'left', cursor: 'pointer',
    transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 6,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: {
    background: '#eef2ff', color: '#3730a3', padding: '3px 10px',
    borderRadius: 12, fontSize: 11, fontWeight: 700,
  },
  views: { fontSize: 11, color: '#9ca3af' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#111', margin: '4px 0' },
  cardDesc: {
    fontSize: 13, color: '#6b7280', margin: 0,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  cardFooter: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  empty: {
    gridColumn: '1 / -1', padding: 60,
    textAlign: 'center', color: '#9ca3af',
  },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 14, padding: 28,
    width: 680, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  modalTitle: { fontSize: 22, fontWeight: 700, margin: '8px 0', color: '#111' },
  modalMeta: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 28, color: '#9ca3af',
    cursor: 'pointer', padding: 0, lineHeight: '20px',
  },
};

export default KnowledgeSearch;
