// frontend/src/pages/Parametres/ParametresPage.jsx

import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/client.js';
import { useParametres } from '../../contexts/ParametresContext.jsx';

export function ParametresPage() {
  const { fetchParametres } = useParametres();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('infos');

  // État initial VIDE - sera rempli par le useEffect
  const [formData, setFormData] = useState({
    nomentreprise: '',
    adresse: '',
    email: '',
    telephone: '',
    siret: '',
    devise: 'FCFA',
    dateformatage: 'DD/MM/YYYY',
    montantlimitedépense: 0,
    joursretardpaiement: 0,
    alerteemail: false,
    alertewhatsapp: false,
    emailsmtp: '',
    emailport: 587,
    emailuser: '',
    emailpassword: '',
    emaildestinatairerapports: '',
    whatsapptoken: '',
    whatsappnumero: '',
    tauxis: 0,
    tauxtva: 0,
    annefiscale: new Date().getFullYear()
  });

  // Charger paramètres
  useEffect(() => {
    const fetchParametres = async () => {
      try {
        const response = await axiosInstance.get('/parametres');
        if (response.data && Object.keys(response.data).length > 0) {
          setFormData(prev => ({ ...prev, ...response.data }));
        }
      } catch (err) {
        console.log('Pas de paramètres trouvés');
      }
    };
    fetchParametres();
  }, []);

  // Sauvegarder
  const handleSave = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/parametres', formData);
      alert('✅ Paramètres sauvegardés avec succès!');
      
      // ✅ RÉACTUALISER LE CONTEXT
      await fetchParametres();
      
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold">⚙️ Paramètres & Configuration</h1>
          <p className="text-red-100 mt-2">Configurez votre application SMI</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('infos')}
            className={`px-6 py-3 font-bold transition border-b-4 ${
              activeTab === 'infos'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-600'
            }`}
          >
            🏢 Infos SMI
          </button>
          <button
            onClick={() => setActiveTab('alertes')}
            className={`px-6 py-3 font-bold transition border-b-4 ${
              activeTab === 'alertes'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-600'
            }`}
          >
            🚨 Alertes
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-6 py-3 font-bold transition border-b-4 ${
              activeTab === 'emails'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-600'
            }`}
          >
            📧 Emails
          </button>
          <button
            onClick={() => setActiveTab('fiscalite')}
            className={`px-6 py-3 font-bold transition border-b-4 ${
              activeTab === 'fiscalite'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-600'
            }`}
          >
            💰 Fiscalité
          </button>
        </div>

        {/* TAB: INFOS SMI */}
        {activeTab === 'infos' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏢 Informations Entreprise</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="nomentreprise"
                  value={formData.nomentreprise}
                  onChange={handleChange}
                  placeholder="Nom"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
                <input
                  type="text"
                  name="siret"
                  value={formData.siret}
                  onChange={handleChange}
                  placeholder="SIRET"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                placeholder="Adresse"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
                <input
                  type="text"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: ALERTES */}
        {activeTab === 'alertes' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🚨 Paramètres Alertes</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Montant Limite Dépense (FCFA)</label>
                  <input
                    type="number"
                    name="montantlimitedépense"
                    value={formData.montantlimitedépense}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Jours Retard Paiement</label>
                  <input
                    type="number"
                    name="joursretardpaiement"
                    value={formData.joursretardpaiement}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="alerteemail"
                  checked={formData.alerteemail}
                  onChange={handleChange}
                />
                📧 Alertes par Email
              </label>
            </div>
          </div>
        )}

        {/* TAB: EMAILS */}
        {activeTab === 'emails' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📧 Configuration Emails</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="emailsmtp"
                  value={formData.emailsmtp}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
                <input
                  type="number"
                  name="emailport"
                  value={formData.emailport}
                  onChange={handleChange}
                  placeholder="587"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  name="emailuser"
                  value={formData.emailuser}
                  onChange={handleChange}
                  placeholder="votre-email@gmail.com"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
                <input
                  type="password"
                  name="emailpassword"
                  value={formData.emailpassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: FISCALITÉ */}
        {activeTab === 'fiscalite' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Paramètres Fiscalité</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Taux TVA (%)</label>
                <input
                  type="number"
                  name="tauxtva"
                  value={formData.tauxtva}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Taux IS (%)</label>
                <input
                  type="number"
                  name="tauxis"
                  value={formData.tauxis}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Année Fiscale</label>
                <input
                  type="number"
                  name="annefiscale"
                  value={formData.annefiscale}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sauvegarder */}
        <div className="mt-8">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 disabled:bg-gray-400"
          >
            {loading ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}