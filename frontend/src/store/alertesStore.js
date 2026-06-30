// frontend/src/store/alertesStore.js - VERSION SIMPLE ET ROBUSTE
// SSE alerts → toast notifications seulement
// DB alerts → liste dans AlertesPage
// Quand SSE alert arrive → re-fetch DB automatique

import { create } from 'zustand';
import { axiosInstance } from '../api/client';

let fetchDebounce = null;

export const useAlertesStore = create((set, get) => ({
  // Liste des alertes (toujours synchronisée avec la DB)
  alertes: [],
  // Stats
  stats: { active: 0, resolved: 0, total: 0 },
  // État connexion SSE
  isConnected: false,
  // Source SSE
  sseSource: null,
  derniereAlerteSSE: null,

    // ✅ Recevoir une alerte SSE (pour les toasts + re-fetch DB)
  onSSEAlerte: (data) => {
    console.log('📨 [Store] Alerte SSE reçue:', data.titre);

    // ✅ Stocker la dernière alerte pour que App.jsx l'affiche en toast
    set({
      derniereAlerteSSE: {
        titre: data.titre,
        description: data.description,
        message: data.description,
        type: data.type_alerte,
        statut: 'Active',
        timestamp: new Date().toLocaleString('fr-FR')
      }
    });

    // Déclencher un re-fetch de la DB (avec debounce)
    if (fetchDebounce) clearTimeout(fetchDebounce);
    fetchDebounce = setTimeout(() => {
      console.log('🔄 [Store] Re-fetch DB déclenché par SSE');
      get().fetchAlertes(get().currentFilter || 'Active');
    }, 500);
  },

  // ✅ Connecter SSE (UNE SEULE FOIS depuis App.jsx)
  connectSSE: () => {
    const state = get();
    if (state.sseSource) {
      console.log('ℹ️ [Store] SSE déjà connecté');
      return;
    }

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('🔌 [Store] Connexion SSE...');

    let reconnectAttempts = 0;
    let reconnectTimeout = null;

    const connect = () => {
      const eventSource = new EventSource(`${baseURL}/api/alertes/stream`);

      eventSource.onopen = () => {
        console.log('✅ [Store] SSE Connecté');
        set({ isConnected: true });
        reconnectAttempts = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_alerte') {
            // ✅ Appeler onSSEAlerte (qui gère les toasts dans App.jsx via abonnement)
            get().onSSEAlerte(data);
          }
        } catch (err) {
          console.error('❌ [Store] Erreur parsing SSE:', err);
        }
      };

      eventSource.onerror = () => {
        console.log('⚠️ [Store] Erreur SSE - reconnexion...');
        set({ isConnected: false });
        eventSource.close();

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        reconnectTimeout = setTimeout(connect, delay);
      };

      set({ sseSource: eventSource });
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      const src = get().sseSource;
      if (src) src.close();
      set({ sseSource: null, isConnected: false });
    };
  },

    // ✅ Fetcher les alertes depuis la DB (avec verrou anti-race-condition)
  currentFilter: 'Active',
  isFetching: false,  // ✅ Verrou
  fetchAlertes: async (filter) => {
    // ✅ Si un fetch est déjà en cours, on attend qu'il finisse
    if (get().isFetching) {
      console.log('⏳ [Store] Fetch déjà en cours, on ignore cet appel');
      return;
    }

    try {
      set({ isFetching: true, currentFilter: filter });

      let url = '/alertes';
      if (filter) url += `?statut=${filter}`;
      console.log('📤 [Store] Fetching:', url);

      const response = await axiosInstance.get(url);
      const dbAlertes = response.data || [];
      console.log('📥 [Store] DB alertes:', dbAlertes.length);

      // ✅ REMPLACER simplement
      set({ alertes: dbAlertes });

      // Stats
      const allRes = await axiosInstance.get('/alertes?statut=');
      const allData = allRes.data || [];
      const newStats = {
        active: allData.filter(a => a.statut === 'Active').length,
        resolved: allData.filter(a => a.statut === 'Résolue').length,
        total: allData.length
      };
      console.log('📊 [Store] Stats:', newStats);
      set({ stats: newStats });
    } catch (err) {
      console.error('❌ [Store] Erreur fetch:', err);
    } finally {
      set({ isFetching: false });
    }
  },


  // ✅ Résoudre une alerte
  resolveAlerte: async (id) => {
    if (!id) return;

    // Si c'est une alerte temporaire (ne devrait plus arriver avec la nouvelle archi)
    if (String(id).startsWith('temp_')) {
      set(state => ({
        alertes: state.alertes.filter(a => a.id !== id),
        stats: {
          ...state.stats,
          active: Math.max(0, state.stats.active - 1),
          resolved: state.stats.resolved + 1
        }
      }));
      return;
    }

    await axiosInstance.put(`/alertes/${id}`, { statut: 'Résolue' });
    set(state => ({
      alertes: state.alertes.filter(a => a.id !== id),
      stats: {
        ...state.stats,
        active: Math.max(0, state.stats.active - 1),
        resolved: state.stats.resolved + 1
      }
    }));
  }
}));