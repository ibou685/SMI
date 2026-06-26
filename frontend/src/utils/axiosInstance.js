// frontend/src/utils/axiosInstance.js

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ajouter le token JWT à chaque requête
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ Token JWT envoyé`);
    } else {
      console.warn('⚠️ Pas de token trouvé');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Gérer les 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 - Token expiré');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;