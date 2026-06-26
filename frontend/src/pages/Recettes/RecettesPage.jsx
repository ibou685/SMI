// frontend/src/pages/Recettes/RecettesPage.jsx
// Page gestion des recettes - VERSION SIMPLE

import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/client'; 
import { KPICard } from '../../components/KPICard';
import { RecetteForm } from './RecetteForm';

export function RecettesPage() {
  const [recettes, setRecettes] = useState([]);
  const [filiales, setFiliales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filialeFilter, setFilialeFilter] = useState(null);
  const [stats, setStats] = useState({ total: 0, count: 0, moyenne: 0 });

  // Charger les recettes
  useEffect(() => {
    const fetchRecettes = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/recettes');
        console.log('Recettes reçues:', response.data);
        setRecettes(response.data || []);

        // Calculer stats
        const total = (response.data || []).reduce((sum, r) => sum + r.montant, 0);
        const count = response.data?.length || 0;
        const moyenne = count > 0 ? total / count : 0;

        setStats({ total, count, moyenne });
      } catch (err) {
        console.error('Erreur recettes:', err);
        alert(`Erreur: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecettes();
  }, []);

  // Charger les filiales
  useEffect(() => {
    const fetchFiliales = async () => {
      try {
        const response = await axiosInstance.get('/filiales');
        console.log('Filiales reçues:', response.data);
        setFiliales(response.data || []);
      } catch (err) {
        console.error('Erreur filiales:', err);
      }
    };

    fetchFiliales();
  }, []);

  const handleCreateRecette = async (data) => {
    try {
      const response = await axiosInstance.post('/recettes', data);
      setRecettes([response.data, ...recettes]);
      setModalOpen(false);
      alert(`✅ Versement de ${(response.data.montant / 1000000).toFixed(1)}M FCFA enregistré`);
    } catch (err) {
      alert(`❌ Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteRecette = async (id) => {
    if (!window.confirm('Êtes-vous sûr?')) return;

    try {
      await axiosInstance.delete(`/recettes/${id}`);
      setRecettes(recettes.filter((r) => r.id !== id));
      alert('✅ Versement supprimé');
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  const getFilialeName = (filialeId) => {
    const filiale = filiales.find((f) => f.id === filialeId);
    return filiale?.nom || 'N/A';
  };

  const filteredRecettes = recettes.filter((r) => {
    const term = searchTerm.toLowerCase();
    const filiale = filiales.find((f) => f.id === r.filiale_id);
    return (
      (filiale?.nom?.toLowerCase().includes(term) ||
        filiale?.code?.toLowerCase().includes(term) ||
        r.reference_paiement?.toLowerCase().includes(term)) &&
      (!filialeFilter || r.filiale_id === filialeFilter)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recettes</h1>
          <p className="text-gray-600">Gestion des versements des filiales</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <i className="ti ti-plus"></i>
          Nouveau Versement
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KPICard title="Total recettes" value={stats.total} unit="FCFA" color="green" />
        <KPICard title="Nombre versements" value={stats.count} unit="" color="blue" />
        <KPICard title="Moyenne versement" value={stats.moyenne} unit="FCFA" color="purple" />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              placeholder="Filiale, référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filiale</label>
            <select
              value={filialeFilter || ''}
              onChange={(e) => setFilialeFilter(e.target.value || null)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Tous</option>
              {filiales.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau recettes */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredRecettes.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <i className="ti ti-cash-in text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">Aucune recette trouvée</p>
          {recettes.length === 0 && (
            <p className="text-gray-400 text-sm mt-2">Total dans la DB: {recettes.length}</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Filiale</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Montant</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Référence</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mode</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecettes.map((recette) => (
                <tr key={recette.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(recette.date_versement).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {getFilialeName(recette.filiale_id)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">
                    {(recette.montant / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {recette.reference_paiement || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {recette.mode_paiement || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteRecette(recette.id)}
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
            <RecetteForm
              filiales={filiales}
              onSubmit={handleCreateRecette}
              onClose={() => setModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
