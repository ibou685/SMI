// frontend/src/pages/Recettes/RecettesPage.jsx - VERSION UX COMPLÈTE

import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/client';
import { KPICard } from '../../components/KPICard';
import { RecetteForm } from './RecetteForm';
import { toast } from '../../store/toastStore';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export function RecettesPage() {
  const [recettes, setRecettes] = useState([]);
  const [filiales, setFiliales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filialeFilter, setFilialeFilter] = useState(null);
  const [stats, setStats] = useState({ total: 0, count: 0, moyenne: 0 });
  const [confirmDelete, setConfirmDelete] = useState(null);  // ✅ ConfirmDialog

  // ✅ Charger recettes + filiales en parallèle
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [recettesRes, filialesRes] = await Promise.all([
          axiosInstance.get('/recettes'),
          axiosInstance.get('/filiales')
        ]);

        setRecettes(recettesRes.data || []);
        setFiliales(filialesRes.data || []);

        // Stats
        const total = (recettesRes.data || []).reduce((sum, r) => sum + r.montant, 0);
        const count = recettesRes.data?.length || 0;
        const moyenne = count > 0 ? total / count : 0;
        setStats({ total, count, moyenne });
      } catch (err) {
        console.error('Erreur chargement:', err);
        toast.error(`Erreur de chargement: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ✅ Créer une recette
  const handleCreateRecette = async (data) => {
    try {
      const response = await axiosInstance.post('/recettes', data);
      setRecettes([response.data.recette || response.data, ...recettes]);
      setModalOpen(false);

      // ✅ Recalculer les stats localement
      const newCount = stats.count + 1;
      const newTotal = stats.total + (data.montant || 0);
      setStats({
        total: newTotal,
        count: newCount,
        moyenne: newCount > 0 ? newTotal / newCount : 0
      });

      toast.success(`Versement de ${(data.montant / 1000000).toFixed(1)}M FCFA enregistré`);
    } catch (err) {
      toast.error(`Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  // ✅ Ouvrir confirmation suppression
  const handleDeleteClick = (id) => setConfirmDelete(id);

  // ✅ Confirmer suppression
  const handleConfirmDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);

    try {
      await axiosInstance.delete(`/recettes/${id}`);
      const recetteSupprimee = recettes.find(r => r.id === id);
      setRecettes(recettes.filter(r => r.id !== id));

      // ✅ Recalculer les stats localement
      const newCount = stats.count - 1;
      const newTotal = stats.total - (recetteSupprimee?.montant || 0);
      setStats({
        total: newTotal,
        count: newCount,
        moyenne: newCount > 0 ? newTotal / newCount : 0
      });

      toast.success('Versement supprimé');
    } catch (err) {
      toast.error(`Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  const getFilialeName = (filialeId) => {
    const filiale = filiales.find((f) => f.id === filialeId);
    return filiale?.nom || 'N/A';
  };

  // ✅ Formatage montant propre
  const formatMontant = (n) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
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
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-3 text-gray-400"></i>
              <input
                type="text"
                placeholder="Filiale, référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filiale</label>
            <select
              value={filialeFilter || ''}
              onChange={(e) => setFilialeFilter(e.target.value || null)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Toutes</option>
              {filiales.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <Spinner size="lg" label="Chargement des recettes..." />
      ) : recettes.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Aucun versement"
          message="Vous n'avez pas encore enregistré de versement. Cliquez sur le bouton pour en ajouter un."
          action={
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              + Ajouter un versement
            </button>
          }
        />
      ) : filteredRecettes.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Aucun résultat"
          message="Aucune recette ne correspond à vos critères de recherche."
        />
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
                    {formatMontant(recette.montant)} FCFA
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {recette.reference_paiement || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {recette.mode_paiement || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteClick(recette.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Supprimer"
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

      {/* ✅ ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Supprimer le versement"
        message="Êtes-vous sûr de vouloir supprimer ce versement ? Cette action est irréversible."
        confirmText="🗑️ Supprimer"
        cancelText="Annuler"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}