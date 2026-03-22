import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 70000, // 70s — supports long AI code generation responses
    validateStatus: (status) => status < 500
});

// Request interceptor — attach auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Per-request timeout override for AI endpoints
        if (config.url?.includes('/ai/')) {
            config.timeout = 70000;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        if (response.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return response;
    },
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('Request timeout');
            error.message = 'Request timed out. The AI is taking too long — please try a simpler prompt.';
        } else if (error.code === 'ERR_NETWORK') {
            console.error('Network error');
            error.message = 'Network error. Backend may be down.';
        } else if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
