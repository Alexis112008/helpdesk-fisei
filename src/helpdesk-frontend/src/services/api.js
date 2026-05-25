import axios from 'axios';

const authAPI = axios.create({
  baseURL: 'http://localhost:5110/api',
});

const ticketAPI = axios.create({
  baseURL: 'http://localhost:5122/api',
});

const catalogAPI = axios.create({
  baseURL: 'http://localhost:5038/api',
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