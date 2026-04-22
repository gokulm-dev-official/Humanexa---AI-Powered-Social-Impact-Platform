import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Session expired, logging out...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // We can't use useNavigate here as it's not a component, 
            // but a page refresh will pick up the logged-out state.
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
