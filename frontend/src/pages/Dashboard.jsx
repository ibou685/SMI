// frontend/src/pages/Dashboard.jsx
// Page principale du tableau de bord SMI

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../api/client';
import { KPICard } from '../components/KPICard';
import { LineChart, PieChart, BarChart } from '../components/Charts';
import { AlertsList } from '../components/AlertsList';

export function Dashboard() {
  const { isSignedIn, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentes, setRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchData = async () => {
      try {
        const [statsRes, recentesRes] = await Promise.all([
          api.get('/api/stats/today'),
          api.get('/api/recettes?limit=10')
        ]);

        setStats(statsRes.data);
        setRecentes(recentesRes.data);
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Veuillez vous connecter</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Bienvenue, {user?.firstName}!</p>
        </div>
        <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
          <i className="ti ti-bell mr-2"></i>
          Alertes (3)
        </button>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Recettes du jour"
          value={stats?.totalRecettes || 0}
          unit="FCFA"
          trend="+8.2%"
          color="blue"
        />
        <KPICard
          title="Dépenses du jour"
          value={stats?.totalDepenses || 0}
          unit="FCFA"
          trend="-2.1%"
          color="red"
        />
        <KPICard
          title="Solde du jour"
          value={stats?.solde || 0}
          unit="FCFA"
          trend={stats?.solde > 0 ? '✓ Positif' : 'Attention'}
          color={stats?.solde > 0 ? 'green' : 'yellow'}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Évolution recettes</h2>
          <LineChart data={[45, 52, 48, 55, 50, 112.5]} labels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin']} />
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Répartition dépenses</h2>
          <PieChart
            data={[45, 20, 15, 12, 8]}
            labels={['Salaires', 'Électricité', 'Eau', 'Carburant', 'Autres']}
          />
        </div>
      </div>

      {/* Alertes & Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Recettes récentes</h2>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">Filiale</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Montant</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((recette) => (
                <tr key={recette.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{recette.filiale_id}</td>
                  <td className="py-3 px-4 font-semibold text-green-600">
                    {(recette.montant / 1000000).toFixed(2)}M FCFA
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(recette.date_versement).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Payé
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Alertes en attente</h2>
          <AlertsList />
        </div>
      </div>
    </div>
  );
}
