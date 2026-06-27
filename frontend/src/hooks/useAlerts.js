// frontend/src/hooks/useAlerts.js

import { useEffect } from 'react';

export function useAlerts(onAlert) {
  useEffect(() => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const eventSource = new EventSource(`${baseURL}/api/alertes/stream`);

    eventSource.onopen = () => {
      console.log('✅ SSE Connecté');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Message SSE reçu:', data);

        // ✅ TRAITER TOUS LES TYPES D'ALERTES
        if (data.type === 'connected') {
          console.log('🔗 Connecté aux alertes:', data.message);
        } else if (data.type === 'new_alerte') {
          console.log('🚨 NOUVELLE ALERTE:', data);
          onAlert({
            titre: data.titre,
            description: data.description,
            type: data.type_alerte,
            statut: 'Active'
          });
        }
      } catch (err) {
        console.error('Erreur parsing SSE:', err);
      }
    };

    eventSource.onerror = () => {
      console.log('⚠️ Erreur SSE');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [onAlert]);

  return { isConnected: true };
}