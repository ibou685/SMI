import axios from 'axios';

const baseURL = `${import.meta.env.VITE_API_URL}/api` || 'http://localhost:5000/api';
console.log('🔍 API URL:', baseURL); 

export const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});