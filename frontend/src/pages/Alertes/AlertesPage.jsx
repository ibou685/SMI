// frontend/src/pages/Alertes/AlertesPage.jsx - VERSION UX COMPLÈTE

import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/client';
import { KPICard } from '../../components/KPICard';
import { useAlertesStore } from '../../store/alertesStore';
import { toast } from '../../store/toastStore';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export function AlertesPage() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  const [confirmResolve, setConfirmResolve] = useState(null);  // ✅ Pour ConfirmDialog
  const [isChecking, setIsChecking] = useState(false);  // ✅ Loader sur bouton "Vérifier"

  // ✅ Store
  const alertes = useAlertesStore(s => s.alertes);
  const stats = useAlertesStore(s => s.stats);
  const isConnected = useAlertesStore(s => s.isConnected);
  const fetchAlertes = useAlertesStore(s => s.fetchAlertes);
  const resolveAlerte = useAlertesStore(s => s.resolveAlerte);

  // ✅ Charger au montage
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAlertes(filter);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Changer de filtre
  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    setLoading(true);
    await fetchAlertes(newFilter);
    setLoading(false);
  };

  // ✅ Vérifier maintenant
  const handleCheckAlertes = async () => {
    try {
      setIsChecking(true);
      console.log('🔍 Clic sur "Vérifier maintenant"');
      const response = await axiosInstance.post('/alertes/verifier');

      // ✅ Toast avec info détaillée
      if (response.data.alertesCreees > 0) {
        toast.success(
          `${response.data.alertesCreees} nouvelle(s) alerte(s) créée(s)\n` +
          `${response.data.alertesDejaExistantes} déjà existante(s)`
        );
      } else {
        toast.info(
          `Aucune nouvelle alerte\n` +
          `${response.data.alertesDejaExistantes} alerte(s) déjà existante(s)`
        );
      }

      // ✅ Re-fetch la DB
      await fetchAlertes(filter);
    } catch (err) {
      console.error('❌ Erreur:', err);
      toast.error(`Erreur: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  // ✅ Rafraîchir
  const handleRefresh = async () => {
    setLoading(true);
    await fetchAlertes(filter);
    setLoading(false);
    toast.info('Liste rafraîchie');
  };

  // ✅ Ouvrir ConfirmDialog pour résoudre
  const handleResolveClick = (id) => {
    setConfirmResolve(id);
  };

  // ✅ Confirmer la résolution
  const handleConfirmResolve = async () => {
    const id = confirmResolve;
    setConfirmResolve(null);

    try {
      await resolveAlerte(id);
      toast.success('Alerte marquée comme résolue');
    } catch (err) {
      toast.error(`Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  // ✅ Helpers
  const getAlertIcon = (type) => {
    switch (type) {
      case 'Retard paiement': return '⏰';
      case 'Dépense inhabituelle': return '💸';
      case 'Baisse recettes': return '📉';
      default: return '⚠️';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'Retard paiement': return 'border-l-4 border-red-500 bg-red-50';
      case 'Dépense inhabituelle': return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'Baisse recettes': return 'border-l-4 border-orange-500 bg-orange-50';
      default: return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleString('fr-FR');
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toLocaleString('fr-FR');
      return d.toLocaleString('fr-FR');
    } catch {
      return new Date().toLocaleString('fr-FR');
    }
  };

  // ✅ Message selon le filtre pour EmptyState
  const getEmptyMessage = () => {
    if (filter === 'Active') {
      return {
        icon: '✅',
        title: 'Aucune alerte active',
        message: "Tout fonctionne correctement ! Aucune anomalie détectée pour le moment."
      };
    }
    if (filter === 'Résolue') {
      return {
        icon: '📋',
        title: 'Aucune alerte résolue',
        message: "Les alertes que vous résolvez apparaîtront ici."
      };
    }
    return {
      icon: '📭',
      title: 'Aucune alerte',
      message: "Le système d'alertes est vide. Cliquez sur 'Vérifier maintenant' pour détecter des anomalies."
    };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertes</h1>
          <p className="text-gray-600">Surveillance des anomalies</p>
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
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <i className="ti ti-refresh"></i>
            Rafraîchir
          </button>
          <button
            onClick={handleCheckAlertes}
            disabled={isChecking}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Vérification...
              </>
            ) : (
              <>
                <i className="ti ti-bell-check"></i>
                Vérifier maintenant
              </>
            )}
          </button>
        </div>
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
            onClick={() => handleFilterChange('Active')}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              filter === 'Active' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Actives ({stats.active})
          </button>
          <button
            onClick={() => handleFilterChange('Résolue')}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              filter === 'Résolue' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Résolues ({stats.resolved})
          </button>
          <button
            onClick={() => handleFilterChange('')}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              filter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes ({stats.total})
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <Spinner size="lg" label="Chargement des alertes..." />
      ) : alertes.length === 0 ? (
        <EmptyState
          icon={getEmptyMessage().icon}
          title={getEmptyMessage().title}
          message={getEmptyMessage().message}
          action={
            filter === 'Active' && (
              <button
                onClick={handleCheckAlertes}
                disabled={isChecking}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                🔍 Vérifier maintenant
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {alertes.map((alerte) => (
            <div
              key={alerte.id}
              className={`p-4 rounded-lg ${getAlertColor(alerte.type)} card-hover`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1">
                  <div className="text-2xl">{getAlertIcon(alerte.type)}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{alerte.titre}</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {alerte.description || alerte.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(alerte.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-semibold">
                    {alerte.type}
                  </span>
                  {alerte.statut === 'Active' && (
                    <button
                      onClick={() => handleResolveClick(alerte.id)}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      ✓ Résoudre
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ ConfirmDialog pour résoudre une alerte */}
      <ConfirmDialog
        isOpen={confirmResolve !== null}
        title="Résoudre l'alerte"
        message="Voulez-vous marquer cette alerte comme résolue ? Elle sera déplacée vers les alertes résolues."
        confirmText="✓ Marquer comme résolue"
        cancelText="Annuler"
        type="info"
        onConfirm={handleConfirmResolve}
        onCancel={() => setConfirmResolve(null)}
      />
    </div>
  );
}