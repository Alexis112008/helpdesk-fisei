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

  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [solutionData, setSolutionData] = useState(null);
  const [solutionImages, setSolutionImages] = useState([]);
  const [showSolutionDetails, setShowSolutionDetails] = useState(false);

  const [uploadingNew, setUploadingNew] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [hasMultipleSolutions, setHasMultipleSolutions] = useState(false);
  const [solutionsCount, setSolutionsCount] = useState(0);

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
    if (ticket?.status === 'Cerrado') return false;
    return attachmentUserId === myUserId;
  };

  const loadSolution = useCallback(async () => {
    if (!id) return;
    try {
      const response = await ticketAPI.get(`/ticket/${id}/detail`);
      const actionsList = response.data.actions || [];

      const resolutionActions = actionsList
        .filter(a => a.actionType === 'Resolution')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (resolutionActions.length > 0) {
        const latestSolution = resolutionActions[0];
        const parsed = parseSolutionDescription(latestSolution.description, response.data.ticket);
        setSolutionData(parsed);

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

      await loadSolution();

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

  const handleViewImage = async (img) => {
    try {
      const response = await attachmentsAPI.download(img.id);
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

      let existingArticle = null;
      try {
        const existing = await catalogAPI.get(`/knowledge/byticket/${ticket.id}`);
        existingArticle = existing.data;
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error verificando artículo:', err);
        }
      }

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

      await ticketAPI.post(`/ticket/${id}/actions`, {
        actionType: 'Acceptance',
        description: 'El usuario aceptó la solución. Ticket cerrado.'
      });

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
      await ticketAPI.patch(`/ticket/${id}/status`, { status: 'En Proceso' });
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
      await load();
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
  }, [load, loadAttachments, loadSolution]);

  useEffect(() => {
    let conn;
    (async () => {
      try {
        conn = await getConnection();
        await joinUserGroup(myUserId);

        conn.on('ticket-updated', () => {
          load();
          loadAttachments();
          loadSolution();
        });
        conn.on('ticket-resolved', () => {
          load();
        });
        conn.on('ticket-closed', () => {
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
        <div className="ticket-detail-loading">
          <RefreshCw size={32} className="ticket-detail-spinner" />
          <p>Cargando ticket...</p>
        </div>
      </Layout>
    );
  }

  if (error || !ticket) {
    return (
      <Layout>
        <div className="ticket-detail-page">
          <button className="ticket-detail-back-btn" onClick={() => navigate(from)}>
            <ArrowLeft size={16} />
            Volver
          </button>
          <div className="ticket-detail-error-box">
            <AlertCircle size={18} />
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

  return (
    <Layout>
      <div className="ticket-detail-page">
        <div className="ticket-detail-header-bar">
          <button className="ticket-detail-back-btn" onClick={() => navigate(from)}>
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>

        <div className="ticket-detail-card">
          <div className="ticket-detail-ticket-header">
            <div>
              <div className="ticket-detail-ticket-number">
                <Tag size={14} />
                {ticket.ticketNumber}
              </div>
              <h1 className="ticket-detail-title">{ticket.title}</h1>
            </div>
            <div className="ticket-detail-badges-container">
              <span className="ticket-detail-badge" style={{ backgroundColor: statusColor(ticket.status), color: '#fff' }}>
                {ticket.status}
              </span>
              <span className="ticket-detail-badge" style={{ backgroundColor: priorityColor(ticket.priority), color: '#fff' }}>
                {getPriorityIcon(ticket.priority)}
                <span>{ticket.priority}</span>
              </span>
            </div>
          </div>

          <div className="ticket-detail-status-message">
            <Info size={16} color={COLORS.Exito} />
            <span>{statusMessage()}</span>
          </div>

          <div className="ticket-detail-info-grid">
            <div className="ticket-detail-info-item">
              <span className="ticket-detail-info-label"><Briefcase size={14} /> Servicio</span>
              <span className="ticket-detail-info-value">{serviceName || '—'}</span>
            </div>
            <div className="ticket-detail-info-item">
              <span className="ticket-detail-info-label"><Wrench size={14} /> Tipo de daño</span>
              <span className="ticket-detail-info-value">{damageName || '—'}</span>
            </div>
            <div className="ticket-detail-info-item">
              <span className="ticket-detail-info-label"><MapPin size={14} /> Ubicación</span>
              <span className="ticket-detail-info-value">{ticket.location || '—'}</span>
            </div>
            <div className="ticket-detail-info-item">
              <span className="ticket-detail-info-label"><Hash size={14} /> Equipo/Activo</span>
              <span className="ticket-detail-info-value">{ticket.assetCode || '—'}</span>
            </div>
            <div className="ticket-detail-info-item">
              <span className="ticket-detail-info-label"><Building2 size={14} /> Nivel actual</span>
              <span className="ticket-detail-info-value">{ticket.levelName}</span>
            </div>
            <div className="ticket-detail-info-item">
              <span className="ticket-detail-info-label"><Calendar size={14} /> Creado</span>
              <span className="ticket-detail-info-value">{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="ticket-detail-info-item">
              <span className="ticket-detail-info-label"><RefreshCw size={14} /> Actualizado</span>
              <span className="ticket-detail-info-value">{formatDate(ticket.updatedAt)}</span>
            </div>
          </div>

          <div className="ticket-detail-divider" />

          <div className="ticket-detail-desc-section">
            <h3 className="ticket-detail-section-title">
              <FileText size={16} color={COLORS.Primario} />
              Descripción del problema
            </h3>
            <p className="ticket-detail-description">{ticket.description}</p>
          </div>

          {!loadingAttachments && attachments.length > 0 && (
            <div className="ticket-detail-images-section">
              <h3 className="ticket-detail-section-title">
                <Image size={16} color={COLORS.Primario} />
                Adjuntos ({attachments.length})
              </h3>
              <div className="ticket-detail-images-grid">
                {attachments.map((att) => (
                  <div key={att.id} className="ticket-detail-image-item">
                    <div className="ticket-detail-image-icon" onClick={() => handleViewImage(att)}>
                      <FileImage size={32} color={COLORS.Primario} />
                    </div>
                    <div className="ticket-detail-image-info">
                      <span className="ticket-detail-image-name">{att.fileName.substring(0, 15)}...</span>
                      <span className="ticket-detail-image-size">{(att.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <button className="ticket-detail-download-btn" onClick={() => handleDownload(att.id, att.fileName)} title="Descargar">
                      <Download size={16} />
                    </button>
                    {canDeleteAttachment(att.userId) && (
                      <button className="ticket-detail-delete-btn" onClick={() => handleDeleteAttachment(att.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ticket.status !== 'Cerrado' && attachments.length < 5 && (
            <div className="ticket-detail-upload-section">
              <label htmlFor="more-images" className="ticket-detail-upload-btn">
                <Upload size={14} />
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
              {uploadingNew && <span className="ticket-detail-uploading-text">Subiendo...</span>}
            </div>
          )}

          <div className="ticket-detail-action-buttons">
            <button className="ticket-detail-history-btn" onClick={() => setShowHistoryModal(true)}>
              <History size={16} />
              Ver historial del ticket
              <ChevronRight size={14} />
            </button>

            <button className="ticket-detail-export-btn" onClick={handleExportDetail}>
              <Download size={16} />
              Exportar detalle (PDF)
            </button>

            {ticket.status === 'Resuelto' && (
              <div className="ticket-detail-resolved-section">
                <button className="ticket-detail-view-solution-btn" onClick={() => setShowSolutionDetails(true)}>
                  <Eye size={16} />
                  Ver solución aplicada
                </button>
                <div className="ticket-detail-confirm-buttons">
                  <button className="ticket-detail-confirm-yes" onClick={confirmSolution} disabled={confirming}>
                    <ThumbsUp size={16} />
                    {confirming ? 'Confirmando...' : 'Sí, está solucionado'}
                  </button>
                  <button className="ticket-detail-confirm-no" onClick={() => setShowRejectModal(true)}>
                    <AlertCircle size={16} />
                    No, persiste el problema
                  </button>
                </div>
              </div>
            )}

            {(ticket.status === 'Cerrado') && solutionData && (
              <button className="ticket-detail-solution-btn" onClick={() => setShowSolutionDetails(true)}>
                <Eye size={16} />
                Ver solución aplicada
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Historial */}
      {showHistoryModal && (
        <div className="ticket-detail-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="ticket-detail-history-modal">
            <div className="ticket-detail-modal-header">
              <History size={20} color={COLORS.Primario} />
              <h3 className="ticket-detail-modal-title">Historial del ticket</h3>
              <button className="ticket-detail-modal-close" onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="ticket-detail-history-content">
              {actions.length === 0 ? (
                <p className="ticket-detail-empty-history">Aún no hay actividades registradas.</p>
              ) : (
                actions.map((a) => {
                  const isMine = a.userId === myUserId;
                  return (
                    <div key={a.id} className="ticket-detail-history-item">
                      <div className="ticket-detail-history-icon">
                        {getActionIcon(a.actionType)}
                      </div>
                      <div className="ticket-detail-history-detail">
                        <div className="ticket-detail-history-header">
                          <span className="ticket-detail-history-type">{actionLabel(a.actionType)}</span>
                          <span className="ticket-detail-history-date">{formatDate(a.createdAt)}</span>
                        </div>
                        <p className="ticket-detail-history-desc">{a.description}</p>
                        {(a.fromValue || a.toValue) && (
                          <div className="ticket-detail-history-change">
                            <span className="ticket-detail-from-val">{a.fromValue || '—'}</span>
                            <span>→</span>
                            <span className="ticket-detail-to-val">{a.toValue || '—'}</span>
                          </div>
                        )}
                        {a.userFullName && a.userId !== 0 && (
                          <div className="ticket-detail-history-user">
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
            <div className="ticket-detail-modal-footer">
              <button className="ticket-detail-modal-button" onClick={() => setShowHistoryModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Solución Detallada */}
      {showSolutionDetails && solutionData && (
        <div className="ticket-detail-modal-overlay" onClick={() => setShowSolutionDetails(false)}>
          <div className="ticket-detail-solution-modal">
            <div className="ticket-detail-modal-header">
              <div className="ticket-detail-solution-header-icon">
                <CheckCircle size={22} color={COLORS.Exito} />
                <div>
                  <h3 className="ticket-detail-modal-title">Solución aplicada</h3>
                  <p className="ticket-detail-solution-subtitle">Ticket #{solutionData.ticketNumber}</p>
                </div>
              </div>
              <button className="ticket-detail-modal-close" onClick={() => setShowSolutionDetails(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="ticket-detail-solution-body">
              <div className="ticket-detail-detail-card">
                <div className="ticket-detail-detail-card-header">
                  <div className="ticket-detail-detail-card-icon">
                    <AlertCircle size={18} color={COLORS.Primario} />
                  </div>
                  <span className="ticket-detail-detail-card-title">Problema y síntomas</span>
                </div>
                <p className="ticket-detail-detail-card-text">{solutionData.problem}</p>
              </div>

              <div className="ticket-detail-detail-card">
                <div className="ticket-detail-detail-card-header">
                  <div className="ticket-detail-detail-card-icon-warning">
                    <Settings size={18} color={COLORS.Advertencia} />
                  </div>
                  <span className="ticket-detail-detail-card-title">Causa raíz</span>
                </div>
                <p className="ticket-detail-detail-card-text">{solutionData.cause}</p>
              </div>

              <div className="ticket-detail-detail-card-highlight">
                <div className="ticket-detail-detail-card-header">
                  <div className="ticket-detail-detail-card-icon-success">
                    <CheckCircle size={18} color={COLORS.Exito} />
                  </div>
                  <span className="ticket-detail-detail-card-title">Solución aplicada</span>
                </div>
                <p className="ticket-detail-detail-card-text">{solutionData.solution}</p>
              </div>
            </div>

            <div className="ticket-detail-modal-footer">
              <button className="ticket-detail-modal-button" onClick={() => setShowSolutionDetails(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazo */}
      {showRejectModal && (
        <div className="ticket-detail-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="ticket-detail-reject-modal">
            <div className="ticket-detail-modal-header">
              <AlertCircle size={20} color={COLORS.Error} />
              <h3 className="ticket-detail-modal-title">Rechazar solución</h3>
              <button className="ticket-detail-modal-close" onClick={() => setShowRejectModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ticket-detail-reject-body">
              <p className="ticket-detail-reject-description">
                ¿Por qué no quedaste satisfecho con la solución? Tu feedback ayudará al técnico a mejorar.
              </p>

              <label className="ticket-detail-reject-label">Motivo del rechazo *</label>
              <textarea
                className="ticket-detail-reject-textarea"
                placeholder="Ejemplo: La impresora sigue sin imprimir, aparece un error 'fuera de línea' después de reiniciar el equipo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
                autoFocus
              />
            </div>

            <div className="ticket-detail-modal-footer">
              <button className="ticket-detail-reject-cancel" onClick={() => setShowRejectModal(false)} disabled={rejecting}>
                Cancelar
              </button>
              <button className="ticket-detail-reject-confirm" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
                {rejecting ? 'Rechazando...' : 'Rechazar solución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Imagen */}
      {selectedImage && (
        <div className="ticket-detail-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="ticket-detail-image-modal">
            <button className="ticket-detail-image-modal-close" onClick={() => setSelectedImage(null)}>
              <X size={20} />
            </button>
            <img src={selectedImage.url} alt={selectedImage.fileName} className="ticket-detail-image-modal-content" />
            <div className="ticket-detail-image-modal-info">
              <span>{selectedImage.fileName}</span>
              <span>{(selectedImage.fileSize / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ticket-detail-page {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
          min-height: 100vh;
          background-color: ${COLORS.Fondo};
        }

        .ticket-detail-header-bar {
          margin-bottom: 20px;
        }

        .ticket-detail-back-btn {
          background: none;
          border: none;
          color: ${COLORS.Primario};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0;
        }

        .ticket-detail-card {
          background: ${COLORS.Blanco};
          border-radius: 20px;
          border: 1px solid ${COLORS.Borde};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 28px;
        }

        .ticket-detail-ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .ticket-detail-ticket-number {
          font-size: 12px;
          font-weight: 700;
          color: ${COLORS.Primario};
          background: ${COLORS.PrimarioLight};
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .ticket-detail-title {
          font-size: 22px;
          font-weight: 700;
          color: ${COLORS.Texto};
          margin: 0;
        }

        .ticket-detail-badges-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ticket-detail-badge {
          color: #fff;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .ticket-detail-status-message {
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

        .ticket-detail-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px 24px;
          margin-bottom: 24px;
        }

        .ticket-detail-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid ${COLORS.Borde};
          flex-wrap: wrap;
          gap: 8px;
        }

        .ticket-detail-info-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: ${COLORS.TextoSecundario};
        }

        .ticket-detail-info-value {
          font-size: 13px;
          font-weight: 500;
          color: ${COLORS.Texto};
        }

        .ticket-detail-divider {
          height: 1px;
          background: ${COLORS.Borde};
          margin: 16px 0;
        }

        .ticket-detail-desc-section {
          margin-bottom: 24px;
        }

        .ticket-detail-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.Texto};
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ticket-detail-description {
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
        }

        .ticket-detail-images-section {
          margin-bottom: 24px;
        }

        .ticket-detail-images-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ticket-detail-image-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 10px;
          border: 1px solid ${COLORS.Borde};
          flex: 1;
          min-width: 200px;
        }

        .ticket-detail-image-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: ${COLORS.PrimarioLight};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .ticket-detail-image-info {
          flex: 1;
        }

        .ticket-detail-image-name {
          font-size: 11px;
          color: #374151;
          display: block;
        }

        .ticket-detail-image-size {
          font-size: 9px;
          color: #8a9bb5;
        }

        .ticket-detail-download-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: ${COLORS.Primario};
          border-radius: 6px;
        }

        .ticket-detail-delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: ${COLORS.Error};
          border-radius: 6px;
        }

        .ticket-detail-upload-section {
          margin-top: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ticket-detail-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: ${COLORS.PrimarioLight};
          color: ${COLORS.Primario};
          border: 1px solid ${COLORS.Primario}40;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .ticket-detail-uploading-text {
          font-size: 12px;
          color: ${COLORS.Primario};
          font-style: italic;
        }

        .ticket-detail-action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .ticket-detail-history-btn,
        .ticket-detail-export-btn,
        .ticket-detail-view-solution-btn,
        .ticket-detail-solution-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        }

        .ticket-detail-history-btn {
          background: ${COLORS.Blanco};
          border: 1px solid ${COLORS.Borde};
          color: #374151;
        }

        .ticket-detail-export-btn {
          background: #fff;
          border: 1px solid #8b5cf6;
          color: #8b5cf6;
        }

        .ticket-detail-view-solution-btn,
        .ticket-detail-solution-btn {
          background: #ecfdf5;
          border: 1px solid ${COLORS.Exito}40;
          color: ${COLORS.Exito};
        }

        .ticket-detail-resolved-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .ticket-detail-confirm-buttons {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .ticket-detail-confirm-yes,
        .ticket-detail-confirm-no {
          flex: 1;
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

        .ticket-detail-confirm-yes {
          background: ${COLORS.Exito};
          color: #fff;
        }

        .ticket-detail-confirm-no {
          background: ${COLORS.Error};
          color: #fff;
        }

        .ticket-detail-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          gap: 16px;
        }

        .ticket-detail-error-box {
          background: #fef3f2;
          color: ${COLORS.Error};
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
        }

        .ticket-detail-spinner {
          animation: spin 1s linear infinite;
        }

        /* Modales */
        .ticket-detail-modal-overlay {
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

        .ticket-detail-history-modal,
        .ticket-detail-solution-modal,
        .ticket-detail-reject-modal,
        .ticket-detail-image-modal {
          background: ${COLORS.Blanco};
          border-radius: 20px;
          max-width: 90%;
          max-height: 85vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .ticket-detail-history-modal {
          width: 600px;
          display: flex;
          flex-direction: column;
        }

        .ticket-detail-solution-modal,
        .ticket-detail-reject-modal {
          width: 550px;
        }

        .ticket-detail-image-modal {
          max-width: 90vw;
          max-height: 90vh;
          position: relative;
        }

        .ticket-detail-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid ${COLORS.Borde};
          background: #f9fafb;
        }

        .ticket-detail-solution-header-icon {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ticket-detail-solution-subtitle {
          font-size: 12px;
          color: ${COLORS.TextoSecundario};
          margin: 0;
        }

        .ticket-detail-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: ${COLORS.Texto};
          margin: 0;
        }

        .ticket-detail-modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: ${COLORS.TextoSecundario};
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 6px;
        }

        .ticket-detail-history-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        .ticket-detail-history-item {
          display: flex;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid ${COLORS.Borde};
        }

        .ticket-detail-history-icon {
          width: 32px;
          height: 32px;
          border-radius: 16px;
          background: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ticket-detail-history-detail {
          flex: 1;
        }

        .ticket-detail-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 6px;
        }

        .ticket-detail-history-type {
          font-size: 12px;
          font-weight: 700;
          color: ${COLORS.Texto};
        }

        .ticket-detail-history-date {
          font-size: 10px;
          color: #8a9bb5;
        }

        .ticket-detail-history-desc {
          font-size: 13px;
          color: #4b5563;
          margin: 0 0 6px 0;
          line-height: 1.5;
        }

        .ticket-detail-history-change {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 6px;
          margin-bottom: 6px;
        }

        .ticket-detail-from-val {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .ticket-detail-to-val {
          font-weight: 600;
          color: ${COLORS.Texto};
        }

        .ticket-detail-history-user {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #8a9bb5;
        }

        .ticket-detail-empty-history {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
          font-size: 13px;
        }

        .ticket-detail-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid ${COLORS.Borde};
          display: flex;
          justify-content: flex-end;
        }

        .ticket-detail-modal-button {
          background: ${COLORS.Primario};
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .ticket-detail-solution-body {
          padding: 20px 24px;
          max-height: calc(85vh - 80px);
          overflow-y: auto;
        }

        .ticket-detail-detail-card,
        .ticket-detail-detail-card-highlight {
          background: #fff;
          border-radius: 16px;
          border: 1px solid ${COLORS.Borde};
          padding: 16px 20px;
          margin-bottom: 20px;
        }

        .ticket-detail-detail-card-highlight {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .ticket-detail-detail-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 2px solid ${COLORS.Primario}20;
        }

        .ticket-detail-detail-card-icon,
        .ticket-detail-detail-card-icon-warning,
        .ticket-detail-detail-card-icon-success {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ticket-detail-detail-card-icon { background: ${COLORS.Primario}15; }
        .ticket-detail-detail-card-icon-warning { background: ${COLORS.Advertencia}15; }
        .ticket-detail-detail-card-icon-success { background: ${COLORS.Exito}15; }

        .ticket-detail-detail-card-title {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ticket-detail-detail-card-text {
          font-size: 14px;
          color: #1a1a2e;
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
        }

        .ticket-detail-reject-body {
          padding: 20px 24px;
        }

        .ticket-detail-reject-description {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .ticket-detail-reject-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .ticket-detail-reject-textarea {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid ${COLORS.Borde};
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          box-sizing: border-box;
          outline: none;
        }

        .ticket-detail-reject-cancel,
        .ticket-detail-reject-confirm {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .ticket-detail-reject-cancel {
          background: ${COLORS.Blanco};
          color: #374151;
          border: 1px solid ${COLORS.Borde};
          margin-right: 12px;
        }

        .ticket-detail-reject-confirm {
          background: ${COLORS.Error};
          color: #fff;
          border: none;
        }

        .ticket-detail-image-modal-close {
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

        .ticket-detail-image-modal-content {
          max-width: 100%;
          max-height: calc(90vh - 60px);
          object-fit: contain;
          display: block;
        }

        .ticket-detail-image-modal-info {
          padding: 12px 16px;
          border-top: 1px solid ${COLORS.Borde};
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: ${COLORS.TextoSecundario};
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ticket-detail-page {
            padding: 70px 12px 20px 12px;
          }

          .ticket-detail-card {
            padding: 20px;
          }

          .ticket-detail-title {
            font-size: 18px;
          }

          .ticket-detail-info-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .ticket-detail-info-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .ticket-detail-images-grid {
            flex-direction: column;
          }

          .ticket-detail-image-item {
            min-width: auto;
          }

          .ticket-detail-confirm-buttons {
            flex-direction: column;
          }

          .ticket-detail-history-modal,
          .ticket-detail-solution-modal,
          .ticket-detail-reject-modal {
            width: 95%;
          }

          .ticket-detail-history-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </Layout>
  );
}

export default TicketDetailUser;