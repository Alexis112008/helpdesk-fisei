import React, { useState } from 'react';
import { catalogAPI } from '../services/api';

/**
 * HU8 — T8.5: Modal de registro de solución al cerrar ticket.
 * Todos los campos son obligatorios. Tras guardar, dispara onSaved()
 * para que el padre cierre el ticket en MicroserviceB.
 */
export default function KnowledgeForm({ ticket, fullName, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: ticket?.title || '',
    problem: '',
    cause: '',
    symptoms: '',
    solution: '',
    category: 'Software',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const userId = parseInt(localStorage.getItem('userId') || '0', 10);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!form.problem.trim() || !form.cause.trim() ||
        !form.symptoms.trim() || !form.solution.trim()) {
      setError('Problema, causa, síntomas y solución son obligatorios.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await catalogAPI.post('/knowledge', {
        title: form.title.trim() || form.problem.trim(),
        problem: form.problem.trim(),
        cause: form.cause.trim(),
        symptoms: form.symptoms.trim(),
        solution: form.solution.trim(),
        category: form.category,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        createdByUserId: userId,
        createdByName: fullName,
      });
      onSaved && onSaved();
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al guardar el artículo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Formulario de resolución</h2>
            <p style={s.subtitle}>
              Todos los campos son obligatorios para cerrar el ticket
            </p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.field}>
          <label style={s.lbl}>Título del artículo</label>
          <input
            style={s.input}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={ticket.title}
          />
        </div>

        <div style={s.field}>
          <label style={s.lbl}>Categoría *</label>
          <select
            style={s.input}
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option>Software</option>
            <option>Hardware</option>
            <option>Redes</option>
            <option>Correo</option>
            <option>Cuentas</option>
            <option>Otros</option>
          </select>
        </div>

        <div style={s.field}>
          <label style={s.lbl}>Problema identificado *</label>
          <textarea
            style={s.textarea}
            value={form.problem}
            onChange={(e) => update('problem', e.target.value)}
            placeholder="Describe el problema identificado en el sistema o equipo..."
          />
        </div>

        <div style={s.field}>
          <label style={s.lbl}>Causa raíz *</label>
          <textarea
            style={s.textarea}
            value={form.cause}
            onChange={(e) => update('cause', e.target.value)}
            placeholder="¿Cuál fue la causa original del problema?"
          />
        </div>

        <div style={s.field}>
          <label style={s.lbl}>Síntomas observados *</label>
          <textarea
            style={s.textarea}
            value={form.symptoms}
            onChange={(e) => update('symptoms', e.target.value)}
            placeholder="¿Qué síntomas presentaba el sistema o equipo?"
          />
        </div>

        <div style={s.field}>
          <label style={s.lbl}>Solución aplicada *</label>
          <textarea
            style={{ ...s.textarea, minHeight: 100 }}
            value={form.solution}
            onChange={(e) => update('solution', e.target.value)}
            placeholder="Describe detalladamente la solución implementada y los pasos realizados..."
          />
        </div>

        <div style={s.actions}>
          <button style={s.btnGhost} onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button style={s.btnPrimary} onClick={submit} disabled={submitting}>
            {submitting ? 'Guardando...' : '💾 Guardar y Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  },
  box: {
    background: '#fff', borderRadius: 14, padding: 28,
    width: 600, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: '#111' },
  subtitle: { fontSize: 13, color: '#dc2626', marginTop: 4 },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 28, color: '#9ca3af',
    cursor: 'pointer', padding: 0, lineHeight: '20px',
  },
  error: {
    background: '#fef2f2', color: '#b91c1c', padding: 12,
    borderRadius: 8, fontSize: 13, marginBottom: 14,
  },
  field: { marginBottom: 14 },
  lbl: {
    display: 'block', fontSize: 13, color: '#374151',
    marginBottom: 6, fontWeight: 600,
  },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', minHeight: 70, padding: 12, borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
    resize: 'vertical', fontFamily: 'inherit',
  },
  actions: {
    display: 'flex', justifyContent: 'flex-end',
    gap: 10, marginTop: 18, paddingTop: 16,
    borderTop: '1px solid #f3f4f6',
  },
  btnGhost: {
    padding: '11px 18px', background: '#fff', color: '#374151',
    border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600,
    fontSize: 13, cursor: 'pointer',
  },
  btnPrimary: {
    padding: '11px 22px', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: 700,
    fontSize: 13, cursor: 'pointer',
  },
};
