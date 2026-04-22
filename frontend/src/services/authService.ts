import api from './api';

const API_URL = '/auth';

const register = async (userData: any) => {
    const response = await api.post(`${API_URL}/register`, userData);
    return response.data;
};

const login = async (userData: any) => {
    const response = await api.post(`${API_URL}/login`, userData);
    return response.data;
};

const logout = async () => {
    const response = await api.get(`${API_URL}/logout`);
    return response.data;
};

const getMe = async () => {
    const response = await api.get(`${API_URL}/me`);
    return response.data;
};

const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const verifyId = async (documentUrl: string) => {
    const response = await api.post(`${API_URL}/verify-id`, { documentUrl });
    return response.data;
};

const authService = {
    register,
    login,
    logout,
    getMe,
    uploadImage,
    verifyId,
};

export default authService;
