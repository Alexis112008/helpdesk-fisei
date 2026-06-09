import axios from 'axios';

const authAPI = axios.create({
  baseURL: 'http://192.168.137.1:5110/api',
});

const ticketAPI = axios.create({
  baseURL: 'http://192.168.137.1:5122/api',
});

const catalogAPI = axios.create({
  baseURL: 'http://192.168.137.1:5038/api',
});

// Agregar token a los TRES servicios
const addToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

authAPI.interceptors.request.use(addToken);
ticketAPI.interceptors.request.use(addToken);
catalogAPI.interceptors.request.use(addToken);

export const userAPI = {
  getList: (params) => authAPI.get('/users/list', { params }),
  update: (id, data) => authAPI.put(`/users/${id}`, data),
  delete: (id) => authAPI.delete(`/users/${id}`)
};

export const attachmentsAPI = {
  // Subir archivos adjuntos a un ticket
  upload: (ticketId, formData, onProgress) =>
    ticketAPI.post(`/ticket/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    }),

  // Obtener todos los archivos adjuntos de un ticket
  getByTicket: (ticketId) =>
    ticketAPI.get(`/ticket/${ticketId}/attachments`),

  // Descargar un archivo específico
  download: (attachmentId) =>
    ticketAPI.get(`/ticket/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    }),

  // Eliminar un archivo adjunto
  delete: (attachmentId) =>
    ticketAPI.delete(`/ticket/attachments/${attachmentId}`),
};

// También puedes agregar métodos directamente a ticketAPI si prefieres
ticketAPI.uploadAttachments = (ticketId, formData, onProgress) =>
  ticketAPI.post(`/ticket/${ticketId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  });

ticketAPI.getAttachments = (ticketId) =>
  ticketAPI.get(`/ticket/${ticketId}/attachments`);

ticketAPI.downloadAttachment = (attachmentId) =>
  ticketAPI.get(`/ticket/attachments/${attachmentId}/download`, { responseType: 'blob' });

ticketAPI.deleteAttachment = (attachmentId) =>
  ticketAPI.delete(`/ticket/attachments/${attachmentId}`);

export { authAPI, ticketAPI, catalogAPI };

// En catalogAPI (MicroserviceC)
catalogAPI.uploadSolutionAttachments = (articleId, formData, onProgress) =>
  catalogAPI.post('/knowledge/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { articleId },
    onUploadProgress: onProgress
  });

catalogAPI.getSolutionAttachments = (articleId) =>
  catalogAPI.get(`/knowledge/${articleId}/attachments`);

catalogAPI.downloadSolutionAttachment = (attachmentId) =>
  catalogAPI.get(`/knowledge/attachments/${attachmentId}/download`, { responseType: 'blob' });