import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, AlertCircle, CheckCircle, Info, MapPin, Hash, FileText, 
  Wrench, Briefcase, Image, Upload, X, File, Trash2, Loader, 
  XCircle
} from 'lucide-react';
import { ticketAPI, catalogAPI } from '../services/api';
import Layout from '../components/Layout';
import { useNotifications } from '../components/NotificationProvider';

// Constantes de configuración
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Validaciones de texto
const TITLE_MIN = 5;
const TITLE_MAX = 120;
const DESC_MIN = 20;
const DESC_MAX = 1000;
const MIN_WORDS = 3;

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

// Opciones de ubicación predefinidas
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

const validateMeaningfulText = (text, fieldName) => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, message: `${fieldName} es obligatorio` };
  }

  const trimmedText = text.trim();
  const words = trimmedText.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length < MIN_WORDS) {
    return { isValid: false, message: `${fieldName} debe tener al menos ${MIN_WORDS} palabras (tiene ${words.length})` };
  }

  const repeatedCharPattern = /^(.)\1{9,}$/i;
  if (repeatedCharPattern.test(trimmedText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} contiene caracteres repetidos. Escribe una descripción con sentido.` };
  }

  const onlyNumbersPattern = /^\d+$/;
  if (onlyNumbersPattern.test(trimmedText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} no puede ser solo números. Describe el problema.` };
  }

  const onlySpecialCharsPattern = /^[^a-zA-Z0-9\u00C0-\u00FF]+$/;
  if (onlySpecialCharsPattern.test(trimmedText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} contiene solo caracteres especiales. Escribe una descripción.` };
  }

  const hasVowel = /[aeiouáéíóúü]/i.test(trimmedText);
  if (!hasVowel) {
    return { isValid: false, message: `${fieldName} no parece tener sentido. Escribe una descripción clara.` };
  }

  const hasLetter = /[a-zA-Z\u00C0-\u00FF]/.test(trimmedText);
  if (!hasLetter) {
    return { isValid: false, message: `${fieldName} debe contener letras. Describe el problema.` };
  }

  const keyboardPatterns = [
    /qwerty/i, /asdfgh/i, /zxcvbn/i, /qwertyuiop/i, 
    /asdfghjkl/i, /zxcvbnm/i, /123456/, /abcdef/i, /aaaaa/i, /bbbbb/i
  ];
  for (const pattern of keyboardPatterns) {
    if (pattern.test(trimmedText.toLowerCase().replace(/\s/g, ''))) {
      return { isValid: false, message: `${fieldName} contiene un patrón de teclado. Escribe una descripción con sentido.` };
    }
  }

  const repeatedPunctuation = /[!¡?¿.,;:]{3,}/;
  if (repeatedPunctuation.test(trimmedText)) {
    return { isValid: false, message: `${fieldName} contiene signos de puntuación repetidos.` };
  }

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
      catalogAPI
        .get(`/servicecatalog/by-damage/${damageId}`)
        .then((res) => setServices(res.data));
    } else {
      setServices([]);
    }
    if (validationErrors.damage) {
      setValidationErrors({ ...validationErrors, damage: null });
    }
  };

  const getLocationValue = () => {
    if (form.locationType === 'otro') {
      return form.locationCustom;
    }
    const location = LOCATIONS.find(l => l.id === form.locationType);
    return location ? location.name : '';
  };

  const validateForm = () => {
    const errors = {};

    const titleValidation = validateTitle(form.title);
    if (!titleValidation.isValid) {
      errors.title = titleValidation.message;
    }

    const descValidation = validateDescription(form.description);
    if (!descValidation.isValid) {
      errors.description = descValidation.message;
    }

    if (!form.locationType) {
      errors.location = 'Debes seleccionar una ubicación';
    }
    if (form.locationType === 'otro' && !form.locationCustom.trim()) {
      errors.location = 'Debes especificar la ubicación';
    }

    if (!form.damageCatalogId) {
      errors.damage = 'Debes seleccionar una categoría de daño';
    }

    if (!form.serviceCatalogId) {
      errors.service = 'Debes seleccionar un servicio';
    }

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
    
    if (field !== 'title' && field !== 'description' && validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const errors = [];

    if (attachments.length + files.length > MAX_FILES) {
      errors.push(`Máximo ${MAX_FILES} archivos permitidos`);
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`Formato no permitido: ${file.name}. Use: ${ALLOWED_EXTENSIONS.join(', ')}`);
        continue;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`Archivo muy grande: ${file.name}. Máximo 5MB`);
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

    if (errors.length > 0) {
      showToast({ type: 'error', title: 'Error', message: errors.join('. ') });
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (ticketId) => {
    if (attachments.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    attachments.forEach((att) => {
      formData.append('files', att.file);
    });

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => prev >= 90 ? prev : prev + 10);
      }, 200);

      await ticketAPI.post(`/ticket/${ticketId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      console.error('Error subiendo archivos:', err);
      showToast({ type: 'error', title: 'Error', message: 'Error al subir algunos archivos adjuntos' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const locationValue = getLocationValue();
    if (!locationValue) {
      showToast({ type: 'error', title: 'Error', message: 'Debes seleccionar o especificar una ubicación' });
      return;
    }

    if (!form.serviceCatalogId) {
      showToast({ type: 'error', title: 'Error', message: 'Debes seleccionar un servicio.' });
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
      
      attachments.forEach((att) => {
        formData.append('files', att.file);
      });
      
      await ticketAPI.post('/ticket', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast({ 
        type: 'success', 
        title: 'Ticket creado', 
        message: 'Ticket creado exitosamente' 
      });
      
      setTimeout(() => navigate('/tickets'), 2000);
    } catch (err) {
      showToast({ 
        type: 'error', 
        title: 'Error', 
        message: err.response?.data?.message || 'Error al crear el ticket' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (attachments.length > 0 || form.title || form.description) {
      if (window.confirm('¿Estás seguro? Los cambios no guardados se perderán.')) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const selectedService = services.find(
    (sv) => sv.id === parseInt(form.serviceCatalogId)
  );

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCharCountColor = (current, max) => {
    if (current > max) return COLORS.Error;
    if (current > max * 0.9) return COLORS.Advertencia;
    return COLORS.TextoSecundario;
  };

  return (
    <Layout>
      <main style={s.content}>
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h1 style={s.formTitle}>Crear Nuevo Ticket</h1>
            <p style={s.formSubtitle}>
              Complete todos los campos obligatorios (*) para registrar el problema.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Sección: Información del problema */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>
                <FileText size={18} color={COLORS.Primario} />
                Información del problema
              </h3>

              <div style={s.field}>
                <label style={s.label}>
                  Título *
                  <span style={s.requiredStar}> (mín. {TITLE_MIN} car.)</span>
                </label>
                <input
                  style={{
                    ...s.input,
                    borderColor: validationErrors.title ? COLORS.Error : COLORS.Borde
                  }}
                  value={form.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Ej: El equipo no enciende después de actualizar Windows"
                  maxLength={TITLE_MAX}
                />
                <div style={s.fieldFooter}>
                  <span style={s.hint}>
                    {form.title.length}/{TITLE_MAX} caracteres
                  </span>
                  {validationErrors.title && (
                    <span style={s.errorText}>
                      <AlertCircle size={12} /> {validationErrors.title}
                    </span>
                  )}
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>
                  Descripción detallada *
                  <span style={s.requiredStar}> (mín. {DESC_MIN} car., 3 palabras)</span>
                </label>
                <textarea
                  style={{
                    ...s.textarea,
                    borderColor: validationErrors.description ? COLORS.Error : COLORS.Borde
                  }}
                  value={form.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Describe el problema con detalle: ¿qué ocurrió? ¿desde cuándo? ¿qué estabas haciendo? Sé lo más específico posible."
                  maxLength={DESC_MAX}
                  rows={5}
                />
                <div style={s.fieldFooter}>
                  <span style={{
                    ...s.hint,
                    color: getCharCountColor(form.description.length, DESC_MAX)
                  }}>
                    {form.description.length}/{DESC_MAX} caracteres - 
                    {form.description.split(/\s+/).filter(w => w.length > 0).length} palabras
                  </span>
                  {validationErrors.description && (
                    <span style={s.errorText}>
                      <AlertCircle size={12} /> {validationErrors.description}
                    </span>
                  )}
                </div>
              </div>

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Prioridad *</label>
                  <select
                    style={s.select}
                    value={form.priority}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                  >
                    <option value="Baja">🟢 Baja — No urgente</option>
                    <option value="Media">🟡 Media — Requiere atención</option>
                    <option value="Alta">🟠 Alta — Impacto significativo</option>
                    <option value="Crítica">🔴 Crítica — Sistema caído</option>
                  </select>
                </div>

                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Categoría de daño *</label>
                  <div style={{ position: 'relative' }}>
                    <Wrench size={18} style={s.inputIcon} color={COLORS.TextoSecundario} />
                    <select
                      style={{
                        ...s.select,
                        paddingLeft: 40,
                        borderColor: validationErrors.damage ? COLORS.Error : COLORS.Borde
                      }}
                      value={form.damageCatalogId}
                      onChange={handleDamageChange}
                    >
                      <option value="">-- Selecciona categoría --</option>
                      {damages.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  {validationErrors.damage && (
                    <span style={s.errorText}>
                      <AlertCircle size={12} /> {validationErrors.damage}
                    </span>
                  )}
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Servicio afectado *</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={18} style={s.inputIcon} color={COLORS.TextoSecundario} />
                  <select
                    style={{
                      ...s.select,
                      paddingLeft: 40,
                      borderColor: validationErrors.service ? COLORS.Error : COLORS.Borde
                    }}
                    value={form.serviceCatalogId}
                    onChange={(e) => handleFieldChange('serviceCatalogId', e.target.value)}
                    disabled={!form.damageCatalogId}
                  >
                    <option value="">
                      {form.damageCatalogId
                        ? '-- Selecciona el servicio --'
                        : '-- Primero selecciona una categoría de daño --'}
                    </option>
                    {services.map((sv) => (
                      <option key={sv.id} value={sv.id}>{sv.name}</option>
                    ))}
                  </select>
                </div>
                {validationErrors.service && (
                  <span style={s.errorText}>
                    <AlertCircle size={12} /> {validationErrors.service}
                  </span>
                )}
                {selectedService && (
                  <div style={s.serviceInfo}>
                    <Info size={14} style={s.serviceInfoIcon} />
                    Este servicio será atendido por un técnico de{' '}
                    <strong>Nivel {selectedService.attentionLevel}</strong>.
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Ubicación y equipo */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>
                <MapPin size={18} color={COLORS.Primario} />
                Ubicación y equipo
              </h3>

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Ubicación *</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={s.inputIcon} color={COLORS.TextoSecundario} />
                    <select
                      style={{
                        ...s.select,
                        paddingLeft: 40,
                        borderColor: validationErrors.location ? COLORS.Error : COLORS.Borde
                      }}
                      value={form.locationType}
                      onChange={(e) => handleFieldChange('locationType', e.target.value)}
                    >
                      <option value="">-- Selecciona una ubicación --</option>
                      {LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Código de activo / Equipo</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={18} style={s.inputIcon} color={COLORS.TextoSecundario} />
                    <input
                      style={s.input}
                      value={form.assetCode}
                      onChange={(e) => handleFieldChange('assetCode', e.target.value)}
                      placeholder="Ej: PC-LAB3B-05, IMP-OF201"
                    />
                  </div>
                </div>
              </div>

              {form.locationType === 'otro' && (
                <div style={s.field}>
                  <label style={s.label}>Especificar ubicación *</label>
                  <input
                    style={{
                      ...s.input,
                      borderColor: validationErrors.location ? COLORS.Error : COLORS.Borde
                    }}
                    value={form.locationCustom}
                    onChange={(e) => handleFieldChange('locationCustom', e.target.value)}
                    placeholder="Ej: Pasillo 3B, Oficina 204, Bodega..."
                  />
                </div>
              )}
              {validationErrors.location && (
                <span style={s.errorText}>
                  <AlertCircle size={12} /> {validationErrors.location}
                </span>
              )}
            </div>

            {/* Sección: Adjuntar archivos */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>
                <Image size={18} color={COLORS.Primario} />
                Adjuntar evidencias (opcional)
              </h3>

              <div style={s.uploadArea}>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={attachments.length >= MAX_FILES}
                />
                <label 
                  htmlFor="file-upload" 
                  style={{
                    ...s.uploadLabel,
                    opacity: attachments.length >= MAX_FILES ? 0.5 : 1,
                    cursor: attachments.length >= MAX_FILES ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Upload size={28} color={COLORS.Primario} />
                  <span>Subir imágenes</span>
                  <small>{ALLOWED_EXTENSIONS.join(', ')} (Máx {MAX_FILE_SIZE / (1024 * 1024)}MB)</small>
                </label>
                
                <div style={s.uploadInfo}>
                  <Image size={14} />
                  <span>{attachments.length} de {MAX_FILES} archivos seleccionados</span>
                </div>
              </div>

              {uploading && (
                <div style={s.progressContainer}>
                  <div style={s.progressBar}>
                    <div style={{ ...s.progressFill, width: `${uploadProgress}%` }} />
                  </div>
                  <span style={s.progressText}>Subiendo... {uploadProgress}%</span>
                </div>
              )}

              {attachments.length > 0 && (
                <div style={s.previewGrid}>
                  {attachments.map((att, index) => (
                    <div key={index} style={s.previewCard}>
                      <img 
                        src={att.preview} 
                        alt={att.name}
                        style={s.previewImage}
                      />
                      <div style={s.previewInfo}>
                        <span style={s.previewName} title={att.name}>
                          {att.name.length > 15 ? att.name.substring(0, 15) + '...' : att.name}
                        </span>
                        <span style={s.previewSize}>{formatFileSize(att.size)}</span>
                      </div>
                      <button
                        type="button"
                        style={s.removeBtn}
                        onClick={() => removeAttachment(index)}
                        disabled={uploading}
                      >
                        <X size={14} color={COLORS.Error} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div style={s.buttonGroup}>
              <button 
                type="button"
                style={s.cancelBtn}
                onClick={handleCancel}
              >
                <XCircle size={18} style={{ marginRight: 8 }} />
                Cancelar
              </button>
              <button 
                type="submit" 
                style={s.submitBtn} 
                disabled={loading || uploading}
              >
                {loading ? (
                  <>
                    <Loader size={18} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                    Creando ticket...
                  </>
                ) : uploading ? (
                  <>
                    <Upload size={18} style={{ marginRight: 8 }} />
                    Subiendo archivos... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Plus size={18} style={{ marginRight: 8 }} />
                    Crear Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </Layout>
  );
}

const s = {
  content: { 
    padding: '28px 32px', 
    flex: 1, 
    backgroundColor: COLORS.Fondo, 
    minHeight: '100vh' 
  },
  formCard: { 
    width: '100%', 
    maxWidth: 900, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    border: `1px solid ${COLORS.Borde}`, 
    padding: 32, 
    margin: '0 auto',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  formHeader: { marginBottom: 28 },
  formTitle: { fontSize: 26, fontWeight: 700, color: COLORS.Texto, marginBottom: 8 },
  formSubtitle: { fontSize: 13, color: COLORS.TextoSecundario },
  section: { marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${COLORS.Borde}` },
  sectionTitle: { 
    fontSize: 15, fontWeight: 700, color: COLORS.Texto, marginBottom: 18, 
    display: 'flex', alignItems: 'center', gap: 8 
  },
  row: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  field: { marginBottom: 20, flex: 1, minWidth: 200 },
  label: { display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#374151' },
  requiredStar: { fontWeight: 'normal', color: COLORS.TextoSecundario, fontSize: 11 },
  input: { 
    width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.Borde}`, 
    fontSize: 13, boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff',
    transition: 'all 0.2s ease',
  },
  select: { 
    width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.Borde}`, 
    fontSize: 13, boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff',
    transition: 'all 0.2s ease',
  },
  inputIcon: { 
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' 
  },
  textarea: { 
    width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 10, 
    border: `1px solid ${COLORS.Borde}`, fontSize: 13, boxSizing: 'border-box', 
    resize: 'vertical', outline: 'none', fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  fieldFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  hint: { fontSize: 11, color: COLORS.TextoSecundario, display: 'block' },
  errorText: { fontSize: 11, color: COLORS.Error, display: 'flex', alignItems: 'center', gap: 4 },
  serviceInfo: { 
    marginTop: 8, fontSize: 12, color: '#374151', backgroundColor: COLORS.PrimarioLight, 
    padding: '8px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 
  },
  serviceInfoIcon: { fontSize: 14, color: COLORS.Primario },
  
  uploadArea: {
    border: `2px dashed ${COLORS.Borde}`,
    borderRadius: 12,
    padding: 24,
    textAlign: 'center',
    backgroundColor: '#fafbfc',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  uploadInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    fontSize: 12,
    color: COLORS.TextoSecundario,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.Primario,
    borderRadius: 3,
    transition: 'width 0.3s',
  },
  progressText: {
    display: 'block',
    fontSize: 11,
    color: COLORS.Primario,
    marginTop: 6,
    textAlign: 'center',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 12,
    marginTop: 16,
  },
  previewCard: {
    position: 'relative',
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  previewImage: {
    width: '100%',
    height: 80,
    objectFit: 'cover',
  },
  previewInfo: {
    padding: 6,
    textAlign: 'center',
  },
  previewName: {
    fontSize: 9,
    color: '#374151',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewSize: {
    fontSize: 8,
    color: COLORS.TextoSecundario,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: 6,
    padding: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGroup: {
    display: 'flex',
    gap: 16,
    marginTop: 16,
  },
  submitBtn: { 
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: 12,
    backgroundColor: COLORS.Primario,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    border: `1px solid ${COLORS.Borde}`,
    borderRadius: 12,
    backgroundColor: '#fff',
    color: '#374151',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
};

// Añadir animación y efectos focus
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  input:focus, textarea:focus, select:focus {
    border-color: ${COLORS.Primario} !important;
    box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1) !important;
    outline: none !important;
  }
  
  ${s.submitBtn}:hover {
    background-color: ${COLORS.PrimarioOscuro} !important;
    transform: translateY(-1px);
  }
  
  ${s.cancelBtn}:hover {
    background-color: #f9fafb !important;
    border-color: ${COLORS.Primario} !important;
  }
  
  .preview-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;
document.head.appendChild(styleSheet);

export default CreateTicket;