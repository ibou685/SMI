// frontend/src/pages/Rapports/RapportsPage.jsx - VERSION UX COMPLÈTE

import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/client.js';
import { toast } from '../../store/toastStore';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';

export function RapportsPage() {
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);  // ✅ Loader initial
  const [filiales, setFiliales] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [recettes, setRecettes] = useState([]);
  const [depenses, setDepenses] = useState([]);

  // Filtres
  const [typeRapport, setTypeRapport] = useState('complet');
  const [filialeSelectionnee, setFilialeSelectionnee] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [montantMin, setMontantMin] = useState('');
  const [montantMax, setMontantMax] = useState('');

  // ✅ Charger données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filialesRes, domainesRes, recettesRes, depensesRes] = await Promise.all([
          axiosInstance.get('/filiales/with-details'),
          axiosInstance.get('/domaines'),
          axiosInstance.get('/recettes'),
          axiosInstance.get('/depenses')
        ]);

        setFiliales(filialesRes.data || []);
        setDomaines(domainesRes.data || []);
        setRecettes(recettesRes.data || []);
        setDepenses(depensesRes.data || []);
      } catch (err) {
        console.error('Erreur chargement:', err);
        toast.error(`Erreur de chargement: ${err.message}`);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchData();
  }, []);

  // Format montant
  const formatMontant = (n) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(n);
  };

  // Filtrer données
  const filtrerDonnees = (donnees) => {
    return donnees.filter(item => {
      if (dateDebut && new Date(item.created_at) < new Date(dateDebut)) return false;
      if (dateFin && new Date(item.created_at) > new Date(dateFin)) return false;
      if (montantMin && item.montant < parseFloat(montantMin)) return false;
      if (montantMax && item.montant > parseFloat(montantMax)) return false;
      if (filialeSelectionnee && item.filiale_id !== filialeSelectionnee) return false;
      return true;
    });
  };

  // ✅ Générer rapport PDF
  const generateRapport = async () => {
    try {
      setLoading(true);

      if (typeRapport === 'filiale' && !filialeSelectionnee) {
        toast.warning('Veuillez sélectionner une filiale');
        return;
      }

      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);
      if (filialeSelectionnee) params.append('filialeId', filialeSelectionnee);
      if (montantMin) params.append('montantMin', montantMin);
      if (montantMax) params.append('montantMax', montantMax);

      let url = '';
      switch (typeRapport) {
        case 'recettes':
          url = `/rapports/recettes-pdf?${params.toString()}`;
          break;
        case 'depenses':
          url = `/rapports/depenses-pdf?${params.toString()}`;
          break;
        case 'bilan':
          url = `/rapports/bilan-pdf?${params.toString()}`;
          break;
        case 'filiale':
          url = `/rapports/par-filiale-pdf?${params.toString()}`;
          break;
        case 'complet':
        default:
          url = `/rapports/complet-pdf?${params.toString()}`;
          break;
      }

      const response = await axiosInstance.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `rapport-${typeRapport}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);  // ✅ Libérer la mémoire

      toast.success('Rapport PDF généré et téléchargé');
    } catch (err) {
      console.error('Erreur PDF:', err);
      toast.error(`Erreur: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Exporter Excel
  const exportExcel = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);
      if (filialeSelectionnee) params.append('filialeId', filialeSelectionnee);

      let url = '';
      switch (typeRapport) {
        case 'filiale':
          url = `/rapports/filiales-excel?${params.toString()}`;
          break;
        case 'bilan':
          url = `/rapports/bilan-excel?${params.toString()}`;
          break;
        case 'recettes':
          url = `/rapports/recettes-excel?${params.toString()}`;
          break;
        case 'complet':
          url = `/rapports/complet-excel?${params.toString()}`;
          break;
        case 'gerants':
          url = `/rapports/gerants-excel?${params.toString()}`;
          break;
        case 'depenses':
        default:
          url = `/rapports/depenses-excel?${params.toString()}`;
          break;
      }

      const response = await axiosInstance.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `rapport-${typeRapport}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Rapport Excel généré et téléchargé');
    } catch (err) {
      console.error('Erreur Excel:', err);
      toast.error(`Erreur: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Aperçu rapport
  const getApercu = () => {
    let titre = '';
    let donnees = [];

    switch (typeRapport) {
      case 'recettes':
        titre = '💰 Aperçu Recettes';
        donnees = filtrerDonnees(recettes);
        break;
      case 'depenses':
        titre = '📉 Aperçu Dépenses';
        donnees = filtrerDonnees(depenses);
        break;
      case 'filiale':
        titre = '🏢 Aperçu Filiale';
        if (filialeSelectionnee) {
          const filiale = filiales.find(f => f.id === filialeSelectionnee);
          donnees = filiale ? [filiale] : [];
        }
        break;
      case 'complet':
      default:
        titre = '📊 Aperçu Complet';
        donnees = filiales;
        break;
    }

    return { titre, donnees };
  };

  const { titre: apersuTitre, donnees: apersuDonnees } = getApercu();

  // ✅ Types de rapports
  const typesRapports = [
    { value: 'complet', label: '📊 Complet' },
    { value: 'recettes', label: '💰 Recettes' },
    { value: 'depenses', label: '📉 Dépenses' },
    { value: 'bilan', label: '📈 Bilan' },
    { value: 'filiale', label: '🏢 Filiale' },
    { value: 'gerants', label: '👥 Gérants' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold">📋 Rapports Avancés</h1>
          <p className="text-red-100 mt-2">Générez des rapports détaillés en PDF ou Excel</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loadingInitial ? (
          <Spinner size="lg" label="Chargement des données..." />
        ) : (
          <>
            {/* Section Filtres */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Filtres & Options</h2>

              <div className="space-y-6">
                {/* Type de rapport */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Type de Rapport</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {typesRapports.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setTypeRapport(type.value)}
                        className={`px-4 py-3 rounded-lg font-semibold text-sm transition ${
                          typeRapport === type.value
                            ? 'bg-red-700 text-white'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sélection filiale si nécessaire */}
                {(typeRapport === 'filiale' || typeRapport === 'recettes') && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Filiale (optionnel)</label>
                    <select
                      value={filialeSelectionnee}
                      onChange={(e) => setFilialeSelectionnee(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                    >
                      <option value="">Toutes les filiales</option>
                      {filiales.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.nom} ({f.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Période */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Date Début</label>
                    <input
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Date Fin</label>
                    <input
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Montants min/max */}
                {(typeRapport === 'recettes' || typeRapport === 'depenses') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Montant Min (FCFA)</label>
                      <input
                        type="number"
                        value={montantMin}
                        onChange={(e) => setMontantMin(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-3">Montant Max (FCFA)</label>
                      <input
                        type="number"
                        value={montantMax}
                        onChange={(e) => setMontantMax(e.target.value)}
                        placeholder="Illimité"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Boutons d'export */}
                <div className="flex gap-4 pt-4 border-t-2">
                  <button
                    onClick={generateRapport}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Génération...
                      </>
                    ) : '📄 Générer PDF'}
                  </button>
                  <button
                    onClick={exportExcel}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Génération...
                      </>
                    ) : '📊 Exporter Excel'}
                  </button>
                </div>
              </div>
            </div>

            {/* Section Aperçu */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{apersuTitre}</h2>

              {apersuDonnees.length === 0 ? (
                <EmptyState
                  icon="📊"
                  title="Aucune donnée à afficher"
                  message="Modifiez vos filtres ou ajoutez des données dans le système pour générer un rapport."
                />
              ) : (
                <div className="overflow-x-auto">
                  {typeRapport === 'filiale' && apersuDonnees[0] ? (
                    /* Détail filiale */
                    <div className="space-y-6">
                      <div className="border-b-2 pb-4">
                        <h3 className="text-xl font-bold text-gray-900">{apersuDonnees[0].nom}</h3>
                        <p className="text-gray-600">Code: {apersuDonnees[0].code}</p>
                      </div>

                      {/* Gérants */}
                      {apersuDonnees[0].gerants?.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-3">👥 Gérants</h4>
                          <div className="space-y-2">
                            {apersuDonnees[0].gerants.map(g => (
                              <div key={g.id} className="p-3 bg-gray-50 rounded">
                                <p className="font-semibold">{g.nom_complet || `${g.prenom} ${g.nom}`}</p>
                                <p className="text-sm text-gray-600">{g.poste}</p>
                                {g.email && <p className="text-sm text-gray-600">📧 {g.email}</p>}
                                {g.telephone && <p className="text-sm text-gray-600">📞 {g.telephone}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t-2">
                        <div className="text-center p-4 bg-green-50 rounded">
                          <p className="text-sm text-gray-600">Recettes</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatMontant(
                              recettes
                                .filter(r => r.filiale_id === apersuDonnees[0].id)
                                .reduce((sum, r) => sum + (r.montant || 0), 0)
                            )}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded">
                          <p className="text-sm text-gray-600">Dépenses</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatMontant(
                              depenses
                                .filter(d => d.filiale_id === apersuDonnees[0].id)
                                .reduce((sum, d) => sum + (d.montant || 0), 0)
                            )}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded">
                          <p className="text-sm text-gray-600">Solde</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatMontant(
                              recettes
                                .filter(r => r.filiale_id === apersuDonnees[0].id)
                                .reduce((sum, r) => sum + (r.montant || 0), 0) -
                              depenses
                                .filter(d => d.filiale_id === apersuDonnees[0].id)
                                .reduce((sum, d) => sum + (d.montant || 0), 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tableau générique */
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 bg-gray-100">
                          <th className="px-4 py-3 text-left font-bold text-gray-900">Filiale</th>
                          {typeRapport !== 'filiale' && (
                            <>
                              <th className="px-4 py-3 text-right font-bold text-gray-900">Recettes</th>
                              <th className="px-4 py-3 text-right font-bold text-gray-900">Dépenses</th>
                              <th className="px-4 py-3 text-right font-bold text-gray-900">Solde</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {apersuDonnees.map(item => {
                          if (!item || typeof item !== 'object') return null;

                          const rec = recettes
                            .filter(r => r.filiale_id === item.id)
                            .reduce((sum, r) => sum + (r.montant || 0), 0);
                          const dep = depenses
                            .filter(d => d.filiale_id === item.id)
                            .reduce((sum, d) => sum + (d.montant || 0), 0);
                          const solde = rec - dep;

                          return (
                            <tr key={item.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{item.nom || 'N/A'}</td>
                              {typeRapport !== 'filiale' && (
                                <>
                                  <td className="px-4 py-3 text-right text-green-600 font-semibold">
                                    {formatMontant(rec)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                                    {formatMontant(dep)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold" style={{ color: solde >= 0 ? '#10B981' : '#EF4444' }}>
                                    {formatMontant(solde)}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}