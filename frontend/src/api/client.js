// frontend/src/api/client.js - VERSION CORRIGÉE
// Avant : const baseURL = `${import.meta.env.VITE_API_URL}/api` || 'http://localhost:5000/api';
// Bug : si VITE_API_URL est undefined, baseURL devient "undefined/api" (string non vide, donc le || n'agit jamais)

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseURL = `${API_URL}/api`;
console.log('🔍 API URL:', baseURL);

export const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});