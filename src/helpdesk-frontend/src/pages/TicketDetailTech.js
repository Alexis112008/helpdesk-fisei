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
  const [showSolutionModal, setShowSolutionModal] = useState(false);
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

  // Exportar detalle del ticket a PDF
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
      <div style={st.loadingContainer}>
        <RefreshCw size={32} style={st.spinner} />
        <p>Cargando ticket...</p>
      </div>
    </Layout>;
  }

  const t = detail.ticket;
  const canDeleteAttachments = () => false;

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
      <div style={st.page}>
        <div style={st.headerBar}>
          <button style={st.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} style={{ marginRight: 8 }} />
            Volver
          </button>
        </div>

        <div style={st.ticketCard}>
          {rejectionReason && (t.status === 'En Proceso' || t.status === 'Abierto') && (
            <div style={st.rejectionAlert}>
              <div style={st.rejectionHeader}>
                <AlertCircle size={18} color="#dc2626" />
                <strong style={{ color: '#991b1b' }}>SOLUCIÓN RECHAZADA POR EL USUARIO</strong>
              </div>
              <div style={st.rejectionBody}>
                <label style={st.rejectionLabel}>Motivo del rechazo:</label>
                <p style={st.rejectionText}>"{rejectionReason.reason}"</p>
                {rejectionReason.rejectedAt && (
                  <div style={st.rejectionDate}>
                    <Calendar size={12} />
                    <span>Rechazado el {formatDate(rejectionReason.rejectedAt)}</span>
                  </div>
                )}
                {rejectionReason.rejectedBy && (
                  <div style={st.rejectionDate}>
                    <User size={12} />
                    <span>Rechazado por: {rejectionReason.rejectedBy}</span>
                  </div>
                )}
              </div>
              <div style={st.rejectionFooter}>
                Por favor, registra una nueva solución o escala el ticket teniendo en cuenta este feedback
              </div>
            </div>
          )}

          <div style={st.ticketHeader}>
            <div>
              <div style={st.ticketNumber}>
                <Tag size={14} style={{ marginRight: 6 }} />
                {t.ticketNumber}
              </div>
              <h1 style={st.title}>{t.title}</h1>
            </div>
            <div style={st.badgesContainer}>
              <span style={{ ...st.badge, backgroundColor: statusColor(t.status) }}>
                {t.status}
              </span>
              <span style={{ ...st.badge, backgroundColor: priorityColor(t.priority) }}>
                {getPriorityIcon(t.priority)}
                <span style={{ marginLeft: 4 }}>{t.priority}</span>
              </span>
            </div>
          </div>

          <div style={st.statusMessageBox}>
            <Info size={16} />
            <span>{statusMessage(t.status)}</span>
          </div>

          <div style={st.infoGrid}>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><User size={14} /> Solicitante</span>
              <span style={st.infoValue}>{requesterName || `ID: ${t.userId}`}</span>
            </div>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><Briefcase size={14} /> Servicio</span>
              <span style={st.infoValue}>{serviceName || '—'}</span>
            </div>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><Wrench size={14} /> Tipo de daño</span>
              <span style={st.infoValue}>{damageName || '—'}</span>
            </div>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><MapPin size={14} /> Ubicación</span>
              <span style={st.infoValue}>{t.location || '—'}</span>
            </div>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><Hash size={14} /> Equipo/Activo</span>
              <span style={st.infoValue}>{t.assetCode || '—'}</span>
            </div>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><Building2 size={14} /> Nivel actual</span>
              <span style={st.infoValue}>{t.levelName}</span>
            </div>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><User size={14} /> Técnico asignado</span>
              <span style={st.infoValue}>{t.assignedTechnicianId ? (technicianName || `ID: ${t.assignedTechnicianId}`) : 'Sin asignar'}</span>
            </div>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><Calendar size={14} /> Creado</span>
              <span style={st.infoValue}>{formatDate(t.createdAt)}</span>
            </div>
            <div style={st.infoItem}>
              <span style={st.infoLabel}><RefreshCw size={14} /> Actualizado</span>
              <span style={st.infoValue}>{formatDate(t.updatedAt)}</span>
            </div>
          </div>

          <div style={st.divider} />

          <div style={st.descSection}>
            <h3 style={st.sectionTitle}>
              <FileText size={16} />
              Descripción del problema
            </h3>
            <p style={st.description}>{t.description}</p>
          </div>

          {!loadingAttachments && attachments.length > 0 && (
            <div style={st.imagesSection}>
              <h3 style={st.sectionTitle}>
                <Image size={16} />
                Adjuntos ({attachments.length})
              </h3>
              <div style={st.imagesGrid}>
                {attachments.map((att) => (
                  <div key={att.id} style={st.imageItem}>
                    <div style={st.imageIcon} onClick={() => handleViewImage(att)}>
                      <FileImage size={32} color="#4361ee" />
                    </div>
                    <div style={st.imageInfo}>
                      <span style={st.imageName}>{att.fileName.substring(0, 20)}...</span>
                      <span style={st.imageSize}>{(att.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <button style={st.downloadBtn} onClick={() => handleDownload(att.id, att.fileName)} title="Descargar">
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEscalated && !isAssignedToMe && (
            <div style={st.escalatedMessageBox}>
              <ArrowUp size={16} style={{ marginRight: 8 }} />
              <span>
                <strong> Ticket escalado al nivel superior.</strong><br />
                Un técnico del siguiente nivel se encargará de la solución.
                No puedes realizar más acciones en este ticket.
              </span>
            </div>
          )}

          {isEscalated && isAssignedToMe && (
            <div style={{ ...st.escalatedMessageBox, background: '#fef3c7', color: '#92400e' }}>
              <ArrowUp size={16} style={{ marginRight: 8 }} />
              <span>
                <strong> Ticket escalado.</strong><br />
                El ticket ha sido escalado al nivel superior. Ya no puedes realizar acciones.
              </span>
            </div>
          )}

          <div style={st.actionButtons}>
            {/* Botón ver historial */}
            <button style={st.historyBtn} onClick={() => setShowHistoryModal(true)}>
              <History size={16} style={{ marginRight: 8 }} />
              Ver historial del ticket
            </button>

            {/* Botón exportar detalle a PDF */}
            <button style={st.exportDetailBtn} onClick={handleExportDetail}>
              <Download size={16} style={{ marginRight: 8 }} />
              Exportar detalle (PDF)
            </button>

            {showStartProgress && !rejectionReason && (
              <button style={st.progressBtn} onClick={handleStartProgress}>
                <Settings size={16} style={{ marginRight: 8 }} />
                Iniciar / En Proceso
              </button>
            )}

            {canEscalate && (
              <button style={st.escalateBtn} onClick={() => setEscalateOpen(true)}>
                <ArrowUp size={16} style={{ marginRight: 8 }} />
                Escalar
              </button>
            )}

            {rejectionReason && t.status === 'En Proceso' && (
              <button style={st.resolveBtn} onClick={handleResolve}>
                <CheckCircle size={16} style={{ marginRight: 8 }} />
                Registrar Nueva Solución
              </button>
            )}

            {canResolve && !rejectionReason && (
              <button style={st.resolveBtn} onClick={handleResolve}>
                <CheckCircle size={16} style={{ marginRight: 8 }} />
                Marcar como Resuelto
              </button>
            )}

            {canEditSolution && !rejectionReason && (
              <button style={{ ...st.resolveBtn, background: '#0f766e' }} onClick={handleResolve}>
                <Eye size={16} style={{ marginRight: 8 }} />
                Ver solución registrada
              </button>
            )}
          </div>

          {t.status === 'Cerrado' && (
            <div style={st.closedNotice}>
              <Lock size={14} style={{ marginRight: 8 }} />
              Este ticket está cerrado. No se pueden realizar más acciones.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DEL HISTORIAL */}
      {showHistoryModal && (
        <div style={st.modalOverlay} onClick={() => setShowHistoryModal(false)}>
          <div style={st.historyModal} onClick={(e) => e.stopPropagation()}>
            <div style={st.modalHeader}>
              <History size={20} color="#4361ee" />
              <h3 style={st.modalTitle}>Historial del ticket</h3>
              <button style={st.modalClose} onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={st.historyContent}>
              {detail.actions.length === 0 ? (
                <p style={st.emptyHistory}>Aún no hay actividades registradas.</p>
              ) : (
                detail.actions.map((a) => {
                  const isMine = a.userId === myUserId;
                  return (
                    <div key={a.id} style={st.historyItem}>
                      <div style={st.historyIcon}>
                        {getActionIcon(a.actionType)}
                      </div>
                      <div style={st.historyDetail}>
                        <div style={st.historyHeader}>
                          <span style={st.historyType}>{actionLabel(a.actionType)}</span>
                          <span style={st.historyDate}>{formatDate(a.createdAt)}</span>
                        </div>
                        <p style={st.historyDesc}>{a.description}</p>
                        {(a.fromValue || a.toValue) && (
                          <div style={st.historyChange}>
                            <span style={st.fromVal}>{a.fromValue || '—'}</span>
                            <span>→</span>
                            <span style={st.toVal}>{a.toValue || '—'}</span>
                          </div>
                        )}
                        {a.userFullName && a.userId !== 0 && (
                          <div style={st.historyUser}>
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
            <div style={st.modalFooter}>
              <button style={st.modalButton} onClick={() => setShowHistoryModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal escalamiento */}
      {escalateOpen && (
        <div style={modalStyles.overlay} onClick={() => setEscalateOpen(false)}>
          <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <div style={modalStyles.headerIcon}>
                <ArrowUp size={24} color="#fff" />
              </div>
              <div style={modalStyles.headerText}>
                <h2 style={modalStyles.title}>Escalar Ticket</h2>
                <p style={modalStyles.subtitle}>El ticket será derivado al siguiente nivel de soporte</p>
              </div>
              <button style={modalStyles.closeBtn} onClick={() => setEscalateOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={modalStyles.content}>
              <div style={modalStyles.levelInfo}>
                <div style={modalStyles.levelCard}>
                  <div style={modalStyles.levelBadge}>Nivel Actual</div>
                  <div style={modalStyles.levelValue}>
                    {t.currentLevel === 1 ? 'Nivel 1 - Técnico Básico' :
                      t.currentLevel === 2 ? 'Nivel 2 - Técnico Profesional' :
                        t.currentLevel === 3 ? 'Nivel 3 - DITIC' :
                          t.currentLevel === 4 ? 'Nivel 4 - Proveedor Externo' : `Nivel ${t.currentLevel}`}
                  </div>
                  <div style={modalStyles.levelIcon}>
                    <Building2 size={32} color="#6b7280" />
                  </div>
                </div>
                <div style={modalStyles.arrowIcon}>
                  <ArrowUp size={24} color="#f59e0b" />
                </div>
                <div style={modalStyles.levelCard}>
                  <div style={{ ...modalStyles.levelBadge, background: '#fef3c7', color: '#92400e' }}>Nivel Destino</div>
                  <div style={modalStyles.levelValue}>
                    {t.currentLevel === 1 ? 'Nivel 2 - Técnico Profesional' :
                      t.currentLevel === 2 ? 'Nivel 3 - DITIC' :
                        t.currentLevel === 3 ? 'Nivel 4 - Proveedor Externo' :
                          t.currentLevel >= 4 ? 'No aplica (máximo nivel)' : `Nivel ${t.currentLevel + 1}`}
                  </div>
                  <div style={modalStyles.levelIcon}>
                    <TrendingUp size={32} color="#f59e0b" />
                  </div>
                </div>
              </div>
              <div style={modalStyles.ticketInfo}>
                <div style={modalStyles.ticketBadge}>
                  <Ticket size={14} />
                  <span>{t.ticketNumber}</span>
                </div>
                <div style={modalStyles.ticketTitle}>{t.title}</div>
              </div>
              <div style={modalStyles.formSection}>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>
                    <AlertCircle size={16} style={{ marginRight: 8 }} />
                    Motivo del escalamiento <span style={modalStyles.required}>*</span>
                  </label>
                  <textarea
                    style={{ ...modalStyles.textarea, borderColor: escalateReason ? '#d1d5db' : '#fecaca' }}
                    placeholder="¿Por qué no puedes resolver este ticket en tu nivel?"
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    rows={4}
                  />
                  {!escalateReason && (
                    <div style={modalStyles.fieldHint}>
                      <AlertCircle size={12} />
                      <span>Este campo es obligatorio</span>
                    </div>
                  )}
                </div>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>
                    <Settings size={16} style={{ marginRight: 8 }} />
                    ¿Qué se intentó hacer? <span style={modalStyles.required}>*</span>
                  </label>
                  <textarea
                    style={{ ...modalStyles.textarea, borderColor: escalateAttempt ? '#d1d5db' : '#fecaca' }}
                    placeholder="Describe los pasos que intentaste para solucionar el problema..."
                    value={escalateAttempt}
                    onChange={(e) => setEscalateAttempt(e.target.value)}
                    rows={4}
                  />
                  {!escalateAttempt && (
                    <div style={modalStyles.fieldHint}>
                      <AlertCircle size={12} />
                      <span>Este campo es obligatorio</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={modalStyles.footer}>
              <button style={modalStyles.cancelBtn} onClick={() => setEscalateOpen(false)}>
                Cancelar
              </button>
              <button
                style={{
                  ...modalStyles.confirmBtn,
                  opacity: (!escalateReason || !escalateAttempt) ? 0.6 : 1,
                  cursor: (!escalateReason || !escalateAttempt) ? 'not-allowed' : 'pointer'
                }}
                onClick={doEscalate}
                disabled={!escalateReason || !escalateAttempt}
              >
                <ArrowUp size={16} style={{ marginRight: 8 }} />
                Confirmar Escalamiento
              </button>
            </div>
          </div>
        </div>
      )}

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

      {selectedImage && (
        <div style={st.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div style={st.imageModal} onClick={(e) => e.stopPropagation()}>
            <button style={st.imageModalClose} onClick={() => setSelectedImage(null)}>
              <X size={20} />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.fileName}
              style={st.imageModalContent}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M8 2v20M16 2v20M2 8h20M2 16h20"%3E%3C/path%3E%3C/svg%3E';
              }}
            />
            <div style={st.imageModalInfo}>
              <span>{selectedImage.fileName}</span>
              <span>{(selectedImage.fileSize / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// Helper functions
const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'Baja': return <CheckCircle size={14} />;
    case 'Media': return <Clock size={14} />;
    case 'Alta': return <TrendingUp size={14} />;
    case 'Crítica': return <Flame size={14} />;
    default: return null;
  }
};

const priorityColor = (p) => ({
  'Baja': '#388e3c', 'Media': '#f57f17',
  'Alta': '#e64a19', 'Crítica': '#b71c1c',
}[p] || '#333');

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

const st = {
  page: { padding: '24px', maxWidth: 800, margin: '0 auto', minHeight: '100vh', backgroundColor: '#f5f7fa' },
  escalatedMessageBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef3c7', borderRadius: 12, marginBottom: 24, fontSize: 13, color: '#92400e', border: '1px solid #fde68a' },
  headerBar: { marginBottom: 20 },
  backBtn: { background: 'none', border: 'none', color: '#4361ee', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 0 },
  ticketCard: { background: '#fff', borderRadius: 20, border: '1px solid #e4e7eb', padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  ticketNumber: { fontSize: 12, fontWeight: 700, color: '#4361ee', background: '#eef2ff', padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  badgesContainer: { display: 'flex', gap: 8 },
  badge: { color: '#fff', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center' },
  statusMessageBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f0fdf4', borderRadius: 12, marginBottom: 24, fontSize: 13, color: '#166534' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px', marginBottom: 24 },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f2f5' },
  infoLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: 500, color: '#1a1a2e' },
  divider: { height: 1, background: '#f0f2f5', margin: '16px 0' },
  descSection: { marginBottom: 24 },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
  imagesSection: { marginBottom: 24 },
  imagesGrid: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  imageItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #eef2f6' },
  imageIcon: { width: 48, height: 48, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' },
  imageInfo: { flex: 1 },
  imageName: { fontSize: 11, color: '#374151', display: 'block' },
  imageSize: { fontSize: 9, color: '#8a9bb5' },
  downloadBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#4361ee', borderRadius: 6, transition: 'background-color 0.2s' },
  actionButtons: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
  historyBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' },
  exportDetailBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#fff', border: '1px solid #8b5cf6', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#8b5cf6', cursor: 'pointer' },
  progressBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#4361ee', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  escalateBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#f59e0b', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  resolveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#10b981', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  commentSection: { marginTop: 8, paddingTop: 16, borderTop: '1px solid #eef2f6' },
  commentInput: { width: '100%', padding: 12, fontSize: 13, border: '1px solid #d0d5dd', borderRadius: 10, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 8 },
  commentError: { color: '#dc2626', fontSize: 11, marginBottom: 8 },
  sendBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  closedNotice: { marginTop: 16, padding: '12px 16px', background: '#f3f4f6', borderRadius: 10, fontSize: 12, color: '#6b7280', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  resolvedNotice: { marginTop: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, fontSize: 12, color: '#166534', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: 16 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  historyModal: { background: '#fff', borderRadius: 20, width: 600, maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalBox: { background: '#fff', borderRadius: 20, width: 480, maxWidth: '90%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid #eaecf0', background: '#f9fafb' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: 0, flex: 1 },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, display: 'flex', alignItems: 'center' },
  historyContent: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  historyItem: { display: 'flex', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0f2f5' },
  historyIcon: { width: 32, height: 32, borderRadius: 16, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyDetail: { flex: 1 },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  historyType: { fontSize: 12, fontWeight: 700, color: '#1a1a2e' },
  historyDate: { fontSize: 10, color: '#8a9bb5' },
  historyDesc: { fontSize: 13, color: '#4b5563', margin: '0 0 6px 0', lineHeight: 1.5 },
  historyChange: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, background: '#f3f4f6', padding: '4px 8px', borderRadius: 6, marginBottom: 6 },
  fromVal: { textDecoration: 'line-through', color: '#9ca3af' },
  reopenBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#ef4444', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  toVal: { fontWeight: 600, color: '#1a1a2e' },
  historyUser: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8a9bb5' },
  emptyHistory: { textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 },
  modalFooter: { padding: '16px 24px', borderTop: '1px solid #eaecf0', display: 'flex', justifyContent: 'flex-end' },
  modalButton: { background: '#4361ee', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  modalText: { fontSize: 14, color: '#4b5563', marginBottom: 20, padding: '0 24px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #eaecf0' },
  btnGhost: { padding: '10px 16px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  btnWarning: { padding: '10px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  textarea: { width: '100%', minHeight: 90, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 8 },
  lbl: { display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, padding: '0 24px' },
  imageModal: { background: '#fff', borderRadius: 16, maxWidth: '90vw', maxHeight: '90vh', overflow: 'hidden', position: 'relative' },
  imageModalClose: { position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', zIndex: 10 },
  imageModalContent: { maxWidth: '100%', maxHeight: 'calc(90vh - 60px)', objectFit: 'contain', display: 'block' },
  imageModalInfo: { padding: '12px 16px', borderTop: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' },
  rejectionAlert: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 24, overflow: 'hidden' },
  rejectionHeader: { background: '#fee2e2', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #fecaca' },
  rejectionBody: { padding: '16px' },
  rejectionLabel: { fontSize: 11, fontWeight: 600, color: '#7f1d1d', textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: 0.5 },
  rejectionText: { fontSize: 14, color: '#1f2937', margin: 0, padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #fecaca', lineHeight: 1.5, fontStyle: 'italic' },
  rejectionDate: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#991b1b', marginTop: 10 },
  rejectionFooter: { background: '#fef2f2', padding: '10px 16px', fontSize: 12, color: '#991b1b', borderTop: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 6 },
  spinner: { animation: 'spin 1s linear infinite' },
};

// Estilos para el modal de escalamiento mejorado
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.2s ease',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'slideUp 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: 20,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s',
  },
  content: {
    padding: '24px',
  },
  levelInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  levelCard: {
    flex: 1,
    background: '#f8fafc',
    borderRadius: 16,
    padding: '16px',
    textAlign: 'center',
    border: '1px solid #e4e7eb',
    position: 'relative',
  },
  levelBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: '#eef2ff',
    color: '#2d6a9f',
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 12,
  },
  levelValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 12,
  },
  levelIcon: {
    marginTop: 8,
  },
  arrowIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  ticketInfo: {
    background: '#f9fafb',
    borderRadius: 12,
    padding: '16px',
    marginBottom: 24,
    border: '1px solid #e4e7eb',
  },
  ticketBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    background: '#eef2ff',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color: '#2d6a9f',
    marginBottom: 10,
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
  },
  formSection: {
    marginBottom: 8,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
    marginLeft: 4,
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },
  fieldHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#ef4444',
    marginTop: 6,
  },
  tipBox: {
    display: 'flex',
    gap: 12,
    padding: '14px 16px',
    background: '#fffbeb',
    borderRadius: 12,
    border: '1px solid #fde68a',
    marginTop: 16,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 1.5,
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '16px 24px',
    borderTop: '1px solid #eaecf0',
    background: '#f9fafb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  confirmBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 24px',
    background: '#f59e0b',
    border: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Agregar animaciones
const existingStyle = document.createElement("style");
existingStyle.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .modal-cancel-btn:hover {
    background-color: #f3f4f6;
  }
  .modal-confirm-btn:hover {
    background-color: #d97706;
    transform: translateY(-1px);
  }
  .modal-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;
document.head.appendChild(existingStyle);

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default TicketDetailTech;