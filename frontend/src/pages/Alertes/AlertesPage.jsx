// frontend/src/pages/Alertes/AlertesPage.jsx
// Page gestion des alertes - VERSION AVEC SSE TEMPS RÉEL

import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/client';
import { KPICard } from '../../components/KPICard';
import { useAlerts } from '../../hooks/useAlerts';

export function AlertesPage() {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  const [stats, setStats] = useState({ active: 0, resolved: 0, total: 0 });

  // ⬇️ ÉCOUTER SSE
  const { isConnected } = useAlerts((newAlert) => {
    console.log('🔔 Nouvelle alerte reçue dans AlertesPage:', newAlert);
    
    // Ajouter la nouvelle alerte à la liste
    setAlertes(prev => [newAlert, ...prev]);
    
    // Mettre à jour les stats
    if (newAlert.statut === 'Active') {
      setStats(prev => ({ ...prev, active: prev.active + 1, total: prev.total + 1 }));
    }
  });

  // Charger alertes
  useEffect(() => {
    const fetchAlertes = async () => {
      try {
        setLoading(true);
        
        // Récupérer les alertes avec le filtre
        let url = '/alertes';
        if (filter) {
          url += `?statut=${filter}`;
        }
        
        const response = await axiosInstance.get(url);
        console.log('Alertes reçues:', response.data);
        setAlertes(response.data || []);

        // Charger stats
        const allAlertes = await axiosInstance.get('/alertes');
        const active = (allAlertes.data || []).filter((a) => a.statut === 'Active').length;
        const resolved = (allAlertes.data || []).filter((a) => a.statut === 'Résolue').length;

        setStats({ active, resolved, total: allAlertes.data?.length || 0 });
      } catch (err) {
        console.error('❌ Erreur alertes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertes();
  }, [filter]);

  const handleCheckAlertes = async () => {
    try {
      const response = await axiosInstance.post('/alertes/verifier');
      alert(`✅ Vérification complétée à ${response.data.timestamp}`);
      
      // Recharger les alertes
      const allAlertes = await axiosInstance.get('/alertes');
      setAlertes(allAlertes.data || []);
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  const handleResolveAlerte = async (id) => {
    try {
      await axiosInstance.put(`/alertes/${id}`, { statut: 'Résolue' });
      setAlertes(alertes.filter((a) => a.id !== id));
      
      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        active: Math.max(0, prev.active - 1),
        resolved: prev.resolved + 1
      }));
      
      alert('✅ Alerte marquée comme résolue');
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'Retard paiement':
        return '⏰';
      case 'Dépense inhabituelle':
        return '💸';
      case 'Baisse recettes':
        return '📉';
      default:
        return '⚠️';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'Retard paiement':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'Dépense inhabituelle':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'Baisse recettes':
        return 'border-l-4 border-orange-500 bg-orange-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertes</h1>
          <p className="text-gray-600">Surveillance des anomalies</p>
          
          {/* ⬇️ INDICATEUR SSE */}
          <div className="mt-2">
            {isConnected ? (
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Alertes en direct (SSE)
              </span>
            ) : (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-gray-400"></span>
                Connexion...
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleCheckAlertes}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <i className="ti ti-refresh"></i>
          Vérifier maintenant
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KPICard title="Alertes actives" value={stats.active} unit="" color="red" />
        <KPICard title="Alertes résolues" value={stats.resolved} unit="" color="green" />
        <KPICard title="Total" value={stats.total} unit="" color="blue" />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('Active')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'Active'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Actives
          </button>
          <button
            onClick={() => setFilter('Résolue')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'Résolue'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Résolues
          </button>
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
        </div>
      </div>

      {/* Liste alertes */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : alertes.length === 0 ? (
        <div className="bg-green-50 rounded-lg p-12 text-center border border-green-200">
          <i className="ti ti-check-circle text-5xl text-green-600 mb-4"></i>
          <p className="text-green-700 font-semibold text-lg">Aucune alerte</p>
          <p className="text-green-600 mt-2">Tout fonctionne correctement! 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alertes.map((alerte) => (
            <div 
              key={alerte.id} 
              className={`p-4 rounded-lg ${getAlertColor(alerte.type)} animate-pulse-light`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1">
                  <div className="text-2xl">{getAlertIcon(alerte.type)}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{alerte.titre}</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {alerte.message || alerte.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(alerte.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-semibold">
                    {alerte.type}
                  </span>
                  {alerte.statut === 'Active' && (
                    <button
                      onClick={() => handleResolveAlerte(alerte.id)}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
                    >
                      Résoudre
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse-light {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
        
        .animate-pulse-light {
          animation: pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}