// frontend/src/store/toastStore.js
import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set) => ({
  toasts: [],

  // ✅ Afficher un toast
  show: (message, type = 'info', duration = 4000) => {
    const id = nextId++;
    set(state => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));
    return id;
  },

  // ✅ Raccourcis par type
  success: (message, duration) => useToastStore.getState().show(message, 'success', duration),
  error: (message, duration) => useToastStore.getState().show(message, 'error', duration ?? 6000),
  info: (message, duration) => useToastStore.getState().show(message, 'info', duration),
  warning: (message, duration) => useToastStore.getState().show(message, 'warning', duration),

  // ✅ Supprimer un toast
  remove: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },

  // ✅ Vider tous les toasts
  clear: () => set({ toasts: [] })
}));

// ✅ Helper pour usage hors composant React
export const toast = {
  success: (msg, d) => useToastStore.getState().success(msg, d),
  error: (msg, d) => useToastStore.getState().error(msg, d),
  info: (msg, d) => useToastStore.getState().info(msg, d),
  warning: (msg, d) => useToastStore.getState().warning(msg, d)
};