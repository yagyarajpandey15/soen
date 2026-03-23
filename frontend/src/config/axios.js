import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://soen-mt66.onrender.com',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 70000,
    withCredentials: true,
    validateStatus: (status) => status < 500
});

axiosInstance.interceptors.request.use(
    (config) => {
        if (config.url?.includes('/ai/')) {
            config.timeout = 70000;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => {
        if (response.status === 401) {
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return response;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;