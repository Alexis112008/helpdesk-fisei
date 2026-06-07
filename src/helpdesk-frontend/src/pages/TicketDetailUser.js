import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  Lock,
  FileText,
  Info,
  Eye,
  Check,
  X,
  Plus,
  User,
  Tag,
  Image,
  Download,
  FileImage,
  History,
  Ticket,
  ThumbsUp,
  ChevronRight,
  Upload,
  Trash2,
  Search,
  Settings,
  ClipboardList
} from 'lucide-react';
import Layout from '../components/Layout';
import { ticketAPI, catalogAPI, authAPI } from '../services/api';
import { attachmentsAPI } from '../services/api';
import { getConnection, joinUserGroup } from '../services/realtime';
import { useNotifications } from '../components/NotificationProvider';
import { exportTicketDetailToPDF } from '../services/exportService';

// Colores unificados con el Dashboard
const COLORS = {
  Primario: '#2d6a9f',
  PrimarioOscuro: '#1e3a5f',
  PrimarioLight: '#eef2ff',
  Exito: '#10b981',
  Advertencia: '#f59e0b',
  Error: '#ef4444',
  Info: '#3b82f6',
  Texto: '#1a1a2e',
  TextoSecundario: '#6b7280',
  Borde: '#e4e7eb',
  Fondo: '#f5f7fa',
  Blanco: '#fff',
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

/**
 * Detalle de ticket — VISTA USUARIO SOLICITANTE
 */
function TicketDetailUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useNotifications();
  const myUserId = parseInt(localStorage.getItem('userId') || '0');

  const from = location.state?.from || '/tickets';

  const [ticket, setTicket] = useState(null);
  const [actions, setActions] = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [damageName, setDamageName] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const [solution, setSolution] = useState('');
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Estados para imágenes adjuntas
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Estados para la solución detallada
  const [solutionData, setSolutionData] = useState(null);
  const [solutionImages, setSolutionImages] = useState([]);
  const [showSolutionDetails, setShowSolutionDetails] = useState(false);

  // Estados para subir más imágenes
  const [uploadingNew, setUploadingNew] = useState(false);

  // Estados para el modal de rechazo
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [hasMultipleSolutions, setHasMultipleSolutions] = useState(false);
  const [solutionsCount, setSolutionsCount] = useState(0);

  // Exportar detalle del ticket a PDF
  const handleExportDetail = () => {
    if (!ticket) return;
    exportTicketDetailToPDF(ticket, actions, {
      requesterName: ticket.userId?.toString(),
      technicianName: technicianName,
      serviceName: serviceName,
      damageName: damageName,
    });
  };

  const canDeleteAttachment = (attachmentUserId) => {
    // Si el ticket está cerrado, nadie puede eliminar imágenes
    if (ticket?.status === 'Cerrado') return false;
    // Solo el dueño de la imagen puede eliminar cuando el ticket NO está cerrado
    return attachmentUserId === myUserId;
  };

  // En TicketDetailUser.js, en la carga de la solución
  const loadSolution = useCallback(async () => {
    if (!id) return;
    try {
      // Obtener el detalle completo
      const response = await ticketAPI.get(`/ticket/${id}/detail`);
      const actions = response.data.actions || [];

      // Buscar TODAS las acciones de tipo Resolution
      const resolutionActions = actions
        .filter(a => a.actionType === 'Resolution')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); //  Más reciente primero

      if (resolutionActions.length > 0) {
        const latestSolution = resolutionActions[0]; //  La más reciente
        const parsed = parseSolutionDescription(latestSolution.description, response.data.ticket);
        setSolutionData(parsed);

        // Si hay más de una solución, mostrar indicador
        if (resolutionActions.length > 1) {
          setHasMultipleSolutions(true);
          setSolutionsCount(resolutionActions.length);
        }
      } else {
        setSolutionData(null);
      }
    } catch (err) {
      console.error('Error cargando solución:', err);
    }
  }, [id]);

  const load = useCallback(async () => {
    try {
      const res = await ticketAPI.get(`/ticket/${id}/detail`);
      setTicket(res.data.ticket);
      const acts = res.data.actions || [];
      setActions(acts);

      const closureAction = acts.find(a =>
        a.actionType === 'Closure' || a.actionType === 'Resolution'
      );
      if (closureAction && closureAction.description) {
        setSolution(closureAction.description);
      }

      // ✅ CORREGIDO: No pasar parámetros
      await loadSolution();  //  Así, sin parámetros

      if (res.data.ticket.serviceCatalogId) {
        try {
          const svc = await catalogAPI.get(`/servicecatalog/${res.data.ticket.serviceCatalogId}`);
          setServiceName(svc.data.name);
        } catch { }
      }
      if (res.data.ticket.damageCatalogId) {
        try {
          const dmg = await catalogAPI.get(`/damagecatalog/${res.data.ticket.damageCatalogId}`);
          setDamageName(dmg.data.name);
        } catch { }
      }
      if (res.data.ticket.assignedTechnicianId) {
        try {
          const userRes = await authAPI.get(`/user/${res.data.ticket.assignedTechnicianId}`);
          setTechnicianName(userRes.data.fullName);
        } catch { }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el ticket.');
    } finally {
      setLoading(false);
    }
  }, [id, loadSolution]);

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

  // Modifica handleViewImage para que pueda recibir un parámetro que indique si es de solución
  const handleViewImage = async (img, isSolutionImage = false) => {
    try {
      let response;
      if (isSolutionImage) {
        response = await catalogAPI.downloadSolutionAttachment(img.id);
      } else {
        response = await attachmentsAPI.download(img.id);
      }
      const blob = new Blob([response.data], { type: img.fileType });
      const url = URL.createObjectURL(blob);
      setSelectedImage({ ...img, url });
    } catch (err) {
      console.error('Error cargando imagen:', err);
    }
  };

  const handleUploadMoreImages = async (e) => {
    const files = Array.from(e.target.files);

    if (attachments.length + files.length > 5) {
      showToast({
        type: 'error',
        title: 'Límite excedido',
        message: `Máximo 5 archivos. Actualmente tienes ${attachments.length}`
      });
      e.target.value = '';
      return;
    }

    setUploadingNew(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      await ticketAPI.post(`/ticket/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadAttachments();
      showToast({
        type: 'success',
        title: 'Imágenes subidas',
        message: `${files.length} archivo(s) agregado(s) correctamente`
      });
      e.target.value = '';
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error al subir las imágenes'
      });
    } finally {
      setUploadingNew(false);
    }
  };

  const confirmSolution = async () => {
    if (!window.confirm('¿Confirmas que el problema ha sido solucionado? El ticket se cerrará.')) return;

    setConfirming(true);
    try {
      // 👇 1. Obtener la solución más reciente del historial
      const detailResponse = await ticketAPI.get(`/ticket/${id}/detail`);
      const resolutionActions = detailResponse.data.actions
        ?.filter(a => a.actionType === 'Resolution')
        ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (!resolutionActions || resolutionActions.length === 0) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'No se encontró ninguna solución registrada'
        });
        return;
      }

      const latestSolution = resolutionActions[0];
      const parsed = parseSolutionDescription(latestSolution.description, detailResponse.data.ticket);

      // 👇 2. Preparar datos del artículo
      const articleData = {
        title: ticket.title,
        problem: parsed.problem,
        cause: parsed.cause,
        solution: parsed.solution,
        category: damageName || 'Software',
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        createdByUserId: ticket.assignedTechnicianId || parseInt(localStorage.getItem('userId')),
        createdByName: technicianName || localStorage.getItem('fullName') || 'Técnico'
      };

      // 👇 3. Buscar si ya existe un artículo para este ticket
      let existingArticle = null;
      try {
        const existing = await catalogAPI.get(`/knowledge/byticket/${ticket.id}`);
        existingArticle = existing.data;
        console.log('📝 Artículo existente encontrado, se actualizará');
      } catch (err) {
        // 404 significa que no existe, está bien
        if (err.response?.status === 404) {
          console.log('📝 No existe artículo previo, se creará uno nuevo');
        } else {
          console.error('Error verificando artículo:', err);
        }
      }

      // 👇 4. Si existe, ACTUALIZAR; si no, CREAR
      if (existingArticle && existingArticle.id) {
        await catalogAPI.put(`/knowledge/${existingArticle.id}`, articleData);
        showToast({
          type: 'success',
          title: 'Solución actualizada',
          message: 'La solución ha sido actualizada en la Base de Conocimiento.'
        });
      } else {
        await catalogAPI.post('/knowledge', articleData);
        showToast({
          type: 'success',
          title: 'Solución guardada',
          message: 'La solución ha sido guardada en la Base de Conocimiento.'
        });
      }

      // 👇 5. Registrar acción de aceptación en el historial
      await ticketAPI.post(`/ticket/${id}/actions`, {
        actionType: 'Acceptance',
        description: 'El usuario aceptó la solución. Ticket cerrado.'
      });

      // 👇 6. Cerrar el ticket
      await ticketAPI.post(`/ticket/${id}/close`);

      showToast({
        type: 'success',
        title: 'Ticket cerrado',
        message: 'Gracias por confirmar la solución'
      });

      await load();
      setTimeout(() => navigate('/tickets'), 1500);
    } catch (err) {
      console.error('Error:', err.response?.data);
      showToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Error al confirmar la solución'
      });
    } finally {
      setConfirming(false);
    }
  };

  const reopenTicket = async () => {
    if (!window.confirm('¿El problema persiste? El ticket volverá a estado "En Proceso" para que el técnico lo revise nuevamente.')) return;

    try {
      // Primero, cambiar el estado del ticket
      await ticketAPI.patch(`/ticket/${id}/status`, { status: 'En Proceso' });

      // Después, registrar la acción (como Comment, no como StatusChange)
      await ticketAPI.post(`/ticket/${id}/actions`, {
        actionType: 'Comment',
        description: 'El usuario informó que el problema persiste. Ticket reabierto.'
      });

      await load();
      showToast({
        type: 'info',
        title: 'Ticket reabierto',
        message: 'El ticket ha sido reabierto. El técnico lo revisará nuevamente.'
      });
    } catch (err) {
      console.error('Error:', err.response?.data);
      showToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Error al reabrir el ticket'
      });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast({
        type: 'error',
        title: 'Motivo requerido',
        message: 'Debes explicar el motivo del rechazo para que el técnico pueda mejorar la solución.'
      });
      return;
    }

    if (rejectReason.trim().length < 10) {
      showToast({
        type: 'error',
        title: 'Explicación muy corta',
        message: 'Por favor, explica con más detalle el motivo (mínimo 10 caracteres).'
      });
      return;
    }

    setRejecting(true);

    try {
      await ticketAPI.post(`/ticket/${id}/reject-solution`, {
        reason: rejectReason.trim()
      });

      showToast({
        type: 'success',
        title: 'Solución rechazada',
        message: 'El técnico ha sido notificado y podrá mejorar la solución.'
      });

      setShowRejectModal(false);
      setRejectReason('');
      await load(); // Recargar los datos del ticket
      await loadAttachments();

    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Error al rechazar la solución'
      });
    } finally {
      setRejecting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    try {
      await attachmentsAPI.delete(attachmentId);
      await loadAttachments();
      showToast({
        type: 'success',
        title: 'Eliminado',
        message: 'Archivo eliminado correctamente'
      });
    } catch (err) {
      console.error('Error eliminando archivo:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el archivo'
      });
    }
  };

  useEffect(() => {
    load();
    loadAttachments();
    loadSolution();
  }, [load, loadAttachments]);

  useEffect(() => {
    let conn;
    (async () => {
      try {
        conn = await getConnection();

        // IMPORTANTE: Unirse al grupo del usuario para recibir notificaciones
        await joinUserGroup(myUserId);
        console.log(`[SignalR] Usuario ${myUserId} unido al grupo user:${myUserId}`);

        conn.on('ticket-updated', () => {
          console.log('Evento ticket-updated recibido');
          load();
          loadAttachments();
          loadSolution();
        });
        conn.on('ticket-resolved', () => {
          console.log('Ticket resuelto');
          load();
        });
        conn.on('ticket-closed', () => {
          console.log('Ticket cerrado');
          load();
        });
        conn.on('ticket-escalated', load);
        conn.on('ticket-action-added', load);
        conn.on('ticket-attachments-added', () => {
          showToast({
            type: 'success',
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
      } catch (err) {
        console.error('Error conectando a SignalR:', err);
      }
    })();

    return () => {
      if (conn) {
        conn.off('ticket-updated', load);
        conn.off('ticket-resolved', load);
        conn.off('ticket-closed', load);
        conn.off('ticket-escalated', load);
        conn.off('ticket-action-added', load);
        conn.off('ticket-attachments-added', loadAttachments);
        conn.off('ticket-attachment-deleted', loadAttachments);
      }
    };
  }, [load, loadAttachments, loadSolution, myUserId]);

  if (loading) {
    return (
      <Layout>
        <div style={s.loadingContainer}>
          <RefreshCw size={32} style={s.spinner} />
          <p>Cargando ticket...</p>
        </div>
      </Layout>
    );
  }

  if (error || !ticket) {
    return (
      <Layout>
        <div style={s.page}>
          <button style={s.backBtn} onClick={() => navigate(from)}>
            <ArrowLeft size={16} style={{ marginRight: 8 }} />
            Volver
          </button>
          <div style={s.errorBox}>
            <AlertCircle size={18} style={{ marginRight: 10 }} />
            {error || 'Ticket no encontrado'}
          </div>
        </div>
      </Layout>
    );
  }

  const statusColor = (st) => ({
    'Abierto': COLORS.Primario,
    'En Proceso': COLORS.Advertencia,
    'Escalado': '#8b5cf6',
    'Resuelto': COLORS.Exito,
    'Cerrado': COLORS.TextoSecundario,
    'Vencido': COLORS.Error,
  }[st] || COLORS.TextoSecundario);

  const priorityColor = (p) => ({
    'Baja': COLORS.Exito,
    'Media': COLORS.Advertencia,
    'Alta': '#f97316',
    'Crítica': COLORS.Error,
  }[p] || COLORS.TextoSecundario);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Baja': return <CheckCircle size={14} />;
      case 'Media': return <Clock size={14} />;
      case 'Alta': return <TrendingUp size={14} />;
      case 'Crítica': return <Flame size={14} />;
      default: return null;
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'Created': return <Plus size={14} color="#22c55e" />;
      case 'Accepted': return <Check size={14} color={COLORS.Primario} />;
      case 'StatusChange': return <RefreshCw size={14} color={COLORS.Advertencia} />;
      case 'Comment': return <MessageCircle size={14} color="#8b5cf6" />;
      case 'Escalated': return <TrendingUp size={14} color={COLORS.Error} />;
      case 'Resolution': return <CheckCircle size={14} color={COLORS.Exito} />;
      case 'Closure': return <Lock size={14} color={COLORS.TextoSecundario} />;
      default: return <Info size={14} color={COLORS.TextoSecundario} />;
    }
  };

  const actionLabel = (type) => ({
    'Created': 'Ticket creado',
    'Accepted': 'Asignado a técnico',
    'StatusChange': 'Cambio de estado',
    'Comment': 'Observación del técnico',
    'Escalated': 'Escalado',
    'Resolution': 'Solución registrada',
    'Closure': 'Ticket cerrado',
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

  const statusMessage = () => {
    switch (ticket.status) {
      case 'Abierto': return 'Pendiente de asignación';
      case 'En Proceso': return 'En revisión por técnico';
      case 'Escalado': return 'Escalado a nivel superior';
      case 'Resuelto': return 'Solución aplicada. Confirma si el problema está solucionado.';
      case 'Cerrado': return 'Ticket cerrado';
      case 'Vencido': return 'Tiempo de atención superado';
      default: return '';
    }
  };

  const cardStyle = {
    background: COLORS.Blanco,
    borderRadius: 20,
    border: `1px solid ${COLORS.Borde}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  };

  return (
    <Layout>
      <div style={s.page}>
        <div style={s.headerBar}>
          <button style={s.backBtn} onClick={() => navigate(from)}>
            <ArrowLeft size={16} style={{ marginRight: 8 }} />
            Volver
          </button>
        </div>

        <div style={{ ...cardStyle, padding: 28 }}>
          <div style={s.ticketHeader}>
            <div>
              <div style={s.ticketNumber}>
                <Tag size={14} style={{ marginRight: 6 }} />
                {ticket.ticketNumber}
              </div>
              <h1 style={s.title}>{ticket.title}</h1>
            </div>
            <div style={s.badgesContainer}>
              <span style={{ ...s.badge, backgroundColor: statusColor(ticket.status), color: '#fff' }}>
                {ticket.status}
              </span>
              <span style={{ ...s.badge, backgroundColor: priorityColor(ticket.priority), color: '#fff' }}>
                {getPriorityIcon(ticket.priority)}
                <span style={{ marginLeft: 4 }}>{ticket.priority}</span>
              </span>
            </div>
          </div>

          <div style={{ ...s.statusMessageBox, backgroundColor: '#f0fdf4', borderRadius: 12, marginBottom: 24 }}>
            <Info size={16} color={COLORS.Exito} />
            <span>{statusMessage()}</span>
          </div>

          <div style={s.infoGrid}>
            <div style={s.infoItem}>
              <span style={s.infoLabel}><Briefcase size={14} /> Servicio</span>
              <span style={s.infoValue}>{serviceName || '—'}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}><Wrench size={14} /> Tipo de daño</span>
              <span style={s.infoValue}>{damageName || '—'}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}><MapPin size={14} /> Ubicación</span>
              <span style={s.infoValue}>{ticket.location || '—'}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}><Hash size={14} /> Equipo/Activo</span>
              <span style={s.infoValue}>{ticket.assetCode || '—'}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}><Building2 size={14} /> Nivel actual</span>
              <span style={s.infoValue}>{ticket.levelName}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}><Calendar size={14} /> Creado</span>
              <span style={s.infoValue}>{formatDate(ticket.createdAt)}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}><RefreshCw size={14} /> Actualizado</span>
              <span style={s.infoValue}>{formatDate(ticket.updatedAt)}</span>
            </div>
          </div>

          <div style={s.divider} />

          <div style={s.descSection}>
            <h3 style={s.sectionTitle}>
              <FileText size={16} color={COLORS.Primario} />
              Descripción del problema
            </h3>
            <p style={s.description}>{ticket.description}</p>
          </div>

          {!loadingAttachments && attachments.length > 0 && (
            <div style={s.imagesSection}>
              <h3 style={s.sectionTitle}>
                <Image size={16} color={COLORS.Primario} />
                Adjuntos ({attachments.length})
              </h3>
              <div style={s.imagesGrid}>
                {attachments.map((att) => (
                  <div key={att.id} style={s.imageItem}>
                    <div style={s.imageIcon} onClick={() => handleViewImage(att)}>
                      <FileImage size={32} color={COLORS.Primario} />
                    </div>
                    <div style={s.imageInfo}>
                      <span style={s.imageName}>{att.fileName.substring(0, 20)}...</span>
                      <span style={s.imageSize}>{(att.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <button style={s.downloadBtn} onClick={() => handleDownload(att.id, att.fileName)} title="Descargar">
                      <Download size={16} />
                    </button>
                    {canDeleteAttachment(att.userId) && (
                      <button style={{ ...s.downloadBtn, color: COLORS.Error }} onClick={() => handleDeleteAttachment(att.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ticket.status !== 'Cerrado' && attachments.length < 5 && (
            <div style={s.uploadMoreSection}>
              <label htmlFor="more-images" style={s.uploadMoreBtn}>
                <Upload size={14} style={{ marginRight: 6 }} />
                Agregar más imágenes ({attachments.length}/5)
              </label>
              <input
                id="more-images"
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleUploadMoreImages}
                disabled={uploadingNew}
              />
              {uploadingNew && <span style={s.uploadingText}>Subiendo...</span>}
            </div>
          )}

          <div style={s.actionButtons}>
            <button style={s.historyBtn} onClick={() => setShowHistoryModal(true)}>
              <History size={16} style={{ marginRight: 8 }} />
              Ver historial del ticket
              <ChevronRight size={14} style={{ marginLeft: 8 }} />
            </button>

            {/* Botón exportar detalle a PDF */}
            <button style={s.exportDetailBtn} onClick={handleExportDetail}>
              <Download size={16} style={{ marginRight: 8 }} />
              Exportar detalle (PDF)
            </button>

            {ticket.status === 'Resuelto' && (
              <div style={s.resolvedSection}>
                <button style={s.viewSolutionBtn} onClick={() => setShowSolutionDetails(true)}>
                  <Eye size={16} style={{ marginRight: 8 }} />
                  Ver solución aplicada
                </button>
                <div style={s.confirmButtons}>
                  <button style={s.confirmYesBtn} onClick={confirmSolution} disabled={confirming}>
                    <ThumbsUp size={16} style={{ marginRight: 8 }} />
                    {confirming ? 'Confirmando...' : 'Sí, está solucionado'}
                  </button>
                  <button style={s.confirmNoBtn} onClick={() => setShowRejectModal(true)}>
                    <AlertCircle size={16} style={{ marginRight: 8 }} />
                    No, persiste el problema
                  </button>
                </div>
              </div>
            )}

            {(ticket.status === 'Cerrado') && solutionData && (
              <button style={s.solutionBtn} onClick={() => setShowSolutionDetails(true)}>
                <Eye size={16} style={{ marginRight: 8 }} />
                Ver solución aplicada
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DEL HISTORIAL */}
      {showHistoryModal && (
        <div style={s.modalOverlay} onClick={() => setShowHistoryModal(false)}>
          <div style={{ ...cardStyle, width: 600, maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={s.modalHeader}>
              <History size={20} color={COLORS.Primario} />
              <h3 style={s.modalTitle}>Historial del ticket</h3>
              <button style={s.modalClose} onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={s.historyContent}>
              {actions.length === 0 ? (
                <p style={s.emptyHistory}>Aún no hay actividades registradas.</p>
              ) : (
                actions.map((a) => {
                  const isMine = a.userId === myUserId;
                  return (
                    <div key={a.id} style={s.historyItem}>
                      <div style={s.historyIcon}>
                        {getActionIcon(a.actionType)}
                      </div>
                      <div style={s.historyDetail}>
                        <div style={s.historyHeader}>
                          <span style={s.historyType}>{actionLabel(a.actionType)}</span>
                          <span style={s.historyDate}>{formatDate(a.createdAt)}</span>
                        </div>
                        <p style={s.historyDesc}>{a.description}</p>
                        {(a.fromValue || a.toValue) && (
                          <div style={s.historyChange}>
                            <span style={s.fromVal}>{a.fromValue || '—'}</span>
                            <span>→</span>
                            <span style={s.toVal}>{a.toValue || '—'}</span>
                          </div>
                        )}
                        {a.userFullName && a.userId !== 0 && (
                          <div style={s.historyUser}>
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
            <div style={s.modalFooter}>
              <button style={s.modalButton} onClick={() => setShowHistoryModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SOLUCIÓN DETALLADA MEJORADO */}
      {showSolutionDetails && solutionData && (
        <div style={s.modalOverlay} onClick={() => setShowSolutionDetails(false)}>
          <div style={{ ...cardStyle, width: 650, maxWidth: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={s.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${COLORS.Exito}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CheckCircle size={22} color={COLORS.Exito} />
                </div>
                <div>
                  <h3 style={s.modalTitle}>Solución aplicada</h3>
                  <p style={{ fontSize: 12, color: COLORS.TextoSecundario, margin: 0 }}>
                    Ticket #{solutionData.ticketNumber}
                  </p>
                </div>
              </div>
              <button style={s.modalClose} onClick={() => setShowSolutionDetails(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Problema y síntomas */}
              <div style={detailCardStyle}>
                <div style={detailCardHeader(COLORS.Primario)}>
                  <div style={detailCardIcon(COLORS.Primario)}>
                    <AlertCircle size={18} color={COLORS.Primario} />
                  </div>
                  <span style={detailCardTitle}>Problema y síntomas</span>
                </div>
                <p style={detailCardText}>{solutionData.problem}</p>
              </div>

              {/* Causa raíz */}
              <div style={detailCardStyle}>
                <div style={detailCardHeader(COLORS.Advertencia)}>
                  <div style={detailCardIcon(COLORS.Advertencia)}>
                    <Settings size={18} color={COLORS.Advertencia} />
                  </div>
                  <span style={detailCardTitle}>Causa raíz</span>
                </div>
                <p style={detailCardText}>{solutionData.cause}</p>
              </div>

              {/* Solución aplicada */}
              <div style={{ ...detailCardStyle, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div style={detailCardHeader(COLORS.Exito)}>
                  <div style={detailCardIcon(COLORS.Exito)}>
                    <CheckCircle size={18} color={COLORS.Exito} />
                  </div>
                  <span style={detailCardTitle}>Solución aplicada</span>
                </div>
                <p style={detailCardText}>{solutionData.solution}</p>
              </div>

              {/* Imágenes de la solución */}
              {solutionImages && solutionImages.length > 0 && (
                <div style={detailCardStyle}>
                  <div style={detailCardHeader(COLORS.Primario)}>
                    <div style={detailCardIcon(COLORS.Primario)}>
                      <Image size={18} color={COLORS.Primario} />
                    </div>
                    <span style={detailCardTitle}>Evidencias ({solutionImages.length})</span>
                  </div>
                  <div style={s.solutionImagesGrid}>
                    {solutionImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Evidencia ${idx + 1}`}
                        style={s.solutionImage}
                        onClick={() => setSelectedImage(img)}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23999"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M8 2v20M16 2v20M2 8h20M2 16h20"%3E%3C/path%3E%3C/svg%3E';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button style={s.modalButton} onClick={() => setShowSolutionDetails(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SOLUCIÓN SIMPLE */}
      {showSolutionModal && (
        <div style={s.modalOverlay} onClick={() => setShowSolutionModal(false)}>
          <div style={{ ...cardStyle, width: 480, maxWidth: '90%' }}>
            <div style={s.modalHeader}>
              <CheckCircle size={20} color={COLORS.Exito} />
              <h3 style={s.modalTitle}>Solución aplicada</h3>
              <button style={s.modalClose} onClick={() => setShowSolutionModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={s.solutionContent}>
              <p>{solution}</p>
            </div>
            <div style={s.modalFooter}>
              <button style={s.modalButton} onClick={() => setShowSolutionModal(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMAGEN */}
      {selectedImage && (
        <div style={s.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div style={s.imageModal}>
            <button style={s.imageModalClose} onClick={() => setSelectedImage(null)}>
              <X size={20} />
            </button>
            <img src={selectedImage.url} alt={selectedImage.fileName} style={s.imageModalContent} />
            <div style={s.imageModalInfo}>
              <span>{selectedImage.fileName}</span>
              <span>{(selectedImage.fileSize / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECHAZO CON MOTIVO */}
      {showRejectModal && (
        <div style={s.modalOverlay} onClick={() => setShowRejectModal(false)}>
          <div style={s.rejectModal}>
            <div style={s.modalHeader}>
              <AlertCircle size={20} color={COLORS.Error} />
              <h3 style={s.modalTitle}>Rechazar solución</h3>
              <button style={s.modalClose} onClick={() => setShowRejectModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={s.rejectModalBody}>
              <p style={s.rejectModalDescription}>
                ¿Por qué no quedaste satisfecho con la solución? Tu feedback ayudará al técnico a mejorar.
              </p>

              <label style={s.rejectLabel}>Motivo del rechazo *</label>
              <textarea
                style={s.rejectTextarea}
                placeholder="Ejemplo: La impresora sigue sin imprimir, aparece un error 'fuera de línea' después de reiniciar el equipo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
                autoFocus
              />

            </div>

            <div style={s.modalFooter}>
              <button
                style={s.rejectCancelBtn}
                onClick={() => setShowRejectModal(false)}
                disabled={rejecting}
              >
                Cancelar
              </button>
              <button
                style={s.rejectConfirmBtn}
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
              >
                {rejecting ? 'Rechazando...' : 'Rechazar solución'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// Estilos para tarjetas internas del modal de solución
const detailCardStyle = {
  background: '#fff',
  borderRadius: 16,
  border: `1px solid ${COLORS.Borde}`,
  padding: '16px 20px',
  marginBottom: 20,
  transition: 'all 0.2s ease',
};

const detailCardHeader = (color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 12,
  paddingBottom: 10,
  borderBottom: `2px solid ${color}20`,
});

const detailCardIcon = (color) => ({
  width: 32,
  height: 32,
  borderRadius: 10,
  backgroundColor: `${color}15`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const detailCardTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const detailCardText = {
  fontSize: 14,
  color: '#1a1a2e',
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: 'pre-wrap',
};

const s = {
  page: {
    padding: '24px',
    maxWidth: 800,
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: COLORS.Fondo,
  },
  headerBar: { marginBottom: 20 },
  backBtn: { background: 'none', border: 'none', color: COLORS.Primario, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 0 },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  ticketNumber: { fontSize: 12, fontWeight: 700, color: COLORS.Primario, background: COLORS.PrimarioLight, padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 700, color: COLORS.Texto, margin: 0 },
  badgesContainer: { display: 'flex', gap: 8 },
  badge: { color: '#fff', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center' },
  statusMessageBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px', marginBottom: 24 },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.Borde}` },
  infoLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLORS.TextoSecundario },
  infoValue: { fontSize: 13, fontWeight: 500, color: COLORS.Texto },
  divider: { height: 1, background: COLORS.Borde, margin: '16px 0' },
  descSection: { marginBottom: 24 },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: COLORS.Texto, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
  imagesSection: { marginBottom: 24 },
  imagesGrid: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  imageItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 10, border: `1px solid ${COLORS.Borde}` },
  imageIcon: { width: 48, height: 48, borderRadius: 8, background: COLORS.PrimarioLight, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' },
  imageInfo: { flex: 1 },
  imageName: { fontSize: 11, color: '#374151', display: 'block' },
  imageSize: { fontSize: 9, color: '#8a9bb5' },
  downloadBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: COLORS.Primario, borderRadius: 6, transition: 'background-color 0.2s' },
  uploadMoreSection: { marginTop: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 },
  uploadMoreBtn: { display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: COLORS.PrimarioLight, color: COLORS.Primario, border: `1px solid ${COLORS.Primario}40`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  uploadingText: { fontSize: 12, color: COLORS.Primario, fontStyle: 'italic' },
  actionButtons: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, flexDirection: 'column' },
  historyBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: COLORS.Blanco, border: `1px solid ${COLORS.Borde}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' },
  exportDetailBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#fff', border: '1px solid #8b5cf6', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#8b5cf6', cursor: 'pointer', width: '100%' },
  resolvedSection: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' },
  viewSolutionBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#ecfdf5', border: `1px solid ${COLORS.Exito}40`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: COLORS.Exito, cursor: 'pointer', width: '100%' },
  confirmButtons: { display: 'flex', gap: 12, width: '100%' },
  confirmYesBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: COLORS.Exito, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  confirmNoBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: COLORS.Error, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  solutionBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#ecfdf5', border: `1px solid ${COLORS.Exito}40`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: COLORS.Exito, cursor: 'pointer' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: 16 },
  errorBox: { background: '#fef3f2', color: COLORS.Error, padding: 16, borderRadius: 12, fontSize: 14, display: 'flex', alignItems: 'center' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '20px 24px', borderBottom: `1px solid ${COLORS.Borde}`, background: '#f9fafb' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: COLORS.Texto, margin: 0 },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: COLORS.TextoSecundario, padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 },
  historyContent: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  solutionContent: { padding: '24px' },
  solutionImagesGrid: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  solutionImage: { width: 80, height: 80, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: `1px solid ${COLORS.Borde}`, transition: 'transform 0.2s' },
  historyItem: { display: 'flex', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.Borde}` },
  historyIcon: { width: 32, height: 32, borderRadius: 16, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyDetail: { flex: 1 },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  historyType: { fontSize: 12, fontWeight: 700, color: COLORS.Texto },
  historyDate: { fontSize: 10, color: '#8a9bb5' },
  historyDesc: { fontSize: 13, color: '#4b5563', margin: '0 0 6px 0', lineHeight: 1.5 },
  historyChange: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, background: '#f3f4f6', padding: '4px 8px', borderRadius: 6, marginBottom: 6 },
  fromVal: { textDecoration: 'line-through', color: '#9ca3af' },
  toVal: { fontWeight: 600, color: COLORS.Texto },
  historyUser: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8a9bb5' },
  emptyHistory: { textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 },
  modalFooter: { padding: '16px 24px', borderTop: `1px solid ${COLORS.Borde}`, display: 'flex', justifyContent: 'flex-end' },
  modalButton: { background: COLORS.Primario, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  imageModal: { background: COLORS.Blanco, borderRadius: 16, maxWidth: '90vw', maxHeight: '90vh', overflow: 'hidden', position: 'relative' },
  imageModalClose: { position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', zIndex: 10 },
  imageModalContent: { maxWidth: '100%', maxHeight: 'calc(90vh - 60px)', objectFit: 'contain', display: 'block' },
  imageModalInfo: { padding: '12px 16px', borderTop: `1px solid ${COLORS.Borde}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.TextoSecundario },
  spinner: { animation: 'spin 1s linear infinite' },

  rejectModal: {
    background: COLORS.Blanco,
    borderRadius: 20,
    width: 500,
    maxWidth: '90%',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  rejectModalBody: { padding: '20px 24px' },
  rejectModalDescription: { fontSize: 14, color: '#4b5563', marginBottom: 20, lineHeight: 1.5 },
  rejectLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  rejectTextarea: {
    width: '100%', padding: '12px', borderRadius: 12, border: `1px solid ${COLORS.Borde}`,
    fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none'
  },
  rejectHint: { fontSize: 12, color: COLORS.TextoSecundario, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', padding: '8px 12px', borderRadius: 8 },
  rejectCancelBtn: { background: COLORS.Blanco, color: '#374151', border: `1px solid ${COLORS.Borde}`, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginRight: 12 },
  rejectConfirmBtn: { background: COLORS.Error, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

// Añadir animación para el spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  button:hover {
    transform: translateY(-1px);
    transition: all 0.2s ease;
  }
  
  .confirm-yes-btn:hover {
    background-color: #0d9488 !important;
  }
  
  .confirm-no-btn:hover {
    background-color: #dc2626 !important;
  }
  
  .view-solution-btn:hover, .solution-btn:hover {
    background-color: #d1fae5 !important;
  }
  
  .history-btn:hover {
    background-color: #f9fafb;
    border-color: ${COLORS.Primario};
  }
  
  .upload-more-btn:hover {
    background-color: ${COLORS.Primario};
    color: #fff;
  }
  
  .download-btn:hover {
    background-color: ${COLORS.PrimarioLight};
  }
  
  .reject-cancel-btn:hover {
    background-color: #f3f4f6;
  }
  
  .reject-confirm-btn:hover {
    background-color: #dc2626;
  }
  
  input:focus, textarea:focus, select:focus {
    border-color: ${COLORS.Primario} !important;
    box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1) !important;
    outline: none !important;
  }
  
  .solution-image:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;
document.head.appendChild(styleSheet);

export default TicketDetailUser;