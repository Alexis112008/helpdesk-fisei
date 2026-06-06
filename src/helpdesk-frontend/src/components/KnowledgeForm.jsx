import React, { useState, useEffect } from 'react';
import { catalogAPI, ticketAPI } from '../services/api';
import { attachmentsAPI } from '../services/api';
import { Image, Upload, X, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotifications } from '../components/NotificationProvider';

// Constantes
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

export default function KnowledgeForm({ ticket, fullName, onClose, onSaved, existingArticle }) {
  const { showToast } = useNotifications();
  const defaultCategory = ticket?.damageCatalogName || 'Software';
  
  const isEditMode = !!existingArticle;

  const [form, setForm] = useState({
    title: existingArticle?.title || ticket?.title || '',
    problem: existingArticle?.problem || '',
    cause: existingArticle?.cause || '',
    solution: existingArticle?.solution || '',
    category: existingArticle?.category || defaultCategory,
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [problemSuggestions, setProblemSuggestions] = useState([]);
  const [causeSuggestions, setCauseSuggestions] = useState([]);
  const [solutionSuggestions, setSolutionSuggestions] = useState([]);
  
  const [appliedSuggestionId, setAppliedSuggestionId] = useState(null);
  
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const userId = parseInt(localStorage.getItem('userId') || '0', 10);
  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // Validar campo específico
  const validateField = (field, value) => {
    if (!value || !value.trim()) {
      return `${field} es obligatorio`;
    }
    if (value.trim().length < 5) {
      return `${field} debe tener al menos 5 caracteres`;
    }
    return null;
  };

  // Validar todo el formulario
  const validateForm = () => {
    const errors = {};
    
    const problemError = validateField('Problema y síntomas', form.problem);
    if (problemError) errors.problem = problemError;
    
    const causeError = validateField('Causa raíz', form.cause);
    if (causeError) errors.cause = causeError;
    
    const solutionError = validateField('Solución aplicada', form.solution);
    if (solutionError) errors.solution = solutionError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const fetchSuggestionsByText = async (searchText) => {
    // Si es modo edición, NO buscar sugerencias
    if (isEditMode) return [];
    
    if (!searchText || searchText.trim().length <= 8) return [];
    
    try {
      const ticketsResponse = await ticketAPI.get('/ticket');
      const closedTicketIds = ticketsResponse.data
        .filter(t => t.status === 'Cerrado')
        .map(t => t.id);
      
      if (closedTicketIds.length === 0) return [];
      
      const res = await catalogAPI.get('/knowledge', {
        params: { q: searchText.trim() }
      });
      
      const filtered = res.data.filter(article => 
        closedTicketIds.includes(article.ticketId)
      );
      
      return filtered.slice(0, 3);
    } catch (err) {
      console.error('Error buscando sugerencias:', err);
      return [];
    }
  };

  const handleProblemChange = async (e) => {
    const value = e.target.value;
    update('problem', value);
    if (validationErrors.problem) {
      setValidationErrors(prev => ({ ...prev, problem: null }));
    }
    
    // Solo buscar sugerencias si NO es modo edición
    if (!isEditMode && value.trim().length > 8) {
      const suggestions = await fetchSuggestionsByText(value);
      setProblemSuggestions(suggestions);
      setCauseSuggestions([]);
      setSolutionSuggestions([]);
    } else {
      setProblemSuggestions([]);
    }
  };

  const handleCauseChange = async (e) => {
    const value = e.target.value;
    update('cause', value);
    if (validationErrors.cause) {
      setValidationErrors(prev => ({ ...prev, cause: null }));
    }
    
    // Solo buscar sugerencias si NO es modo edición
    if (!isEditMode && value.trim().length > 8) {
      const suggestions = await fetchSuggestionsByText(value);
      setCauseSuggestions(suggestions);
      setProblemSuggestions([]);
      setSolutionSuggestions([]);
    } else {
      setCauseSuggestions([]);
    }
  };

  const handleSolutionChange = async (e) => {
    const value = e.target.value;
    update('solution', value);
    if (validationErrors.solution) {
      setValidationErrors(prev => ({ ...prev, solution: null }));
    }
    
    // Solo buscar sugerencias si NO es modo edición
    if (!isEditMode && value.trim().length > 8) {
      const suggestions = await fetchSuggestionsByText(value);
      setSolutionSuggestions(suggestions);
      setProblemSuggestions([]);
      setCauseSuggestions([]);
    } else {
      setSolutionSuggestions([]);
    }
  };

  const applySuggestion = (suggestion, fieldType) => {
    // No permitir aplicar sugerencias en modo edición
    if (isEditMode) {
      showToast({ 
        type: 'warning', 
        title: 'No disponible', 
        message: 'Las sugerencias están deshabilitadas en modo edición para evitar sobrescribir contenido.' 
      });
      return;
    }
    
    setForm((prev) => ({
      ...prev,
      title: suggestion.title || prev.title,
      problem: suggestion.problem || prev.problem,
      cause: suggestion.cause || prev.cause,
      solution: suggestion.solution || prev.solution,
    }));
    setAppliedSuggestionId(suggestion.id);
    setValidationErrors({});
    
    // Limpiar sugerencias del campo actual
    if (fieldType === 'problem') setProblemSuggestions([]);
    if (fieldType === 'cause') setCauseSuggestions([]);
    if (fieldType === 'solution') setSolutionSuggestions([]);
    
    showToast({ 
      type: 'success', 
      title: 'Sugerencia aplicada', 
      message: 'Los campos se han llenado con la solución seleccionada.' 
    });
  };

  // Componente de sugerencias reutilizable
  const SuggestionsBox = ({ suggestions, fieldType, onApply }) => {
    // No mostrar sugerencias en modo edición
    if (isEditMode) return null;
    if (suggestions.length === 0) return null;
    
    return (
      <div style={styles.suggestionsSection}>
        <div style={styles.suggestionsTitle}>
          Soluciones similares en la Base de Conocimiento:
        </div>
        {suggestions.map((sg) => (
          <div
            key={sg.id}
            style={{
              ...styles.suggestionCard,
              ...(appliedSuggestionId === sg.id ? styles.suggestionCardActive : {}),
            }}
            onClick={() => onApply(sg, fieldType)}
          >
            <div style={styles.suggestionCardHeader}>
              <span style={styles.suggestionCat}>{sg.category}</span>
              {appliedSuggestionId === sg.id && (
                <span style={styles.appliedBadge}>✓ Aplicado</span>
              )}
            </div>
            <div style={styles.suggestionCardTitle}>{sg.title}</div>
            <div style={styles.suggestionCardSol}>{sg.solution?.substring(0, 100)}...</div>
            <div style={styles.suggestionCardAction}>Click para usar como base</div>
          </div>
        ))}
      </div>
    );
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newErrors = [];

    if (attachments.length + files.length > MAX_FILES) {
      newErrors.push(`Máximo ${MAX_FILES} archivos permitidos`);
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.push(`Formato no permitido: ${file.name}`);
        continue;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`Archivo muy grande: ${file.name}. Máximo 5MB`);
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments(prev => [...prev, {
          file: file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type,
        }]);
      };
      reader.readAsDataURL(file);
    }

    if (newErrors.length > 0) {
      showToast({ type: 'error', title: 'Error', message: newErrors.join('. ') });
    }
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const uploadSolutionAttachments = async (articleId) => {
    if (attachments.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    attachments.forEach((att) => {
      formData.append('files', att.file);
    });
    formData.append('articleId', articleId);

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => prev >= 90 ? prev : prev + 10);
      }, 200);

      await catalogAPI.post('/knowledge/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      showToast({ type: 'success', title: 'Éxito', message: `${attachments.length} imagen(es) subidas a la solución` });
    } catch (err) {
      console.error('Error subiendo archivos:', err);
      showToast({ type: 'error', title: 'Error', message: 'Error al subir algunas imágenes' });
    } finally {
      setUploading(false);
    }
  };

const submit = async () => {
  if (!validateForm()) return;
  
  setSubmitting(true);
  setError('');
  
  try {
    // Guardar la solución TEMPORALMENTE (en un estado del ticket o local)
    // Por ahora, solo registramos la acción de que el técnico registró una solución
    await ticketAPI.post(`/ticket/${ticket.id}/actions`, {
      actionType: 'Resolution',
      description: `Solución propuesta por el técnico.\n\nProblema: ${form.problem}\nCausa: ${form.cause}\nSolución: ${form.solution}`
    });

    // Si hay imágenes de solución seleccionadas, subirlas al ticket
    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      attachments.forEach((att) => {
        formData.append('files', att.file);
      });
      await attachmentsAPI.upload(ticket.id, formData);
    }
    
    showToast({ 
      type: 'success', 
      title: 'Solución registrada', 
      message: 'La solución ha sido registrada. El usuario deberá confirmar para cerrar el ticket.' 
    });
    
    // Cambiar estado a "Resuelto" (si no lo está)
    if (ticket.status !== 'Resuelto') {
      await ticketAPI.patch(`/ticket/${ticket.id}/status`, { status: 'Resuelto' });
    }
    
    onSaved && onSaved();
  } catch (e) {
    setError(e?.response?.data?.message || 'Error al registrar la solución.');
    showToast({ type: 'error', title: 'Error', message: e?.response?.data?.message || 'Error al registrar' });
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>{existingArticle ? 'Editar Solución' : 'Registrar Solución'}</h2>
            <p style={styles.subtitle}>Todos los campos son obligatorios (*)</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* ADVERTENCIA PARA MODO EDICIÓN */}
        {isEditMode && (
          <div style={styles.editModeWarning}>
            <AlertCircle size={16} />
            <span>
              ⚠️ Estás editando una solución existente. 
              Las sugerencias están deshabilitadas para evitar sobrescribir contenido.
              Modifica los campos manualmente.
            </span>
          </div>
        )}

        {/* Título del artículo */}
        <div style={styles.field}>
          <label style={styles.lbl}>Título del artículo</label>
          <input
            style={styles.input}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={ticket.title}
          />
        </div>

        {/* Categoría */}
        <div style={styles.field}>
          <label style={styles.lbl}>Categoría (según tipo de daño)</label>
          <input
            style={{ ...styles.input, background: '#f3f4f6' }}
            value={form.category}
            disabled
          />
        </div>

        <div style={styles.field}>
          <label style={styles.lbl}>Problema y síntomas *</label>
          <textarea
            style={{
              ...styles.textarea,
              borderColor: validationErrors.problem ? '#dc2626' : '#d1d5db'
            }}
            value={form.problem}
            onChange={handleProblemChange}
            placeholder="Describe el problema y los síntomas observados..."
            rows={4}
          />
          {validationErrors.problem && (
            <div style={styles.errorText}>
              <AlertCircle size={12} /> {validationErrors.problem}
            </div>
          )}
          
          <SuggestionsBox 
            suggestions={problemSuggestions} 
            fieldType="problem"
            onApply={applySuggestion}
          />
        </div>


        <div style={styles.field}>
          <label style={styles.lbl}>Causa raíz *</label>
          <textarea
            style={{
              ...styles.textarea,
              borderColor: validationErrors.cause ? '#dc2626' : '#d1d5db'
            }}
            value={form.cause}
            onChange={handleCauseChange}
            placeholder="¿Cuál fue la causa original del problema?"
            rows={3}
          />
          {validationErrors.cause && (
            <div style={styles.errorText}>
              <AlertCircle size={12} /> {validationErrors.cause}
            </div>
          )}
          
          <SuggestionsBox 
            suggestions={causeSuggestions} 
            fieldType="cause"
            onApply={applySuggestion}
          />
        </div>


        <div style={styles.field}>
          <label style={styles.lbl}>Solución aplicada *</label>
          <textarea
            style={{
              ...styles.textarea,
              minHeight: 100,
              borderColor: validationErrors.solution ? '#dc2626' : '#d1d5db'
            }}
            value={form.solution}
            onChange={handleSolutionChange}
            placeholder="Describe detalladamente la solución implementada..."
            rows={4}
          />
          {validationErrors.solution && (
            <div style={styles.errorText}>
              <AlertCircle size={12} /> {validationErrors.solution}
            </div>
          )}
          
          <SuggestionsBox 
            suggestions={solutionSuggestions} 
            fieldType="solution"
            onApply={applySuggestion}
          />
        </div>

        {/* Imágenes */}
        <div style={styles.field}>
          <label style={styles.lbl}>
            <Image size={14} style={{ marginRight: 6 }} />
            Adjuntar imágenes de la solución (opcional)
          </label>
          
          <div style={styles.uploadArea}>
            <input
              type="file"
              id="solution-images"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={attachments.length >= MAX_FILES}
            />
            <label 
              htmlFor="solution-images" 
              style={{
                ...styles.uploadLabel,
                opacity: attachments.length >= MAX_FILES ? 0.5 : 1,
                cursor: attachments.length >= MAX_FILES ? 'not-allowed' : 'pointer',
              }}
            >
              <Upload size={24} color="#4361ee" />
              <span>Subir imágenes</span>
              <small>JPG, PNG, GIF (Máx 5MB)</small>
            </label>
            
            <div style={styles.uploadInfo}>
              <Image size={12} />
              <span>{attachments.length} de {MAX_FILES} archivos seleccionados</span>
            </div>
          </div>

          {uploading && (
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
              </div>
              <span style={styles.progressText}>Subiendo... {uploadProgress}%</span>
            </div>
          )}

          {attachments.length > 0 && (
            <div style={styles.previewGrid}>
              {attachments.map((att, index) => (
                <div key={index} style={styles.previewCard}>
                  <img src={att.preview} alt={att.name} style={styles.previewImage} />
                  <div style={styles.previewInfo}>
                    <span style={styles.previewName}>{att.name.length > 15 ? att.name.substring(0, 15) + '...' : att.name}</span>
                    <span style={styles.previewSize}>{formatFileSize(att.size)}</span>
                  </div>
                  <button type="button" style={styles.removeBtn} onClick={() => removeAttachment(index)} disabled={uploading}>
                    <X size={12} color="#dc2626" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <button style={styles.btnGhost} onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button style={styles.btnPrimary} onClick={submit} disabled={submitting || uploading}>
            {submitting ? 'Guardando...' : uploading ? `Subiendo imágenes... ${uploadProgress}%` : '💾 Guardar Solución'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  box: { background: '#fff', borderRadius: 14, padding: 28, width: 660, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.20)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: '#111' },
  subtitle: { fontSize: 13, color: '#dc2626', marginTop: 4 },
  closeBtn: { background: 'none', border: 'none', fontSize: 28, color: '#9ca3af', cursor: 'pointer', padding: 0, lineHeight: '20px' },
  error: { background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 14 },
  errorText: { fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 },
  editModeWarning: { background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  suggestionsSection: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 14, marginBottom: 14, marginTop: 8 },
  suggestionsTitle: { fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 10 },
  suggestionCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, cursor: 'pointer', marginBottom: 8 },
  suggestionCardActive: { border: '2px solid #16a34a', background: '#f0fdf4' },
  suggestionCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  suggestionCat: { fontSize: 10, fontWeight: 700, color: '#4361ee', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 },
  appliedBadge: { fontSize: 11, fontWeight: 700, color: '#16a34a' },
  suggestionCardTitle: { fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 },
  suggestionCardSol: { fontSize: 12, color: '#6b7280' },
  suggestionCardAction: { fontSize: 11, color: '#4361ee', marginTop: 6, fontStyle: 'italic' },
  field: { marginBottom: 14 },
  lbl: { display: 'block', fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', minHeight: 70, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  uploadArea: { border: '2px dashed #d0d5dd', borderRadius: 10, padding: 16, textAlign: 'center', backgroundColor: '#fafbfc' },
  uploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' },
  uploadInfo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 11, color: '#6b7280' },
  progressContainer: { marginTop: 12 },
  progressBar: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4361ee', borderRadius: 2, transition: 'width 0.3s' },
  progressText: { display: 'block', fontSize: 10, color: '#4361ee', marginTop: 4, textAlign: 'center' },
  previewGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  previewCard: { position: 'relative', width: 80, border: '1px solid #e4e7eb', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 60, objectFit: 'cover' },
  previewInfo: { padding: 4, textAlign: 'center' },
  previewName: { fontSize: 8, color: '#374151', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewSize: { fontSize: 7, color: '#8a9bb5' },
  removeBtn: { position: 'absolute', top: 2, right: 2, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid #f3f4f6' },
  btnGhost: { padding: '11px 18px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  btnPrimary: { padding: '11px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
};