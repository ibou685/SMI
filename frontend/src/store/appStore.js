// frontend/src/store/appStore.js
// Zustand store pour état global de l'app

import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Filiales
  filiales: [],
  filiauxLoading: false,
  setFiliales: (filiales) => set({ filiales }),
  setFilialesLoading: (loading) => set({ filiauxLoading: loading }),

  // Recettes
  recettes: [],
  recettesLoading: false,
  setRecettes: (recettes) => set({ recettes }),
  setRecettesLoading: (loading) => set({ recettesLoading: loading }),

  // Dépenses
  depenses: [],
  depensesLoading: false,
  setDepenses: (depenses) => set({ depenses }),
  setDepensesLoading: (loading) => set({ depensesLoading: loading }),

  // Statistiques
  stats: {
    totalRecettes: 0,
    totalDepenses: 0,
    solde: 0,
    nbRecettes: 0,
    nbDepenses: 0,
    date: new Date().toISOString().split('T')[0]
  },
  setStats: (stats) => set({ stats }),

  // Alertes
  alertes: [],
  setAlertes: (alertes) => set({ alertes }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: Date.now() }]
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Modal
  modalOpen: false,
  modalType: null,
  modalData: null,
  openModal: (type, data = null) =>
    set({ modalOpen: true, modalType: type, modalData: data }),
  closeModal: () =>
    set({ modalOpen: false, modalType: null, modalData: null }),

  // Filter
  filters: {
    dateMin: null,
    dateMax: null,
    filiale: null,
    categorie: null,
    statut: null
  },
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
  clearFilters: () =>
    set({
      filters: {
        dateMin: null,
        dateMax: null,
        filiale: null,
        categorie: null,
        statut: null
      }
    }),

  // Helpers
  getFiliale: (id) => get().filiales.find((f) => f.id === id),
  getRecettesByFiliale: (filialeId) =>
    get().recettes.filter((r) => r.filiale_id === filialeId),
  getTotalRecettes: () => get().recettes.reduce((sum, r) => sum + r.montant, 0),
  getTotalDepenses: () => get().depenses.reduce((sum, d) => sum + d.montant, 0),
  getSolde: () => get().getTotalRecettes() - get().getTotalDepenses()
}));

// Hooks thématiques
export const useFiliales = () => {
  const filiales = useAppStore((state) => state.filiales);
  const loading = useAppStore((state) => state.filiauxLoading);
  const setFiliales = useAppStore((state) => state.setFiliales);
  const setLoading = useAppStore((state) => state.setFilialesLoading);
  return { filiales, loading, setFiliales, setLoading };
};

export const useRecettes = () => {
  const recettes = useAppStore((state) => state.recettes);
  const loading = useAppStore((state) => state.recettesLoading);
  const setRecettes = useAppStore((state) => state.setRecettes);
  const setLoading = useAppStore((state) => state.setRecettesLoading);
  return { recettes, loading, setRecettes, setLoading };
};

export const useDepenses = () => {
  const depenses = useAppStore((state) => state.depenses);
  const loading = useAppStore((state) => state.depensesLoading);
  const setDepenses = useAppStore((state) => state.setDepenses);
  const setLoading = useAppStore((state) => state.setDepensesLoading);
  return { depenses, loading, setDepenses, setLoading };
};

export const useStats = () => {
  const stats = useAppStore((state) => state.stats);
  const setStats = useAppStore((state) => state.setStats);
  return { stats, setStats };
};

export const useNotifications = () => {
  const notifications = useAppStore((state) => state.notifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const removeNotification = useAppStore((state) => state.removeNotification);
  return { notifications, addNotification, removeNotification };
};

export const useUI = () => {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const modalOpen = useAppStore((state) => state.modalOpen);
  const modalType = useAppStore((state) => state.modalType);
  const modalData = useAppStore((state) => state.modalData);
  const openModal = useAppStore((state) => state.openModal);
  const closeModal = useAppStore((state) => state.closeModal);
  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    modalOpen,
    modalType,
    modalData,
    openModal,
    closeModal
  };
};