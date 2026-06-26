// frontend/src/pages/Filiales/FillialesPage.jsx
// Page de gestion des filiales, domaines et gérants

import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/client';

export function FillialesPage() {
  const [filiales, setFiliales] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('filiales'); // filiales, domaines
  const [showAddFilialeModal, setShowAddFilialeModal] = useState(false);
  const [showAddDomaineModal, setShowAddDomaineModal] = useState(false);
  const [editingFiliale, setEditingFiliale] = useState(null);
  const [editingDomaine, setEditingDomaine] = useState(null);

  // État formulaire filiale
  const [formFiliale, setFormFiliale] = useState({
    code: '',
    nom: '',
    adresse: '',
    ville: '',
    region: '',
    telephone: '',
    email: '',
    domaine_id: '',
    activite_principale: '',
    statut: 'Active',
    gerants: []
  });

  // État formulaire domaine
  const [formDomaine, setFormDomaine] = useState({
    nom: '',
    code: '',
    description: ''
  });

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [filialesRes, domainesRes] = await Promise.all([
          axiosInstance.get('/filiales/with-details'),
          axiosInstance.get('/domaines')
        ]);
        setFiliales(filialesRes.data || []);
        setDomaines(domainesRes.data || []);
      } catch (err) {
        console.error('Erreur chargement:', err);
        alert(`❌ Erreur: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Ajouter/Modifier filiale
  const handleSaveFiliale = async () => {
    try {
      if (!formFiliale.code || !formFiliale.nom || !formFiliale.ville) {
        alert('❌ Remplissez au moins: Code, Nom, Ville');
        return;
      }

      if (editingFiliale) {
        const response = await axiosInstance.put(
          `/filiales/${editingFiliale.id}/complete`,
          formFiliale
        );
        setFiliales(filiales.map(f => f.id === editingFiliale.id ? response.data : f));
        alert('✅ Filiale modifiée');
      } else {
        const response = await axiosInstance.post('/filiales/with-gerants', formFiliale);
        setFiliales([...filiales, response.data]);
        alert('✅ Filiale créée');
      }

      resetFormFiliale();
      setShowAddFilialeModal(false);
      setEditingFiliale(null);
    } catch (err) {
      alert(`❌ Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  // Ajouter/Modifier domaine
  const handleSaveDomaine = async () => {
    try {
      if (!formDomaine.nom) {
        alert('❌ Le nom du domaine est requis');
        return;
      }

      if (editingDomaine) {
        const response = await axiosInstance.put(
          `/domaines/${editingDomaine.id}`,
          formDomaine
        );
        setDomaines(domaines.map(d => d.id === editingDomaine.id ? response.data : d));
        alert('✅ Domaine modifié');
      } else {
        const response = await axiosInstance.post('/domaines', formDomaine);
        setDomaines([...domaines, response.data]);
        alert('✅ Domaine créé');
      }

      resetFormDomaine();
      setShowAddDomaineModal(false);
      setEditingDomaine(null);
    } catch (err) {
      alert(`❌ Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  // Supprimer filiale
  const handleDeleteFiliale = async (id) => {
    if (!window.confirm('Êtes-vous sûr? Les gérants seront aussi supprimés.')) return;

    try {
      await axiosInstance.delete(`/filiales/${id}`);
      setFiliales(filiales.filter(f => f.id !== id));
      alert('✅ Filiale supprimée');
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  // Supprimer domaine
  const handleDeleteDomaine = async (id) => {
    if (!window.confirm('Êtes-vous sûr?')) return;

    try {
      await axiosInstance.delete(`/domaines/${id}`);
      setDomaines(domaines.filter(d => d.id !== id));
      alert('✅ Domaine supprimé');
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  // Éditer filiale
  const handleEditFiliale = (filiale) => {
    setFormFiliale({
      code: filiale.code,
      nom: filiale.nom,
      adresse: filiale.adresse || '',
      ville: filiale.ville,
      region: filiale.region || '',
      telephone: filiale.telephone || '',
      email: filiale.email || '',
      domaine_id: filiale.domaine_id || '',
      activite_principale: filiale.activite_principale || '',
      statut: filiale.statut,
      gerants: filiale.gerants || []
    });
    setEditingFiliale(filiale);
    setShowAddFilialeModal(true);
  };

  // Ajouter gérant au formulaire
  const addGerant = () => {
    setFormFiliale({
      ...formFiliale,
      gerants: [...formFiliale.gerants, { nom: '', prenom: '', email: '', telephone: '', poste: '' }]
    });
  };

  // Mettre à jour gérant
  const updateGerant = (index, field, value) => {
    const newGerants = [...formFiliale.gerants];
    newGerants[index] = { ...newGerants[index], [field]: value };
    setFormFiliale({ ...formFiliale, gerants: newGerants });
  };

  // Supprimer gérant du formulaire
  const removeGerant = (index) => {
    setFormFiliale({
      ...formFiliale,
      gerants: formFiliale.gerants.filter((_, i) => i !== index)
    });
  };

  const resetFormFiliale = () => {
    setFormFiliale({
      code: '',
      nom: '',
      adresse: '',
      ville: '',
      region: '',
      telephone: '',
      email: '',
      domaine_id: '',
      activite_principale: '',
      statut: 'Active',
      gerants: []
    });
  };

  const resetFormDomaine = () => {
    setFormDomaine({ nom: '', code: '', description: '' });
  };

  // Grouper filiales par domaine
  const filialesParDomaine = filiales.reduce((acc, filiale) => {
    const domaineName = filiale.domaines_activite?.nom || 'Sans domaine';
    if (!acc[domaineName]) acc[domaineName] = [];
    acc[domaineName].push(filiale);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold">Gestion des Filiales</h1>
          <p className="text-red-100 mt-2">Filiales, domaines d'activité et gérants</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('filiales')}
            className={`px-6 py-3 font-bold transition border-b-4 ${
              activeTab === 'filiales'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📍 Filiales
          </button>
          <button
            onClick={() => setActiveTab('domaines')}
            className={`px-6 py-3 font-bold transition border-b-4 ${
              activeTab === 'domaines'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🏢 Domaines d'Activité
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-700 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* TAB: FILIALES */}
            {activeTab === 'filiales' && (
              <>
                <div className="mb-6">
                  <button
                    onClick={() => {
                      resetFormFiliale();
                      setEditingFiliale(null);
                      setShowAddFilialeModal(true);
                    }}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition flex items-center gap-2"
                  >
                    <i className="ti ti-plus"></i>
                    Nouvelle Filiale
                  </button>
                </div>

                {Object.entries(filialesParDomaine).map(([domaineName, filsOfDomain]) => (
                  <div key={domaineName} className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 p-3 bg-gray-200 rounded-lg">
                      {domaineName} ({filsOfDomain.length})
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filsOfDomain.map((filiale) => (
                        <div key={filiale.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-700">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">{filiale.nom}</h4>
                              <p className="text-sm text-gray-600">{filiale.code}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded ${
                              filiale.statut === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {filiale.statut}
                            </span>
                          </div>

                          <div className="text-sm text-gray-700 mb-4 space-y-1">
                            <p><strong>Ville:</strong> {filiale.ville}</p>
                            {filiale.telephone && <p><strong>Tél:</strong> {filiale.telephone}</p>}
                            {filiale.email && <p><strong>Email:</strong> {filiale.email}</p>}
                          </div>

                          {/* Gérants */}
                          {filiale.gerants?.length > 0 && (
                            <div className="mb-4 p-3 bg-gray-50 rounded border-l-2 border-red-700">
                              <p className="font-semibold text-sm text-gray-900 mb-2">Gérants:</p>
                              {filiale.gerants.map((gerant) => (
                                <p key={gerant.id} className="text-xs text-gray-700">
                                  • {gerant.prenom} {gerant.nom} {gerant.poste ? `(${gerant.poste})` : ''}
                                </p>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditFiliale(filiale)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                            >
                              <i className="ti ti-edit mr-1"></i>Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteFiliale(filiale.id)}
                              className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                            >
                              <i className="ti ti-trash mr-1"></i>Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* TAB: DOMAINES */}
            {activeTab === 'domaines' && (
              <>
                <div className="mb-6">
                  <button
                    onClick={() => {
                      resetFormDomaine();
                      setEditingDomaine(null);
                      setShowAddDomaineModal(true);
                    }}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition flex items-center gap-2"
                  >
                    <i className="ti ti-plus"></i>
                    Nouveau Domaine
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {domaines.map((domaine) => (
                    <div key={domaine.id} className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-700">
                      <h4 className="text-lg font-bold text-gray-900">{domaine.nom}</h4>
                      <p className="text-sm text-gray-600 mb-3">{domaine.code}</p>
                      {domaine.description && (
                        <p className="text-sm text-gray-700 mb-4">{domaine.description}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setFormDomaine(domaine);
                            setEditingDomaine(domaine);
                            setShowAddDomaineModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteDomaine(domaine.id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* MODAL: Ajouter/Modifier Filiale */}
      {showAddFilialeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingFiliale ? 'Modifier Filiale' : 'Nouvelle Filiale'}
            </h2>

            <div className="space-y-6">
              {/* Section: Informations principales */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b">📍 Informations principales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Code *"
                    value={formFiliale.code}
                    onChange={(e) => setFormFiliale({ ...formFiliale, code: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Nom *"
                    value={formFiliale.nom}
                    onChange={(e) => setFormFiliale({ ...formFiliale, nom: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={formFiliale.adresse}
                    onChange={(e) => setFormFiliale({ ...formFiliale, adresse: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Ville *"
                    value={formFiliale.ville}
                    onChange={(e) => setFormFiliale({ ...formFiliale, ville: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Région"
                    value={formFiliale.region}
                    onChange={(e) => setFormFiliale({ ...formFiliale, region: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                  <select
                    value={formFiliale.domaine_id}
                    onChange={(e) => setFormFiliale({ ...formFiliale, domaine_id: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  >
                    <option value="">Domaine d'activité</option>
                    {domaines.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section: Contact */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b">📞 Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Téléphone"
                    value={formFiliale.telephone}
                    onChange={(e) => setFormFiliale({ ...formFiliale, telephone: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formFiliale.email}
                    onChange={(e) => setFormFiliale({ ...formFiliale, email: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Activité principale"
                    value={formFiliale.activite_principale}
                    onChange={(e) => setFormFiliale({ ...formFiliale, activite_principale: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none col-span-2"
                  />
                </div>
              </div>

              {/* Section: Statut */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b">⚙️ Statut</h3>
                <select
                  value={formFiliale.statut}
                  onChange={(e) => setFormFiliale({ ...formFiliale, statut: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspendue">Suspendue</option>
                </select>
              </div>

              {/* Section: Gérants */}
              <div>
                <div className="flex justify-between items-center mb-3 pb-2 border-b">
                  <h3 className="font-bold text-gray-900">👥 Gérants</h3>
                  <button
                    onClick={addGerant}
                    className="text-sm px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 transition"
                  >
                    + Ajouter gérant
                  </button>
                </div>

                {formFiliale.gerants.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">Aucun gérant ajouté</p>
                ) : (
                  formFiliale.gerants.map((gerant, idx) => (
                    <div key={idx} className="mb-4 p-4 bg-gray-50 rounded border-l-4 border-red-700">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Prénom *"
                          value={gerant.prenom || ''}
                          onChange={(e) => updateGerant(idx, 'prenom', e.target.value)}
                          className="px-2 py-2 text-sm border rounded focus:ring-2 focus:ring-red-700 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Nom *"
                          value={gerant.nom || ''}
                          onChange={(e) => updateGerant(idx, 'nom', e.target.value)}
                          className="px-2 py-2 text-sm border rounded focus:ring-2 focus:ring-red-700 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Poste"
                          value={gerant.poste || ''}
                          onChange={(e) => updateGerant(idx, 'poste', e.target.value)}
                          className="px-2 py-2 text-sm border rounded focus:ring-2 focus:ring-red-700 outline-none"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={gerant.email || ''}
                          onChange={(e) => updateGerant(idx, 'email', e.target.value)}
                          className="px-2 py-2 text-sm border rounded focus:ring-2 focus:ring-red-700 outline-none"
                        />
                        <input
                          type="tel"
                          placeholder="Téléphone"
                          value={gerant.telephone || ''}
                          onChange={(e) => updateGerant(idx, 'telephone', e.target.value)}
                          className="px-2 py-2 text-sm border rounded focus:ring-2 focus:ring-red-700 outline-none"
                        />
                        <input
                          type="date"
                          placeholder="Date d'embauche"
                          value={gerant.date_embauche || ''}
                          onChange={(e) => updateGerant(idx, 'date_embauche', e.target.value)}
                          className="px-2 py-2 text-sm border rounded focus:ring-2 focus:ring-red-700 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => removeGerant(idx)}
                        className="w-full text-sm px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      >
                        Supprimer ce gérant
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 mt-8 pt-4 border-t">
              <button
                onClick={() => setShowAddFilialeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveFiliale}
                className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ajouter/Modifier Domaine */}
      {showAddDomaineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {editingDomaine ? 'Modifier Domaine' : 'Nouveau Domaine'}
            </h2>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Nom du domaine"
                value={formDomaine.nom}
                onChange={(e) => setFormDomaine({ ...formDomaine, nom: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
              />
              <input
                type="text"
                placeholder="Code"
                value={formDomaine.code}
                onChange={(e) => setFormDomaine({ ...formDomaine, code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
              />
              <textarea
                placeholder="Description"
                value={formDomaine.description}
                onChange={(e) => setFormDomaine({ ...formDomaine, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddDomaineModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveDomaine}
                className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}