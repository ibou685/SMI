// frontend/src/pages/Depenses/DepensesPage.jsx
// Page gestion des dépenses - VERSION SIMPLE

import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/client';
import { KPICard } from '../../components/KPICard';
import { DepenseForm } from './DepenseForm';

const CATEGORIES = [
  'Salaires',
  'Eau',
  'Électricité',
  'Carburant',
  'Loyer',
  'Maintenance',
  'Fournitures',
  'Communication',
  'Divers'
];

export function DepensesPage() {
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [stats, setStats] = useState({ total: 0, count: 0, byCategory: {} });

  // Charger dépenses
  useEffect(() => {
    const fetchDepenses = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/depenses');
        console.log('Dépenses reçues:', response.data);
        setDepenses(response.data || []);

        // Calculer stats
        const total = (response.data || []).reduce((sum, d) => sum + d.montant, 0);
        const count = response.data?.length || 0;

        // Grouper par catégorie
        const byCategory = {};
        (response.data || []).forEach((d) => {
          if (!byCategory[d.categorie]) {
            byCategory[d.categorie] = { total: 0, count: 0 };
          }
          byCategory[d.categorie].total += d.montant;
          byCategory[d.categorie].count++;
        });

        setStats({ total, count, byCategory });
      } catch (err) {
        console.error('Erreur depenses:', err);
        alert(`Erreur: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDepenses();
  }, []);

  const handleCreateDepense = async (data) => {
    try {
      const response = await axiosInstance.post('/depenses', data);
      setDepenses([response.data, ...depenses]);
      setModalOpen(false);
      alert(`✅ Dépense de ${(response.data.montant / 1000000).toFixed(1)}M FCFA enregistrée`);
    } catch (err) {
      alert(`❌ Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteDepense = async (id) => {
    if (!window.confirm('Êtes-vous sûr?')) return;

    try {
      await axiosInstance.delete(`/depenses/${id}`);
      setDepenses(depenses.filter((d) => d.id !== id));
      alert('✅ Dépense supprimée');
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Salaires': 'bg-blue-100 text-blue-800',
      'Eau': 'bg-cyan-100 text-cyan-800',
      'Électricité': 'bg-yellow-100 text-yellow-800',
      'Carburant': 'bg-orange-100 text-orange-800',
      'Loyer': 'bg-purple-100 text-purple-800',
      'Maintenance': 'bg-red-100 text-red-800',
      'Fournitures': 'bg-green-100 text-green-800',
      'Communication': 'bg-indigo-100 text-indigo-800',
      'Divers': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredDepenses = depenses.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      (d.description?.toLowerCase().includes(term) ||
        d.categorie?.toLowerCase().includes(term)) &&
      (!categoryFilter || d.categorie === categoryFilter)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dépenses</h1>
          <p className="text-gray-600">Gestion des charges et frais</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
          <i className="ti ti-plus"></i>
          Nouvelle Dépense
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <KPICard
          title="Total dépenses"
          value={stats.total}
          unit="FCFA"
          color="red"
        />
        <KPICard
          title="Nombre dépenses"
          value={stats.count}
          unit=""
          color="orange"
        />
      </div>

      {/* Catégories overview */}
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Dépenses par catégorie</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.byCategory).map(([category, data]) => (
              <div key={category} className="text-center p-3 border rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">{category}</p>
                <p className="text-lg font-bold text-gray-900">
                  {(data.total / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500">{data.count} dépense(s)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-3 text-gray-400"></i>
              <input
                type="text"
                placeholder="Description, catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tous</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau dépenses */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : filteredDepenses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <i className="ti ti-cash-out text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">Aucune dépense trouvée</p>
          {depenses.length === 0 && (
            <p className="text-gray-400 text-sm mt-2">Total dans la DB: {depenses.length}</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Catégorie</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Montant</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDepenses.map((depense) => (
                <tr key={depense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(depense.date_depense).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(depense.categorie)}`}>
                      {depense.categorie}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                    {(depense.montant / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {depense.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteDepense(depense.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      <i className="ti ti-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulaire */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-96 overflow-y-auto">
            <DepenseForm
              onSubmit={handleCreateDepense}
              onClose={() => setModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
