import React, { useState, useEffect, useCallback } from 'react';
import { catalogAPI, ticketAPI } from '../services/api';
import { attachmentsAPI } from '../services/api';
import {
  Image, Upload, X, FileImage, AlertCircle, CheckCircle,
  Download, Eye, Save, PenTool, FilePlus, RefreshCw
} from 'lucide-react';
import { useNotifications } from '../components/NotificationProvider';

// Constantes
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

export default function KnowledgeForm({ ticket, fullName, onClose, onSaved, existingArticle, readOnly = false }) {
  const { showToast } = useNotifications();
  const defaultCategory = ticket?.damageCatalogName || 'Software';

  const isRejectionCase = ticket?.status === 'En Proceso' && existingArticle !== null;
  const isEditMode = !isRejectionCase && !!existingArticle;
  const isNewSolutionMode = !readOnly && (isRejectionCase || !existingArticle);

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

  // Estado para imágenes existentes del ticket (modo solo lectura)
  const [existingImages, setExistingImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const userId = parseInt(localStorage.getItem('userId') || '0', 10);

  // Cargar imágenes existentes del ticket cuando es modo solo lectura
  useEffect(() => {
    if (readOnly && ticket?.id) {
      setLoadingImages(true);
      attachmentsAPI.getByTicket(ticket.id)
        .then((res) => setExistingImages(res.data || []))
        .catch((err) => console.error('Error cargando imágenes:', err))
        .finally(() => setLoadingImages(false));
    }
  }, [readOnly, ticket?.id]);

  // Ver imagen en modal
  const handleViewExistingImage = async (att) => {
    try {
      const response = await attachmentsAPI.download(att.id);
      const blob = new Blob([response.data], { type: att.fileType });
      const url = URL.createObjectURL(blob);
      setSelectedImage({ ...att, url });
    } catch (err) {
      console.error('Error cargando imagen:', err);
      showToast({ type: 'error', title: 'Error', message: 'No se pudo cargar la imagen' });
    }
  };

  const handleDownloadImage = async (att) => {
    try {
      const response = await attachmentsAPI.download(att.id);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando imagen:', err);
    }
  };
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
      const solutionText = `Problema: ${form.problem}\nCausa: ${form.cause}\nSolución: ${form.solution}`;

      // ✅ SOLO guardar en el historial del ticket (TicketAction)
      await ticketAPI.post(`/ticket/${ticket.id}/actions`, {
        actionType: 'Resolution',
        description: solutionText
      });

      // ✅ Subir imágenes si hay (al ticket, no a la solución)
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((att) => {
          formData.append('files', att.file);
        });
        await attachmentsAPI.upload(ticket.id, formData);
      }

      // ✅ Cambiar estado a "Resuelto"
      if (ticket.status !== 'Resuelto') {
        await ticketAPI.patch(`/ticket/${ticket.id}/status`, { status: 'Resuelto' });
      }

      showToast({
        type: 'success',
        title: 'Solución registrada',
        message: 'La solución ha sido registrada. El usuario deberá confirmarla para cerrar el ticket.'
      });

      onSaved && onSaved();
    } catch (e) {
      console.error('Error completo:', e);
      setError(e?.response?.data?.message || 'Error al registrar la solución.');
      showToast({
        type: 'error',
        title: 'Error',
        message: e?.response?.data?.message || 'Error al registrar la solución'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              {readOnly
                ? 'Ver Solución Registrada'
                : isRejectionCase
                  ? 'Registrar Nueva Solución'
                  : existingArticle
                    ? 'Editar Solución'
                    : 'Registrar Solución'}
            </h2>
            {!readOnly && <p style={styles.subtitle}>Todos los campos son obligatorios (*)</p>}
          </div>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* ADVERTENCIA PARA RECHAZO */}
        {isRejectionCase && !readOnly && (
          <div style={styles.editModeWarning}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong> La solución anterior fue rechazada por el usuario.</strong>
              <span style={{ display: 'block', fontSize: 11, marginTop: 4 }}>
                Revise el motivo del rechazo (se muestra en la alerta roja arriba) y registre una <strong>NUEVA SOLUCIÓN</strong> según corresponda.
              </span>
            </span>
          </div>
        )}

        {/* ADVERTENCIA PARA EDICIÓN NORMAL */}
        {isEditMode && !readOnly && !isRejectionCase && (
          <div style={{ ...styles.editModeWarning, background: '#e0f2fe', borderColor: '#0284c7', color: '#0c4a6e' }}>
            <PenTool size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong> Modo edición</strong>
              <span style={{ display: 'block', fontSize: 11, marginTop: 4 }}>
                Estás editando una solución existente. Los cambios actualizarán la base de conocimiento.
              </span>
            </span>
          </div>
        )}

        {/* Título del artículo - SIEMPRE BLOQUEADO */}
        <div style={styles.field}>
          <label style={styles.lbl}>Título del artículo *</label>
          <input
            style={{ ...styles.input, background: '#f3f4f6', cursor: 'not-allowed' }}
            value={form.title}
            onChange={(e) => !readOnly && update('title', e.target.value)}
            placeholder={ticket.title}
            readOnly={true}
            disabled={true}
          />
          <small style={{ color: '#6b7280', fontSize: 11, marginTop: 4, display: 'block' }}>
            El título está basado en el ticket y no puede modificarse
          </small>
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
              borderColor: validationErrors.problem ? '#dc2626' : '#d1d5db',
              ...(readOnly ? styles.readOnlyInput : {})
            }}
            value={form.problem}
            onChange={handleProblemChange}
            placeholder="Describe el problema y los síntomas observados..."
            rows={4}
            readOnly={readOnly}
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
              borderColor: validationErrors.cause ? '#dc2626' : '#d1d5db',
              ...(readOnly ? styles.readOnlyInput : {})
            }}
            value={form.cause}
            onChange={handleCauseChange}
            placeholder="¿Cuál fue la causa original del problema?"
            rows={3}
            readOnly={readOnly}
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
              borderColor: validationErrors.solution ? '#dc2626' : '#d1d5db',
              ...(readOnly ? styles.readOnlyInput : {})
            }}
            value={form.solution}
            onChange={handleSolutionChange}
            placeholder="Describe detalladamente la solución implementada..."
            rows={4}
            readOnly={readOnly}
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

        {/* Imágenes - Solo lectura: mostrar existentes / Edición: permitir subir */}
        {readOnly ? (
          <div style={styles.field}>
            <label style={styles.lbl}>
              <Image size={14} style={{ marginRight: 6 }} />
              Imágenes adjuntas del ticket
            </label>
            {loadingImages ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#6b7280', fontSize: 13 }}>
                Cargando imágenes...
              </div>
            ) : existingImages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 13, background: '#f9fafb', borderRadius: 8, border: '1px dashed #e5e7eb' }}>
                <FileImage size={24} color="#d1d5db" style={{ marginBottom: 6 }} />
                <p style={{ margin: 0 }}>No hay imágenes adjuntas en este ticket</p>
              </div>
            ) : (
              <div style={styles.existingImagesGrid}>
                {existingImages.map((img) => (
                  <div key={img.id} style={styles.existingImageCard}>
                    <div style={styles.existingImageIcon} onClick={() => handleViewExistingImage(img)}>
                      <FileImage size={28} color="#4361ee" />
                      <Eye size={14} color="#4361ee" style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    </div>
                    <div style={styles.existingImageInfo}>
                      <span style={styles.existingImageName}>
                        {img.fileName.length > 18 ? img.fileName.substring(0, 18) + '...' : img.fileName}
                      </span>
                      <span style={styles.existingImageSize}>
                        {(img.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      style={styles.existingImageDownload}
                      onClick={() => handleDownloadImage(img)}
                      title="Descargar"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
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
        )}

        <div style={styles.actions}>
          <button style={styles.btnGhost} onClick={onClose} disabled={submitting}>
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!readOnly && (
            <button style={styles.btnPrimary} onClick={submit} disabled={submitting || uploading}>
              {submitting ? (
                <>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />
                  Guardando...
                </>
              ) : uploading ? (
                <>
                  <Upload size={14} style={{ marginRight: 6 }} />
                  Subiendo... {uploadProgress}%
                </>
              ) : isRejectionCase ? (
                <>
                  <FilePlus size={14} style={{ marginRight: 6 }} />
                  Registrar Nueva Solución
                </>
              ) : existingArticle ? (
                <>
                  <PenTool size={14} style={{ marginRight: 6 }} />
                  Actualizar Solución
                </>
              ) : (
                <>
                  <Save size={14} style={{ marginRight: 6 }} />
                  Guardar Solución
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal de imagen ampliada */}
        {selectedImage && (
          <div style={styles.imageModalOverlay} onClick={() => setSelectedImage(null)}>
            <div style={styles.imageModalBox} onClick={(e) => e.stopPropagation()}>
              <button style={styles.imageModalClose} onClick={() => setSelectedImage(null)}>
                <X size={20} />
              </button>
              <img
                src={selectedImage.url}
                alt={selectedImage.fileName}
                style={styles.imageModalImg}
              />
              <div style={styles.imageModalInfo}>
                <span>{selectedImage.fileName}</span>
                <span>{(selectedImage.fileSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
        )}
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
  readOnlyBanner: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#166534', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  readOnlyInput: { background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed', borderColor: '#e5e7eb' },
  // Galería de imágenes existentes (modo solo lectura)
  existingImagesGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  existingImageCard: { display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', minWidth: 200, maxWidth: 280 },
  existingImageIcon: { position: 'relative', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2ff', borderRadius: 8, cursor: 'pointer', flexShrink: 0 },
  existingImageInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' },
  existingImageName: { fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  existingImageSize: { fontSize: 10, color: '#94a3b8' },
  existingImageDownload: { background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: 6, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  // Modal de imagen ampliada
  imageModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  imageModalBox: { position: 'relative', maxWidth: '85vw', maxHeight: '85vh', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
  imageModalClose: { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 },
  imageModalImg: { maxWidth: '85vw', maxHeight: '75vh', objectFit: 'contain', display: 'block' },
  imageModalInfo: { display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12, color: '#6b7280', borderTop: '1px solid #f3f4f6' },
};