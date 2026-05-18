import axios from 'axios';

const authAPI = axios.create({
  baseURL: 'https://localhost:7179/api',
});

const ticketAPI = axios.create({
  baseURL: 'https://localhost:7258/api',
});

const catalogAPI = axios.create({
  baseURL: 'https://localhost:7252/api',
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

export { authAPI, ticketAPI, catalogAPI };