import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, AlertCircle, Info, MapPin, Hash, FileText,
  Wrench, Briefcase, Image, Upload, X, Loader,
  XCircle
} from 'lucide-react';
import { ticketAPI, catalogAPI } from '../services/api';
import Layout from '../components/Layout';
import { useNotifications } from '../components/NotificationProvider';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const TITLE_MIN = 5;
const TITLE_MAX = 120;
const DESC_MIN = 20;
const DESC_MAX = 1000;
const MIN_WORDS = 3;

const COLORS = {
  Primario: '#2d6a9f',
  PrimarioLight: '#eef2ff',
  Error: '#ef4444',
  TextoSecundario: '#6b7280',
  Borde: '#e4e7eb',
};

const LOCATIONS = [
  { id: 'lab1', name: 'Laboratorio 1 - Edificio A' },
  { id: 'lab2', name: 'Laboratorio 2 - Edificio A' },
  { id: 'lab3', name: 'Laboratorio 3 - Edificio B' },
  { id: 'lab4', name: 'Laboratorio 4 - Edificio B' },
  { id: 'ofi1', name: 'Oficina Administrativa - Planta Baja' },
  { id: 'ofi2', name: 'Oficina Docentes - Piso 2' },
  { id: 'aula1', name: 'Aula 101 - Edificio Principal' },
  { id: 'aula2', name: 'Aula 102 - Edificio Principal' },
  { id: 'aula3', name: 'Aula 201 - Edificio Principal' },
  { id: 'biblioteca', name: 'Biblioteca Central' },
  { id: 'sala_profesores', name: 'Sala de Profesores' },
  { id: 'auditorio', name: 'Auditorio' },
  { id: 'otro', name: 'Otro (especificar)' },
];

// ✅ VALIDACIÓN PARA EVITAR TEXTO SIN SENTIDO
const validateMeaningfulText = (text, fieldName) => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, message: `${fieldName} es obligatorio` };
  }

  const trimmedText = text.trim();
  const words = trimmedText.split(/\s+/).filter(w => w.length > 0);

  if (words.length < MIN_WORDS) {
    return { isValid: false, message: `${fieldName} debe tener al menos ${MIN_WORDS} palabras (tiene ${words.length})` };
  }

  // Detectar caracteres repetidos (ej: "qqqqqqqqqq")
  const repeatedCharPattern = /^(.)\1{9,}$/i;
  if (repeatedCharPattern.test(trimmedText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} contiene caracteres repetidos. Escribe una descripción con sentido.` };
  }

  // Detectar solo números (ej: "123456789")
  const onlyNumbersPattern = /^\d+$/;
  if (onlyNumbersPattern.test(trimmedText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} no puede ser solo números. Describe el problema.` };
  }

  // Detectar solo caracteres especiales (ej: "!!!!!")
  const onlySpecialCharsPattern = /^[^a-zA-Z0-9\u00C0-\u00FF]+$/;
  if (onlySpecialCharsPattern.test(trimmedText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} contiene solo caracteres especiales. Escribe una descripción.` };
  }

  // Detectar si no tiene vocales (sin sentido)
  const hasVowel = /[aeiouáéíóúü]/i.test(trimmedText);
  if (!hasVowel) {
    return { isValid: false, message: `${fieldName} no parece tener sentido. Escribe una descripción clara.` };
  }

  // Detectar si no tiene letras
  const hasLetter = /[a-zA-Z\u00C0-\u00FF]/.test(trimmedText);
  if (!hasLetter) {
    return { isValid: false, message: `${fieldName} debe contener letras. Describe el problema.` };
  }

  // Detectar patrones de teclado (ej: "qwerty", "asdfgh", "zxcvbn")
  const keyboardPatterns = [
    /qwerty/i, /asdfgh/i, /zxcvbn/i, /qwertyuiop/i,
    /asdfghjkl/i, /zxcvbnm/i, /123456/, /abcdef/i, /aaaaa/i, /bbbbb/i
  ];
  for (const pattern of keyboardPatterns) {
    if (pattern.test(trimmedText.toLowerCase().replace(/\s/g, ''))) {
      return { isValid: false, message: `${fieldName} contiene un patrón de teclado. Escribe una descripción con sentido.` };
    }
  }

  // Detectar signos de puntuación repetidos
  const repeatedPunctuation = /[!¡?¿.,;:]{3,}/;
  if (repeatedPunctuation.test(trimmedText)) {
    return { isValid: false, message: `${fieldName} contiene signos de puntuación repetidos.` };
  }

  // Detectar todo en mayúsculas (gritos)
  const isAllUppercase = trimmedText === trimmedText.toUpperCase() && trimmedText.length > 10;
  if (isAllUppercase) {
    return { isValid: false, message: `${fieldName} está todo en mayúsculas. Escribe en minúsculas o formato normal.` };
  }

  return { isValid: true, message: '' };
};

const validateTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return { isValid: false, message: 'El título es obligatorio' };
  }
  if (title.length < TITLE_MIN) {
    return { isValid: false, message: `El título debe tener al menos ${TITLE_MIN} caracteres` };
  }
  if (title.length > TITLE_MAX) {
    return { isValid: false, message: `El título no puede exceder ${TITLE_MAX} caracteres` };
  }
  const meaningfulCheck = validateMeaningfulText(title, 'El título');
  if (!meaningfulCheck.isValid) {
    return meaningfulCheck;
  }
  return { isValid: true, message: '' };
};

const validateDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return { isValid: false, message: 'La descripción es obligatoria' };
  }
  if (description.length < DESC_MIN) {
    return { isValid: false, message: `La descripción debe tener al menos ${DESC_MIN} caracteres` };
  }
  if (description.length > DESC_MAX) {
    return { isValid: false, message: `La descripción no puede exceder ${DESC_MAX} caracteres` };
  }
  const words = description.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length < MIN_WORDS) {
    return { isValid: false, message: `La descripción debe tener al menos ${MIN_WORDS} palabras` };
  }
  const meaningfulCheck = validateMeaningfulText(description, 'La descripción');
  if (!meaningfulCheck.isValid) {
    return meaningfulCheck;
  }
  return { isValid: true, message: '' };
};

function CreateTicket() {
  const navigate = useNavigate();
  const [damages, setDamages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotifications();

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Media',
    locationType: '',
    locationCustom: '',
    assetCode: '',
    damageCatalogId: '',
    serviceCatalogId: '',
    userId: parseInt(localStorage.getItem('userId')) || 0,
  });

  useEffect(() => {
    catalogAPI.get('/damagecatalog').then((res) => setDamages(res.data));
  }, []);

  const handleDamageChange = (e) => {
    const damageId = e.target.value;
    setForm({ ...form, damageCatalogId: damageId, serviceCatalogId: '' });
    if (damageId) {
      catalogAPI.get(`/servicecatalog/by-damage/${damageId}`).then((res) => setServices(res.data));
    } else {
      setServices([]);
    }
  };

  const getLocationValue = () => {
    if (form.locationType === 'otro') return form.locationCustom;
    const location = LOCATIONS.find(l => l.id === form.locationType);
    return location ? location.name : '';
  };

  const validateForm = () => {
    const errors = {};
    const titleValidation = validateTitle(form.title);
    if (!titleValidation.isValid) errors.title = titleValidation.message;
    const descValidation = validateDescription(form.description);
    if (!descValidation.isValid) errors.description = descValidation.message;
    if (!form.locationType) errors.location = 'Selecciona una ubicación';
    if (form.locationType === 'otro' && !form.locationCustom.trim()) errors.location = 'Especifica la ubicación';
    if (!form.damageCatalogId) errors.damage = 'Selecciona una categoría';
    if (!form.serviceCatalogId) errors.service = 'Selecciona un servicio';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (field === 'title') {
      const validation = validateTitle(value);
      setValidationErrors(prev => ({ ...prev, title: validation.isValid ? null : validation.message }));
    }
    if (field === 'description') {
      const validation = validateDescription(value);
      setValidationErrors(prev => ({ ...prev, description: validation.isValid ? null : validation.message }));
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length > MAX_FILES) {
      showToast({ type: 'error', title: 'Error', message: `Máximo ${MAX_FILES} archivos` });
      return;
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast({ type: 'error', title: 'Error', message: `Formato no permitido: ${file.name}` });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast({ type: 'error', title: 'Error', message: `Archivo muy grande: ${file.name} (Máx 5MB)` });
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments(prev => [...prev, {
          file: file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const locationValue = getLocationValue();
    if (!locationValue) {
      showToast({ type: 'error', title: 'Error', message: 'Debes seleccionar una ubicación' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('Title', form.title.trim());
      formData.append('Description', form.description.trim());
      formData.append('Priority', form.priority);
      formData.append('Location', locationValue);
      formData.append('AssetCode', form.assetCode);
      formData.append('DamageCatalogId', form.damageCatalogId);
      formData.append('ServiceCatalogId', form.serviceCatalogId);
      formData.append('UserId', form.userId);

      attachments.forEach((att) => formData.append('files', att.file));

      await ticketAPI.post('/ticket', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast({ type: 'success', title: 'Ticket creado', message: 'Ticket creado exitosamente' });
      setTimeout(() => navigate('/tickets'), 2000);
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Error al crear el ticket' });
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find(sv => sv.id === parseInt(form.serviceCatalogId));
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCharCountColor = (current, max) => {
    if (current > max) return COLORS.Error;
    if (current > max * 0.9) return COLORS.Advertencia || '#f59e0b';
    return COLORS.TextoSecundario;
  };

  return (
    <Layout>
      <div className="create-ticket-container">
        <h1 className="create-ticket-title">Crear Nuevo Ticket</h1>
        <p className="create-ticket-subtitle">Complete todos los campos obligatorios (*)</p>

        <form onSubmit={handleSubmit} className="create-ticket-form">
          {/* Información del problema */}
          <div className="form-section">
            <h3 className="form-section-title">
              <FileText size={16} /> Información del problema
            </h3>

            <div className="form-field">
              <label className="form-label">Título * <span className="form-hint">(mín. {TITLE_MIN} car.)</span></label>
              <input
                className={`form-input ${validationErrors.title ? 'form-input-error' : ''}`}
                value={form.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Ej: El equipo no enciende después de actualizar Windows"
                maxLength={TITLE_MAX}
              />
              <div className="form-field-footer">
                <span className="form-char-count" style={{ color: getCharCountColor(form.title.length, TITLE_MAX) }}>
                  {form.title.length}/{TITLE_MAX} caracteres
                </span>
                {validationErrors.title && <span className="form-error">{validationErrors.title}</span>}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Descripción * <span className="form-hint">(mín. {DESC_MIN} car., {MIN_WORDS} palabras)</span></label>
              <textarea
                className={`form-textarea ${validationErrors.description ? 'form-input-error' : ''}`}
                value={form.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe el problema con detalle: ¿qué ocurrió? ¿desde cuándo? ¿qué estabas haciendo? Sé lo más específico posible."
                maxLength={DESC_MAX}
                rows={5}
              />
              <div className="form-field-footer">
                <span className="form-char-count" style={{ color: getCharCountColor(form.description.length, DESC_MAX) }}>
                  {form.description.length}/{DESC_MAX} caracteres - {form.description.split(/\s+/).filter(w => w.length > 0).length} palabras
                </span>
                {validationErrors.description && <span className="form-error">{validationErrors.description}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Prioridad *</label>
                <select className="form-select" value={form.priority} onChange={(e) => handleFieldChange('priority', e.target.value)}>
                  <option value="Baja">🟢 Baja — No urgente</option>
                  <option value="Media">🟡 Media — Requiere atención</option>
                  <option value="Alta">🟠 Alta — Impacto significativo</option>
                  <option value="Crítica">🔴 Crítica — Sistema caído</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Categoría *</label>
                <select className={`form-select ${validationErrors.damage ? 'form-input-error' : ''}`} value={form.damageCatalogId} onChange={handleDamageChange}>
                  <option value="">-- Selecciona --</option>
                  {damages.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {validationErrors.damage && <small className="form-error">{validationErrors.damage}</small>}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Servicio *</label>
              <select className={`form-select ${validationErrors.service ? 'form-input-error' : ''}`} value={form.serviceCatalogId} onChange={(e) => handleFieldChange('serviceCatalogId', e.target.value)} disabled={!form.damageCatalogId}>
                <option value="">{form.damageCatalogId ? '-- Selecciona --' : '-- Primero selecciona categoría --'}</option>
                {services.map((sv) => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
              </select>
              {validationErrors.service && <small className="form-error">{validationErrors.service}</small>}
              {selectedService && (
                <div className="service-info">
                  <Info size={14} /> Nivel {selectedService.attentionLevel}
                </div>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div className="form-section">
            <h3 className="form-section-title">
              <MapPin size={16} /> Ubicación
            </h3>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Ubicación *</label>
                <select className={`form-select ${validationErrors.location ? 'form-input-error' : ''}`} value={form.locationType} onChange={(e) => handleFieldChange('locationType', e.target.value)}>
                  <option value="">-- Selecciona --</option>
                  {LOCATIONS.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Código de activo</label>
                <input className="form-input" value={form.assetCode} onChange={(e) => handleFieldChange('assetCode', e.target.value)} placeholder="Ej: PC-LAB3B-05" />
              </div>
            </div>

            {form.locationType === 'otro' && (
              <div className="form-field">
                <label className="form-label">Especificar *</label>
                <input className={`form-input ${validationErrors.location ? 'form-input-error' : ''}`} value={form.locationCustom} onChange={(e) => handleFieldChange('locationCustom', e.target.value)} placeholder="Ej: Oficina 204" />
              </div>
            )}
            {validationErrors.location && <small className="form-error">{validationErrors.location}</small>}
          </div>

          {/* Adjuntos */}
          <div className="form-section">
            <h3 className="form-section-title">
              <Image size={16} /> Adjuntar evidencias
            </h3>

            <div className="upload-area">
              <input type="file" id="file-upload" multiple accept={ALLOWED_EXTENSIONS.join(',')} onChange={handleFileSelect} style={{ display: 'none' }} />
              <label htmlFor="file-upload" className="upload-label">
                <Upload size={32} color={COLORS.Primario} />
                <span>Subir imágenes</span>
                <small>{ALLOWED_EXTENSIONS.join(', ')} (Max 5MB)</small>
              </label>
              <div className="upload-info">
                {attachments.length} de {MAX_FILES} archivos
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="preview-grid">
                {attachments.map((att, idx) => (
                  <div key={idx} className="preview-card">
                    <img src={att.preview} alt={att.name} className="preview-image" />
                    <div className="preview-info">
                      <span className="preview-name">{att.name.substring(0, 10)}...</span>
                      <small>{formatFileSize(att.size)}</small>
                    </div>
                    <button type="button" className="remove-btn" onClick={() => removeAttachment(idx)} disabled={uploading}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="form-buttons">
            <button type="button" className="btn-cancel" onClick={() => navigate('/dashboard')}>
              <XCircle size={16} /> Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <Loader size={16} className="spinner" /> : <Plus size={16} />}
              {loading ? 'Creando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .create-ticket-container {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border-radius: 20px;
          border: 1px solid ${COLORS.Borde};
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .create-ticket-title {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1a1a2e;
        }

        .create-ticket-subtitle {
          font-size: 13px;
          color: ${COLORS.TextoSecundario};
          margin-bottom: 24px;
        }

        .form-hint {
          font-weight: normal;
          color: ${COLORS.TextoSecundario};
          font-size: 11px;
        }

        .form-section {
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid ${COLORS.Borde};
        }

        .form-section-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1a1a2e;
        }

        .form-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .form-field {
          margin-bottom: 20px;
          flex: 1;
          min-width: 200px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid ${COLORS.Borde};
          font-size: 14px;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-input-error {
          border-color: ${COLORS.Error};
        }

        .form-field-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .form-char-count {
          font-size: 11px;
          color: ${COLORS.TextoSecundario};
        }

        .form-error {
          color: ${COLORS.Error};
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .service-info {
          margin-top: 8px;
          font-size: 12px;
          background-color: ${COLORS.PrimarioLight};
          padding: 8px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .upload-area {
          border: 2px dashed ${COLORS.Borde};
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          background-color: #fafbfc;
        }

        .upload-label {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .upload-info {
          margin-top: 12px;
          font-size: 12px;
          color: ${COLORS.TextoSecundario};
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .preview-card {
          position: relative;
          border: 1px solid ${COLORS.Borde};
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
        }

        .preview-image {
          width: 100%;
          height: 70px;
          object-fit: cover;
        }

        .preview-info {
          padding: 4px;
          font-size: 9px;
          text-align: center;
        }

        .preview-name {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remove-btn {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 4px;
          padding: 2px;
          cursor: pointer;
          color: ${COLORS.Error};
        }

        .form-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .btn-cancel {
          flex: 1;
          padding: 12px;
          border: 1px solid ${COLORS.Borde};
          border-radius: 10px;
          background: #fff;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-submit {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: ${COLORS.Primario};
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .create-ticket-container {
            margin: 0 12px;
            padding: 16px;
          }

          .create-ticket-title {
            font-size: 20px;
          }

          .form-row {
            flex-direction: column;
            gap: 0;
          }

          .form-section {
            margin-bottom: 20px;
            padding-bottom: 16px;
          }

          .form-input, .form-select, .form-textarea {
            font-size: 16px;
            padding: 12px;
          }

          .form-buttons {
            flex-direction: column;
          }

          .btn-cancel, .btn-submit {
            padding: 12px;
          }

          .preview-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </Layout>
  );
}

export default CreateTicket;