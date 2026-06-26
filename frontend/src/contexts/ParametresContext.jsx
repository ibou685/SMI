// frontend/src/contexts/ParametresContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../api/client.js';

const ParametresContext = createContext();

export function ParametresProvider({ children }) {
  const [parametres, setParametres] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchParametres = async () => {
    try {
      console.log('📥 Chargement des paramètres...');
      const response = await axiosInstance.get('/parametres');
      setParametres(response.data);
      console.log('✅ Paramètres chargés:', response.data);
    } catch (err) {
      console.error('Erreur chargement paramètres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParametres();
  }, []);

  return (
    <ParametresContext.Provider value={{ parametres, loading, fetchParametres }}>
      {children}
    </ParametresContext.Provider>
  );
}

export function useParametres() {
  return useContext(ParametresContext);
}