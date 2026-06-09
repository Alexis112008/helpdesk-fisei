import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Flame,
  Briefcase,
  Wrench,
  MapPin,
  Hash,
  Building2,
  Calendar,
  RefreshCw,
  MessageCircle,
  Send,
  Lock,
  FileText,
  Info,
  Eye,
  Check,
  X,
  Plus,
  User,
  Tag,
  Settings,
  BookOpen,
  ArrowUp,
  History,
  Ticket,
  Download,
  Trash2,
  Image,
  FileImage,
  ThumbsUp
} from 'lucide-react';
import Layout from '../components/Layout';
import { ticketAPI, catalogAPI, authAPI } from '../services/api';
import { attachmentsAPI } from '../services/api';
import { useNotifications } from '../components/NotificationProvider';
import KnowledgeForm from '../components/KnowledgeForm';
import { getConnection, joinUserGroup, joinTechnicianGroup } from '../services/realtime';
import { exportTicketDetailToPDF } from '../services/exportService';



// Validación para evitar texto sin sentido
const validateMeaningfulText = (text, fieldName) => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, message: `${fieldName} es obligatorio` };
  }

  const trimmedText = text.trim();
  const lowerText = trimmedText.toLowerCase();

  // 1. Detectar caracteres repetidos (ej: "ssssssssss", "aaaaaaaaaa")
  const repeatedCharPattern = /^(.)\1{9,}$/i;
  if (repeatedCharPattern.test(trimmedText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} contiene caracteres repetidos. Escribe un motivo válido.` };
  }

  // 2. Detectar solo el mismo carácter con espacios (ej: "a a a a a")
  const repeatedWithSpaces = /^(.)(\s+\1)+$/i;
  if (repeatedWithSpaces.test(trimmedText)) {
    return { isValid: false, message: `${fieldName} contiene caracteres repetidos. Escribe un motivo válido.` };
  }

  // 3. Detectar solo números (ej: "123456789")
  const onlyNumbersPattern = /^\d+$/;
  if (onlyNumbersPattern.test(trimmedText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} no puede ser solo números. Describe el motivo.` };
  }

  // 4. Detectar si no tiene vocales (sin sentido) - ej: "sdfghjkl"
  const hasVowel = /[aeiouáéíóúü]/i.test(trimmedText);
  if (!hasVowel && trimmedText.length > 3) {
    return { isValid: false, message: `${fieldName} no parece tener sentido. Escribe un motivo claro con vocales.` };
  }

  // 5. Detectar patrones de teclado (ej: "qwerty", "asdfghjkl", "zxcvbnm")
  const keyboardPatterns = [
    /qwerty/i, /asdfgh/i, /zxcvbn/i, /qwertyuiop/i,
    /asdfghjkl/i, /zxcvbnm/i, /qwertyuiopasdfghjkl/i,
    /poiuytrewq/i, /lkjhgfdsa/i, /mnbvcxz/i,
    /123456/, /123456789/, /0987654321/, /12345/
  ];
  for (const pattern of keyboardPatterns) {
    if (pattern.test(lowerText.replace(/\s/g, ''))) {
      return { isValid: false, message: `${fieldName} contiene un patrón de teclado. Escribe un motivo con sentido.` };
    }
  }

  // 6. Detectar letras consecutivas en orden alfabético (ej: "abcdef", "abcd")
  const alphabeticalPattern = /abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/i;
  if (alphabeticalPattern.test(lowerText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} contiene letras en orden alfabético. Escribe un motivo real.` };
  }

  // 7. Detectar letras consecutivas en orden inverso (ej: "zyxwvu")
  const reverseAlphabetical = /zyxw|yxwv|xwvu|wvut|vuts|utsr|tsrq|srqp|rqpo|qpon|ponm|onml|nmlk|mlkj|lkji|kjih|jihg|ihgf|hgfe|gfed|fedc|edcb|dcba/i;
  if (reverseAlphabetical.test(lowerText.replace(/\s/g, ''))) {
    return { isValid: false, message: `${fieldName} contiene letras en orden inverso. Escribe un motivo con sentido.` };
  }

  // 8. Detectar si no hay letras (solo números o símbolos)
  const hasLetter = /[a-zA-Z\u00C0-\u00FF]/i.test(trimmedText);
  if (!hasLetter) {
    return { isValid: false, message: `${fieldName} debe contener letras. Describe el motivo correctamente.` };
  }

  // 9. Detectar texto muy corto sin sentido (menos de 10 caracteres y sin palabras reales)
  if (trimmedText.length < 10 && !trimmedText.includes(' ')) {
    return { isValid: false, message: `${fieldName} es demasiado corto. Explica con más detalle (mínimo 10 caracteres).` };
  }

  // 10. Detectar palabras repetidas (ej: "hola hola hola")
  const repeatedWords = /(\b\w+\b)\s+\1\s+\1/;
  if (repeatedWords.test(lowerText)) {
    return { isValid: false, message: `${fieldName} tiene palabras repetidas. Escribe un motivo válido.` };
  }

  // 11. Detectar solo consonantes sin vocales en palabras largas
  const words = trimmedText.split(/\s+/);
  for (const word of words) {
    if (word.length > 5 && !/[aeiouáéíóúü]/i.test(word)) {
      return { isValid: false, message: `${fieldName} contiene la palabra "${word}" que no tiene vocales. Escribe correctamente.` };
    }
  }

  // 12. Detectar emojis o símbolos raros como único contenido
  const onlySymbolsPattern = /^[^\w\s\u00C0-\u00FF]+$/;
  if (onlySymbolsPattern.test(trimmedText)) {
    return { isValid: false, message: `${fieldName} contiene solo símbolos. Escribe una descripción clara.` };
  }

  return { isValid: true, message: '' };
};

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

const parseSolutionDescription = (description, ticket) => {
  const extractField = (text, fieldName) => {
    const pattern = `${fieldName}:`;
    const index = text.indexOf(pattern);
    if (index === -1) return null;

    const start = index + pattern.length;
    const nextFields = ["Problema:", "Causa:", "Solución:"];
    let end = text.length;

    for (const f of nextFields) {
      const fIdx = text.indexOf(f, start);
      if (fIdx !== -1 && fIdx < end) {
        end = fIdx;
      }
    }
    return text.substring(start, end).trim();
  };

  const problem = extractField(description, "Problema");
  const cause = extractField(description, "Causa");
  const solution = extractField(description, "Solución");

  return {
    ticketNumber: ticket?.ticketNumber || '',
    problem: problem || ticket?.description || '',
    cause: cause || 'No especificada',
    solution: solution || description || 'Solución aplicada',
  };
};

function TicketDetailTech() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceName, setServiceName] = useState('');
  const [damageName, setDamageName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateAttempt, setEscalateAttempt] = useState('');
  const [knowledgeFormOpen, setKnowledgeFormOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [existingArticle, setExistingArticle] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);
  const [loadingRejection, setLoadingRejection] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [solution, setSolution] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [commentError, setCommentError] = useState('');

  const fullName = localStorage.getItem('fullName');
  const userRole = localStorage.getItem('role');
  const isAdmin = userRole === 'Admin';
  const myUserId = parseInt(localStorage.getItem('userId') || '0');

  const handleExportDetail = () => {
    if (!detail) return;
    exportTicketDetailToPDF(detail.ticket, detail.actions, {
      requesterName: requesterName,
      technicianName: technicianName,
      serviceName: serviceName,
      damageName: damageName,
    });
  };

  const load = useCallback(() => {
    setLoading(true);
    ticketAPI.get(`/ticket/${id}/detail`)
      .then((res) => {
        console.log('Detalle del ticket cargado:', res.data);
        console.log('Acciones:', res.data.actions);
        setDetail(res.data);
        const closureAction = res.data.actions?.find(a =>
          a.actionType === 'Closure' || a.actionType === 'Resolution'
        );
        if (closureAction && closureAction.description) {
          setSolution(closureAction.description);
        }
        if (res.data.ticket.serviceCatalogId) {
          catalogAPI.get(`/servicecatalog/${res.data.ticket.serviceCatalogId}`)
            .then((r) => setServiceName(r.data.name)).catch(() => { });
        }
        if (res.data.ticket.damageCatalogId) {
          catalogAPI.get(`/damagecatalog/${res.data.ticket.damageCatalogId}`)
            .then((r) => setDamageName(r.data.name)).catch(() => { });
        }
        if (res.data.ticket.userId) {
          authAPI.get(`/user/${res.data.ticket.userId}`)
            .then((r) => setRequesterName(`${r.data.fullName} (${r.data.role})`))
            .catch(() => { });
        }
        if (res.data.ticket.assignedTechnicianId) {
          authAPI.get(`/user/${res.data.ticket.assignedTechnicianId}`)
            .then((r) => setTechnicianName(`${r.data.fullName} (${r.data.role})`))
            .catch(() => { });
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  const loadRejectionReason = useCallback(async () => {
    if (!id) return;
    setLoadingRejection(true);
    try {
      const response = await ticketAPI.get(`/ticket/${id}/rejection-reason`);
      if (response.data.hasRejection) {
        setRejectionReason(response.data);
      } else {
        setRejectionReason(null);
      }
    } catch (err) {
      console.error('Error cargando motivo de rechazo:', err);
      setRejectionReason(null);
    } finally {
      setLoadingRejection(false);
    }
  }, [id]);

  const handleViewImage = async (att) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast({ type: 'error', title: 'Error', message: 'No hay sesión activa' });
        return;
      }
      const response = await attachmentsAPI.download(att.id);
      const blob = new Blob([response.data], { type: att.fileType });
      const url = URL.createObjectURL(blob);
      setSelectedImage({ ...att, url });
    } catch (err) {
      console.error('Error cargando imagen:', err);
      showToast({ type: 'error', title: 'Error', message: 'No se pudo cargar la imagen' });
    }
  };

  const loadAttachments = useCallback(async () => {
    if (!id) return;
    setLoadingAttachments(true);
    try {
      const response = await attachmentsAPI.getByTicket(id);
      setAttachments(response.data);
    } catch (err) {
      console.error('Error cargando archivos:', err);
    } finally {
      setLoadingAttachments(false);
    }
  }, [id]);

  const handleDownload = async (attachmentId, fileName) => {
    try {
      const response = await attachmentsAPI.download(attachmentId);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando archivo:', err);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    try {
      await attachmentsAPI.delete(attachmentId);
      loadAttachments();
      showToast({ type: 'success', title: 'Eliminado', message: 'Archivo eliminado correctamente' });
    } catch (err) {
      console.error('Error eliminando archivo:', err);
      showToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el archivo' });
    }
  };

  useEffect(() => {
    load();
    loadAttachments();
    loadRejectionReason();
  }, [load, loadAttachments, loadRejectionReason]);

  useEffect(() => {
    let conn;
    (async () => {
      try {
        conn = await getConnection();
        const userId = parseInt(localStorage.getItem('userId') || '0');
        await joinUserGroup(userId);
        await joinTechnicianGroup(userId);
        console.log(`[SignalR] Técnico ${userId} unido a grupos user y tech`);

        conn.on('ticket-updated', () => {
          console.log('Evento ticket-updated recibido en técnico');
          load();
          loadRejectionReason();
          loadAttachments();
        });
        conn.on('ticket-closed', () => {
          console.log('Ticket cerrado, recargando...');
          load();
          loadRejectionReason();
          loadAttachments();
        });
        conn.on('ticket-escalated', load);
        conn.on('ticket-action-added', load);
        conn.on('ticket-attachments-added', () => {
          showToast({
            type: 'info',
            title: 'Nuevas imágenes',
            message: 'Se han agregado nuevas imágenes al ticket'
          });
          loadAttachments();
        });
        conn.on('ticket-attachment-deleted', () => {
          showToast({
            type: 'info',
            title: 'Imagen eliminada',
            message: 'Se ha eliminado una imagen del ticket'
          });
          loadAttachments();
        });
        conn.on('solution-rejected', (data) => {
          showToast({
            type: 'warning',
            title: 'Solución Rechazada',
            message: `El usuario rechazó la solución: ${data.reason}`
          });
          load();
          loadRejectionReason();
        });
      } catch (err) {
        console.error('Error conectando a SignalR:', err);
      }
    })();

    return () => {
      if (conn) {
        conn.off('ticket-updated', load);
        conn.off('ticket-closed', load);
        conn.off('ticket-escalated', load);
        conn.off('ticket-action-added', load);
        conn.off('ticket-attachments-added', loadAttachments);
        conn.off('ticket-attachment-deleted', loadAttachments);
        conn.off('solution-rejected', load);
      }
    };
  }, [id, load, loadAttachments, loadRejectionReason]);

  const handleStartProgress = async () => {
    if (!detail) return;
    try {
      await ticketAPI.patch(`/ticket/${id}/status`, { status: 'En Proceso' });
      showToast({ type: 'success', title: 'Estado actualizado', message: 'Ticket en Proceso' });
      load();
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e?.response?.data?.message || 'Error' });
    }
  };

  const handleResolve = async () => {
    if (!detail) return;
    const t = detail.ticket;
    const isRejectionCase = rejectionReason !== null && t.status === 'En Proceso';

    try {
      const response = await catalogAPI.get(`/knowledge/byticket/${t.id}`);
      if (response.data) {
        setExistingArticle(response.data);
      } else {
        setExistingArticle(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        const resolutionAction = detail.actions?.find(a => a.actionType === 'Resolution');
        if (resolutionAction && resolutionAction.description) {
          const parsed = parseSolutionDescription(resolutionAction.description, t);
          setExistingArticle({
            id: null,
            title: t.title,
            problem: parsed.problem,
            cause: parsed.cause,
            solution: parsed.solution,
            category: t.damageCatalogName || 'Software'
          });
        } else {
          setExistingArticle(null);
        }
      } else {
        setExistingArticle(null);
      }
    }
    setKnowledgeFormOpen(true);
  };

  const doEscalate = async () => {
    if (!escalateReason.trim()) {
      showToast({ type: 'warning', title: 'Requerido', message: 'Indica el motivo del escalamiento.' });
      return;
    }
    if (!escalateAttempt.trim()) {
      showToast({ type: 'warning', title: 'Requerido', message: 'Indica qué se intentó hacer.' });
      return;
    }
    try {
      const fullReason = `Motivo: ${escalateReason.trim()} | Se intentó: ${escalateAttempt.trim()}`;
      await ticketAPI.post(`/ticket/${id}/escalate`, { reason: fullReason });
      setEscalateOpen(false);
      setEscalateReason('');
      setEscalateAttempt('');
      showToast({ type: 'success', title: 'Escalado', message: 'Ticket escalado correctamente.' });
      load();
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e?.response?.data?.message || 'Error escalando ticket' });
    }
  };

  const sendComment = async () => {
    const text = comment.trim();
    if (!text) {
      setCommentError('Escribe un mensaje antes de enviar.');
      return;
    }
    setSending(true);
    setCommentError('');
    try {
      await ticketAPI.post(`/ticket/${id}/actions`, {
        actionType: 'Comment',
        description: text,
      });
      setComment('');
      await load();
      showToast({ type: 'success', title: 'Enviado', message: 'Observación agregada correctamente' });
    } catch (err) {
      setCommentError(err.response?.data?.message || 'No se pudo enviar tu observación.');
    } finally {
      setSending(false);
    }
  };

  const onKnowledgeSaved = async () => {
    setKnowledgeFormOpen(false);
    showToast({
      type: 'success',
      title: 'Solución guardada',
      message: 'La solución ha sido registrada. El usuario recibirá una notificación.'
    });
    load();
  };

  const statusColor = (s) => ({
    'Abierto': '#1565c0', 'En Proceso': '#f57f17',
    'Escalado': '#6a1b9a', 'Resuelto': '#2e7d32',
    'Cerrado': '#424242', 'Vencido': '#b71c1c',
  }[s] || '#333');

  const getActionIcon = (type) => {
    switch (type) {
      case 'Created': return <Plus size={14} color="#22c55e" />;
      case 'Accepted': return <Check size={14} color="#3b82f6" />;
      case 'StatusChange': return <RefreshCw size={14} color="#f59e0b" />;
      case 'Comment': return <MessageCircle size={14} color="#8b5cf6" />;
      case 'Escalated': return <ArrowUp size={14} color="#ef4444" />;
      case 'Resolution': return <CheckCircle size={14} color="#10b981" />;
      case 'Closure': return <Lock size={14} color="#6b7280" />;
      default: return <Info size={14} color="#6b7280" />;
    }
  };

  const actionLabel = (type) => ({
    'Created': 'Ticket creado', 'Accepted': 'Aceptado por técnico',
    'StatusChange': 'Cambio de estado', 'Comment': 'Observación',
    'Escalated': 'Escalamiento', 'Resolution': 'Solución registrada', 'Closure': 'Ticket cerrado',
  }[type] || type);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !detail) {
    return <Layout>
      <div className="tech-detail-loading">
        <RefreshCw size={32} className="tech-detail-spinner" />
        <p>Cargando ticket...</p>
      </div>
    </Layout>;
  }

  const t = detail.ticket;

  const isAssignedToMe = t.assignedTechnicianId === myUserId;
  const isEscalated = t.status === 'Escalado';
  const isClosed = t.status === 'Cerrado';
  const isResolved = t.status === 'Resuelto';
  const isInProgress = t.status === 'En Proceso';
  const isOpen = t.status === 'Abierto';

  const canWorkOnTicket = isAssignedToMe && !isEscalated && !isClosed;
  const showStartProgress = isOpen && canWorkOnTicket && !rejectionReason;
  const canEscalate = canWorkOnTicket && !isResolved && !isClosed && t.currentLevel < 4;
  const canResolve = canWorkOnTicket && (isInProgress || isOpen) && !rejectionReason;
  const canEditSolution = isResolved && isAssignedToMe && !rejectionReason;

  return (
    <Layout>
      <div className="tech-detail-page">
        <div className="tech-detail-header-bar">
          <button className="tech-detail-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>

        <div className="tech-detail-card">
          {rejectionReason && (t.status === 'En Proceso' || t.status === 'Abierto') && (
            <div className="tech-detail-rejection-alert">
              <div className="tech-detail-rejection-header">
                <AlertCircle size={18} color="#dc2626" />
                <strong>SOLUCIÓN RECHAZADA POR EL USUARIO</strong>
              </div>
              <div className="tech-detail-rejection-body">
                <label className="tech-detail-rejection-label">Motivo del rechazo:</label>
                <p className="tech-detail-rejection-text">"{rejectionReason.reason}"</p>
                {rejectionReason.rejectedAt && (
                  <div className="tech-detail-rejection-date">
                    <Calendar size={12} />
                    <span>Rechazado el {formatDate(rejectionReason.rejectedAt)}</span>
                  </div>
                )}
                {rejectionReason.rejectedBy && (
                  <div className="tech-detail-rejection-date">
                    <User size={12} />
                    <span>Rechazado por: {rejectionReason.rejectedBy}</span>
                  </div>
                )}
              </div>
              <div className="tech-detail-rejection-footer">
                Por favor, registra una nueva solución o escala el ticket teniendo en cuenta este feedback
              </div>
            </div>
          )}

          <div className="tech-detail-ticket-header">
            <div>
              <div className="tech-detail-ticket-number">
                <Tag size={14} />
                {t.ticketNumber}
              </div>
              <h1 className="tech-detail-title">{t.title}</h1>
            </div>
            <div className="tech-detail-badges-container">
              <span className="tech-detail-badge" style={{ backgroundColor: statusColor(t.status) }}>
                {t.status}
              </span>
              <span className="tech-detail-badge tech-detail-priority-badge">
                {getPriorityIcon(t.priority)}
                <span>{t.priority}</span>
              </span>
            </div>
          </div>

          <div className="tech-detail-status-message">
            <Info size={16} />
            <span>{statusMessage(t.status)}</span>
          </div>

          <div className="tech-detail-info-grid">
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><User size={14} /> Solicitante</span>
              <span className="tech-detail-info-value">{requesterName || `ID: ${t.userId}`}</span>
            </div>
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><Briefcase size={14} /> Servicio</span>
              <span className="tech-detail-info-value">{serviceName || '—'}</span>
            </div>
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><Wrench size={14} /> Tipo de daño</span>
              <span className="tech-detail-info-value">{damageName || '—'}</span>
            </div>
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><MapPin size={14} /> Ubicación</span>
              <span className="tech-detail-info-value">{t.location || '—'}</span>
            </div>
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><Hash size={14} /> Equipo/Activo</span>
              <span className="tech-detail-info-value">{t.assetCode || '—'}</span>
            </div>
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><Building2 size={14} /> Nivel actual</span>
              <span className="tech-detail-info-value">{t.levelName}</span>
            </div>
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><User size={14} /> Técnico asignado</span>
              <span className="tech-detail-info-value">{t.assignedTechnicianId ? (technicianName || `ID: ${t.assignedTechnicianId}`) : 'Sin asignar'}</span>
            </div>
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><Calendar size={14} /> Creado</span>
              <span className="tech-detail-info-value">{formatDate(t.createdAt)}</span>
            </div>
            <div className="tech-detail-info-item">
              <span className="tech-detail-info-label"><RefreshCw size={14} /> Actualizado</span>
              <span className="tech-detail-info-value">{formatDate(t.updatedAt)}</span>
            </div>
          </div>

          <div className="tech-detail-divider" />

          <div className="tech-detail-desc-section">
            <h3 className="tech-detail-section-title">
              <FileText size={16} />
              Descripción del problema
            </h3>
            <p className="tech-detail-description">{t.description}</p>
          </div>

          {!loadingAttachments && attachments.length > 0 && (
            <div className="tech-detail-images-section">
              <h3 className="tech-detail-section-title">
                <Image size={16} />
                Adjuntos ({attachments.length})
              </h3>
              <div className="tech-detail-images-grid">
                {attachments.map((att) => (
                  <div key={att.id} className="tech-detail-image-item">
                    <div className="tech-detail-image-icon" onClick={() => handleViewImage(att)}>
                      <FileImage size={32} color="#4361ee" />
                    </div>
                    <div className="tech-detail-image-info">
                      <span className="tech-detail-image-name">{att.fileName.substring(0, 15)}...</span>
                      <span className="tech-detail-image-size">{(att.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <button className="tech-detail-download-btn" onClick={() => handleDownload(att.id, att.fileName)} title="Descargar">
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEscalated && !isAssignedToMe && (
            <div className="tech-detail-escalated-message">
              <ArrowUp size={16} />
              <span>
                <strong>Ticket escalado al nivel superior.</strong><br />
                Un técnico del siguiente nivel se encargará de la solución.
                No puedes realizar más acciones en este ticket.
              </span>
            </div>
          )}

          {isEscalated && isAssignedToMe && (
            <div className="tech-detail-escalated-message-warning">
              <ArrowUp size={16} />
              <span>
                <strong>Ticket escalado.</strong><br />
                El ticket ha sido escalado al nivel superior. Ya no puedes realizar acciones.
              </span>
            </div>
          )}

          <div className="tech-detail-action-buttons">
            <button className="tech-detail-history-btn" onClick={() => setShowHistoryModal(true)}>
              <History size={16} />
              Ver historial
            </button>

            <button className="tech-detail-export-btn" onClick={handleExportDetail}>
              <Download size={16} />
              Exportar (PDF)
            </button>

            {showStartProgress && !rejectionReason && (
              <button className="tech-detail-progress-btn" onClick={handleStartProgress}>
                <Settings size={16} />
                Iniciar / En Proceso
              </button>
            )}

            {canEscalate && (
              <button className="tech-detail-escalate-btn" onClick={() => setEscalateOpen(true)}>
                <ArrowUp size={16} />
                Escalar
              </button>
            )}

            {rejectionReason && t.status === 'En Proceso' && (
              <button className="tech-detail-resolve-btn" onClick={handleResolve}>
                <CheckCircle size={16} />
                Registrar Nueva Solución
              </button>
            )}

            {canResolve && !rejectionReason && (
              <button className="tech-detail-resolve-btn" onClick={handleResolve}>
                <CheckCircle size={16} />
                Marcar como Resuelto
              </button>
            )}

            {canEditSolution && !rejectionReason && (
              <button className="tech-detail-edit-solution-btn" onClick={handleResolve}>
                <Eye size={16} />
                Ver solución registrada
              </button>
            )}
          </div>

          {t.status === 'Cerrado' && (
            <div className="tech-detail-closed-notice">
              <Lock size={14} />
              Este ticket está cerrado. No se pueden realizar más acciones.
            </div>
          )}
          {/* MODAL DEL HISTORIAL */}
          {showHistoryModal && (
            <div className="tech-detail-modal-overlay" onClick={() => setShowHistoryModal(false)}>
              <div className="tech-detail-history-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tech-detail-modal-header">
                  <History size={20} color={COLORS.Primario} />
                  <h3 className="tech-detail-modal-title">Historial del ticket</h3>
                  <button className="tech-detail-modal-close" onClick={() => setShowHistoryModal(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="tech-detail-history-content">
                  {detail?.actions?.length === 0 ? (
                    <p className="tech-detail-empty-history">Aún no hay actividades registradas.</p>
                  ) : (
                    detail?.actions?.map((a) => {
                      const isMine = a.userId === myUserId;
                      return (
                        <div key={a.id} className="tech-detail-history-item">
                          <div className="tech-detail-history-icon">
                            {getActionIcon(a.actionType)}
                          </div>
                          <div className="tech-detail-history-detail">
                            <div className="tech-detail-history-header">
                              <span className="tech-detail-history-type">{actionLabel(a.actionType)}</span>
                              <span className="tech-detail-history-date">{formatDate(a.createdAt)}</span>
                            </div>
                            <p className="tech-detail-history-desc">{a.description}</p>
                            {(a.fromValue || a.toValue) && (
                              <div className="tech-detail-history-change">
                                <span className="tech-detail-from-val">{a.fromValue || '—'}</span>
                                <span>→</span>
                                <span className="tech-detail-to-val">{a.toValue || '—'}</span>
                              </div>
                            )}
                            {a.userFullName && a.userId !== 0 && (
                              <div className="tech-detail-history-user">
                                <User size={12} />
                                <span>{isMine ? 'Tú' : a.userFullName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="tech-detail-modal-footer">
                  <button className="tech-detail-modal-button" onClick={() => setShowHistoryModal(false)}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* MODAL DE IMAGEN */}
          {selectedImage && (
            <div className="tech-detail-modal-overlay" onClick={() => setSelectedImage(null)}>
              <div className="tech-detail-image-modal" onClick={(e) => e.stopPropagation()}>
                <button className="tech-detail-image-modal-close" onClick={() => setSelectedImage(null)}>
                  <X size={20} />
                </button>
                <img
                  src={selectedImage.url}
                  alt={selectedImage.fileName}
                  className="tech-detail-image-modal-content"
                  onError={(e) => {
                    console.error('Error cargando imagen:', e);
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M8 2v20M16 2v20M2 8h20M2 16h20"%3E%3C/path%3E%3C/svg%3E';
                  }}
                />
                <div className="tech-detail-image-modal-info">
                  <span>{selectedImage.fileName}</span>
                  <span>{(selectedImage.fileSize / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>
          )}
          {/* MODAL DE ESCALAMIENTO */}
          {escalateOpen && (
            <div className="tech-detail-modal-overlay" onClick={() => setEscalateOpen(false)}>
              <div className="tech-detail-escalate-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tech-detail-escalate-header">
                  <div className="tech-detail-escalate-header-icon">
                    <ArrowUp size={24} color="#fff" />
                  </div>
                  <div className="tech-detail-escalate-header-text">
                    <h2>Escalar Ticket</h2>
                    <p>El ticket será derivado al siguiente nivel de soporte</p>
                  </div>
                  <button className="tech-detail-escalate-close" onClick={() => setEscalateOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <div className="tech-detail-escalate-body">
                  <div className="tech-detail-escalate-ticket-info">
                    <div className="tech-detail-escalate-ticket-badge">
                      <Ticket size={14} />
                      <span>{t.ticketNumber}</span>
                    </div>
                    <div className="tech-detail-escalate-level-badge">
                      Nivel actual: <strong>{t.levelName}</strong>
                    </div>
                  </div>

                  {/* Campo: Motivo del escalamiento */}
                  <div className="tech-detail-escalate-field">
                    <label>
                      Motivo del escalamiento <span className="required">*</span>
                    </label>
                    <textarea
                      className={`tech-detail-escalate-textarea ${escalateReason && !validateMeaningfulText(escalateReason, 'El motivo').isValid ? 'tech-detail-escalate-textarea-error' : ''}`}
                      placeholder="¿Por qué no puedes resolver este ticket en tu nivel?"
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                      maxLength={500}
                      rows={4}
                    />
                    <div className="tech-detail-escalate-field-footer">
                      <span className="char-count">{escalateReason.length}/500</span>
                      {escalateReason.trim() && (
                        <span className={validateMeaningfulText(escalateReason, 'El motivo').isValid ? 'success-hint' : 'error-hint'}>
                          {validateMeaningfulText(escalateReason, 'El motivo').isValid ? '✓ Válido' : `⚠️ ${validateMeaningfulText(escalateReason, 'El motivo').message}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Campo: ¿Qué se intentó hacer? */}
                  <div className="tech-detail-escalate-field">
                    <label>
                      ¿Qué se intentó hacer? <span className="required">*</span>
                    </label>
                    <textarea
                      className="tech-detail-escalate-textarea"
                      placeholder="Describe los pasos que intentaste para solucionar el problema..."
                      value={escalateAttempt}
                      onChange={(e) => setEscalateAttempt(e.target.value)}
                      maxLength={500}
                      rows={4}
                    />
                    <div className="tech-detail-escalate-field-footer">
                      <span className="char-count">{escalateAttempt.length}/500</span>
                      {escalateAttempt.trim() && escalateAttempt.trim().length > 0 && (
                        <span className="validation-hint">
                          {validateMeaningfulText(escalateAttempt, 'Lo intentado').isValid ?
                            '✓ Válido' :
                            <span className="error-hint">⚠️ {validateMeaningfulText(escalateAttempt, 'Lo intentado').message}</span>
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tech-detail-escalate-footer">
                  <button className="tech-detail-escalate-cancel" onClick={() => setEscalateOpen(false)}>
                    Cancelar
                  </button>
                  <button
                    className="tech-detail-escalate-confirm"
                    onClick={doEscalate}
                    disabled={
                      !escalateReason.trim() ||
                      !validateMeaningfulText(escalateReason, 'El motivo').isValid ||
                      !escalateAttempt.trim() ||
                      !validateMeaningfulText(escalateAttempt, 'Lo intentado').isValid
                    }
                  >
                    <ArrowUp size={14} />
                    Confirmar Escalamiento
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* MODAL DE REGISTRO DE SOLUCIÓN - KnowledgeForm */}
          {knowledgeFormOpen && (
            <KnowledgeForm
              ticket={t}
              fullName={fullName}
              onClose={() => {
                setKnowledgeFormOpen(false);
                setExistingArticle(null);
              }}
              onSaved={onKnowledgeSaved}
              existingArticle={existingArticle}
              readOnly={t.status === 'Resuelto'}
            />
          )}
        </div>
      </div>

      {/* Estilos CSS */}
      <style>{`
        .tech-detail-page {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
          min-height: 100vh;
          background-color: #f5f7fa;
        }

        .tech-detail-escalate-textarea-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }

        .tech-detail-header-bar {
          margin-bottom: 20px;
        }

        .tech-detail-back-btn {
          background: none;
          border: none;
          color: #4361ee;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0;
        }

        .tech-detail-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e4e7eb;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .tech-detail-ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .tech-detail-ticket-number {
          font-size: 12px;
          font-weight: 700;
          color: #4361ee;
          background: #eef2ff;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .tech-detail-title {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }

        .tech-detail-badges-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tech-detail-badge {
          color: #fff;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .tech-detail-status-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #f0fdf4;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #166534;
        }

        .tech-detail-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px 24px;
          margin-bottom: 24px;
        }

        .tech-detail-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f2f5;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tech-detail-info-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .tech-detail-info-value {
          font-size: 13px;
          font-weight: 500;
          color: #1a1a2e;
        }

        .tech-detail-divider {
          height: 1px;
          background: #f0f2f5;
          margin: 16px 0;
        }

        .tech-detail-desc-section {
          margin-bottom: 24px;
        }

        .tech-detail-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tech-detail-description {
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
        }

        .tech-detail-images-section {
          margin-bottom: 24px;
        }

        .tech-detail-images-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .tech-detail-image-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 10px;
          border: 1px solid #eef2f6;
          flex: 1;
          min-width: 180px;
        }

        .tech-detail-image-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .tech-detail-image-info {
          flex: 1;
        }

        .tech-detail-image-name {
          font-size: 11px;
          color: #374151;
          display: block;
        }

        .tech-detail-image-size {
          font-size: 9px;
          color: #8a9bb5;
        }

        .tech-detail-download-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: #4361ee;
          border-radius: 6px;
        }

        .tech-detail-escalated-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fef3c7;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .tech-detail-escalated-message-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fef3c7;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #92400e;
        }

        .tech-detail-action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .tech-detail-history-btn,
        .tech-detail-export-btn,
        .tech-detail-progress-btn,
        .tech-detail-escalate-btn,
        .tech-detail-resolve-btn,
        .tech-detail-edit-solution-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .tech-detail-history-btn {
          background: #fff;
          border: 1px solid #d0d5dd;
          color: #374151;
        }

        .tech-detail-export-btn {
          background: #fff;
          border: 1px solid #8b5cf6;
          color: #8b5cf6;
        }

        .tech-detail-progress-btn {
          background: #4361ee;
          color: #fff;
        }

        .tech-detail-escalate-btn {
          background: #f59e0b;
          color: #fff;
        }

        .tech-detail-resolve-btn {
          background: #10b981;
          color: #fff;
        }

        .tech-detail-edit-solution-btn {
          background: #0f766e;
          color: #fff;
        }

        .tech-detail-closed-notice {
          margin-top: 16px;
          padding: 12px 16px;
          background: #f3f4f6;
          border-radius: 10px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .tech-detail-rejection-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .tech-detail-rejection-header {
          background: #fee2e2;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #fecaca;
        }

        .tech-detail-rejection-body {
          padding: 16px;
        }

        .tech-detail-rejection-label {
          font-size: 11px;
          font-weight: 600;
          color: #7f1d1d;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }

        .tech-detail-rejection-text {
          font-size: 14px;
          color: #1f2937;
          margin: 0;
          padding: 10px 14px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #fecaca;
          line-height: 1.5;
          font-style: italic;
        }

        .tech-detail-rejection-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #991b1b;
          margin-top: 10px;
        }

        .tech-detail-rejection-footer {
          background: #fef2f2;
          padding: 10px 16px;
          font-size: 12px;
          color: #991b1b;
          border-top: 1px solid #fecaca;
        }

        .tech-detail-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          gap: 16px;
        }

        .tech-detail-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

                /* Modal de historial */
        .tech-detail-modal-overlay {
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

        .tech-detail-history-modal {
          background: #fff;
          border-radius: 20px;
          width: 600px;
          max-width: 90%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .tech-detail-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid #e4e7eb;
          background: #f9fafb;
        }

        .tech-detail-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
          flex: 1;
        }

        .tech-detail-modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 6px;
        }

        .tech-detail-history-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        .tech-detail-history-item {
          display: flex;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f2f5;
        }

        .tech-detail-history-icon {
          width: 32px;
          height: 32px;
          border-radius: 16px;
          background: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tech-detail-history-detail {
          flex: 1;
        }

        .tech-detail-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 6px;
        }

        .tech-detail-history-type {
          font-size: 12px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .tech-detail-history-date {
          font-size: 10px;
          color: #8a9bb5;
        }

        .tech-detail-history-desc {
          font-size: 13px;
          color: #4b5563;
          margin: 0 0 6px 0;
          line-height: 1.5;
        }

        .tech-detail-history-change {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 6px;
          margin-bottom: 6px;
        }

        .tech-detail-from-val {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .tech-detail-to-val {
          font-weight: 600;
          color: #1a1a2e;
        }

        .tech-detail-history-user {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #8a9bb5;
        }

        .tech-detail-empty-history {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
          font-size: 13px;
        }

        .tech-detail-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e4e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .tech-detail-modal-button {
          background: #2d6a9f;
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .tech-detail-history-modal {
            width: 95%;
          }
        }

        /* Modal de escalamiento mejorado */
        .tech-detail-escalate-modal {
          background: #fff;
          border-radius: 24px;
          width: 550px;
          max-width: 90%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

                .tech-detail-escalate-field-footer .validation-hint {
          font-size: 11px;
        }

        .tech-detail-escalate-field-footer .error-hint {
          color: #ef4444;
        }

        .tech-detail-escalate-field-footer .success-hint {
          color: #10b981;
        }

        .tech-detail-escalate-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
          position: sticky;
          top: 0;
        }

        .tech-detail-escalate-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tech-detail-escalate-header-text {
          flex: 1;
        }

        .tech-detail-escalate-header-text h2 {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .tech-detail-escalate-header-text p {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          margin-top: 4px;
        }

        .tech-detail-escalate-close {
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
          transition: all 0.2s;
        }

        .tech-detail-escalate-close:hover {
          background: rgba(255,255,255,0.3);
        }

        .tech-detail-escalate-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .tech-detail-escalate-ticket-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: #fef3c7;
          border-radius: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .tech-detail-escalate-ticket-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #92400e;
        }

        .tech-detail-escalate-level-badge {
          font-size: 12px;
          color: #92400e;
        }

        .tech-detail-escalate-field {
          margin-bottom: 24px;
        }

        .tech-detail-escalate-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .tech-detail-escalate-field .required {
          color: #ef4444;
          margin-left: 4px;
        }

        .tech-detail-escalate-textarea {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .tech-detail-escalate-textarea:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .tech-detail-escalate-field-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          font-size: 11px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tech-detail-escalate-field-footer .char-count {
          color: #9ca3af;
        }

        .tech-detail-escalate-field-footer .error-hint {
          color: #ef4444;
        }

        .tech-detail-escalate-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e4e7eb;
          background: #f9fafb;
          position: sticky;
          bottom: 0;
        }

        .tech-detail-escalate-cancel {
          padding: 10px 20px;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tech-detail-escalate-cancel:hover {
          background: #f3f4f6;
        }

        .tech-detail-escalate-confirm {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: #f59e0b;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tech-detail-escalate-confirm:hover:not(:disabled) {
          background: #d97706;
          transform: translateY(-1px);
        }

        .tech-detail-escalate-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .tech-detail-escalate-modal {
            width: 95%;
          }

          .tech-detail-escalate-header {
            padding: 16px 20px;
          }

          .tech-detail-escalate-header-icon {
            width: 40px;
            height: 40px;
          }

          .tech-detail-escalate-header-text h2 {
            font-size: 16px;
          }

          .tech-detail-escalate-body {
            padding: 20px;
          }

          .tech-detail-escalate-ticket-info {
            flex-direction: column;
            align-items: flex-start;
          }

          .tech-detail-escalate-footer {
            flex-direction: column;
          }

          .tech-detail-escalate-cancel,
          .tech-detail-escalate-confirm {
            width: 100%;
            justify-content: center;
          }
        }

        /* Modal de imagen */
        .tech-detail-image-modal {
          background: #fff;
          border-radius: 16px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .tech-detail-image-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0,0,0,0.5);
          border: none;
          border-radius: 20px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          z-index: 10;
        }

        .tech-detail-image-modal-content {
          max-width: 90vw;
          max-height: 85vh;
          object-fit: contain;
          display: block;
        }

        .tech-detail-image-modal-info {
          padding: 12px 16px;
          border-top: 1px solid #e4e7eb;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .tech-detail-page {
            padding: 70px 12px 20px 12px;
          }

          .tech-detail-card {
            padding: 20px;
          }

          .tech-detail-title {
            font-size: 18px;
          }

          .tech-detail-info-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .tech-detail-info-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .tech-detail-images-grid {
            flex-direction: column;
          }

          .tech-detail-image-item {
            min-width: auto;
          }
        }
      `}</style>
    </Layout>
  );
}

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'Baja': return <CheckCircle size={14} />;
    case 'Media': return <Clock size={14} />;
    case 'Alta': return <TrendingUp size={14} />;
    case 'Crítica': return <Flame size={14} />;
    default: return null;
  }
};

const statusMessage = (status) => {
  switch (status) {
    case 'Abierto': return 'Pendiente de asignación';
    case 'En Proceso': return 'En revisión por técnico';
    case 'Escalado': return 'Escalado a nivel superior';
    case 'Resuelto': return 'Solución aplicada. Esperando confirmación del usuario.';
    case 'Cerrado': return 'Ticket cerrado';
    case 'Vencido': return 'Tiempo de atención superado';
    default: return '';
  }
};

export default TicketDetailTech;