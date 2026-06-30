// frontend/src/api/client.js - VERSION AVEC INTERCEPTEUR JWT

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseURL = `${API_URL}/api`;

export const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

// ✅ Intercepteur REQUEST : ajouter le token JWT automatiquement
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Intercepteur RESPONSE : gérer les 401 (token expiré)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 - Token expiré ou invalide');
      localStorage.removeItem('smi_token');
      localStorage.removeItem('smi_user');
      // Rediriger vers /login (sauf si on y est déjà)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);