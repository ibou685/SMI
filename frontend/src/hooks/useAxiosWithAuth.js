// frontend/src/hooks/useAxiosWithAuth.js - Hook axios 

import { useEffect } from 'react';
import { axiosInstance } from '../../api/client';

export function useAxiosWithAuth() {
  const { getToken } = useAuth();

  useEffect(() => {
    // ⬇️ INTERCEPTOR - Ajouter le token à chaque requête
    const requestInterceptor = axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.error('❌ Erreur récupération token:', err);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // ⬇️ INTERCEPTOR RESPONSE - Gérer les erreurs 401
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('❌ Non authentifié');
          window.location.href = '/sign-in';
        }
        return Promise.reject(error);
      }
    );

    // Cleanup
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [getToken]);

  return axiosInstance;
}
