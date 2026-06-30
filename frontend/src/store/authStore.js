// frontend/src/store/authStore.js
import { create } from 'zustand';
import { axiosInstance } from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('smi_user') || 'null'),
  token: localStorage.getItem('smi_token'),
  isAuthenticated: !!localStorage.getItem('smi_token'),
  loading: false,
  error: null,

  // ✅ Login
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('smi_token', token);
      localStorage.setItem('smi_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      });

      console.log('✅ Login OK:', user.email);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur de connexion';
      set({ loading: false, error: errorMsg });
      console.error('❌ Login failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  // ✅ Logout
  logout: () => {
    localStorage.removeItem('smi_token');
    localStorage.removeItem('smi_user');
    set({ user: null, token: null, isAuthenticated: false });
    console.log('👋 Logout');
  },

  // ✅ Vérifier token au démarrage
  verifyToken: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false });
      return false;
    }

    try {
      const response = await axiosInstance.get('/auth/verify');
      if (response.data.authenticated) {
        set({ user: response.data.user, isAuthenticated: true });
        return true;
      }
    } catch (err) {
      // Token expiré ou invalide
      get().logout();
      return false;
    }
  }
}));