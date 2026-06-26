// À créer dans: frontend/src/components/UserProfile.jsx

import { useEffect, useState } from 'react';
import { axiosInstance } from '../api/client';
import { useAuth } from '../context/AuthContext';
const { user } = useAuth();

export function UserProfile() {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        if (!user) return;

        const response = await axiosInstance.get('/user');
        setUserRole(response.data.role);
        console.log(`👤 User: ${response.data.email} (${response.data.role})`);
      } catch (err) {
        console.error('❌ Erreur fetch role:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchRole();
    }
  }, [user, isLoaded]);

  if (!isLoaded || loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (!user) {
    return null;
  }

  const isAdmin = userRole === 'admin';

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
      {/* Badge rôle */}
      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
        isAdmin 
          ? 'bg-red-100 text-red-700' 
          : 'bg-blue-100 text-blue-700'
      }`}>
        {isAdmin ? '🔒 ADMIN' : '👤 USER'}
      </span>

      {/* Email */}
      <div className="flex-1">
        <p className="text-xs text-gray-600">{user.email}</p>
        <p className="text-xs text-gray-500">
          {isAdmin ? 'Accès complet' : 'Accès limité'}
        </p>
      </div>

      {/* Avatar */}
      <img 
        src={user.imageUrl} 
        alt={user.firstName}
        className="w-8 h-8 rounded-full"
      />
    </div>
  );
}
