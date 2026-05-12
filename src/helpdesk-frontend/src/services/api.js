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

    // Agregar token automáticamente a cada petición
    ticketAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
    });

    catalogAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
    });

    export { authAPI, ticketAPI, catalogAPI };