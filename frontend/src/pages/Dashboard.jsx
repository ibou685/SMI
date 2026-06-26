// frontend/src/pages/Dashboard.jsx
// Dashboard PRO avancé avec KPIs, graphiques, alertes et tendances

import { useEffect, useState } from 'react';
import { axiosInstance } from '../api/client.js';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [filiales, setFiliales] = useState([]);
  const [recettes, setRecettes] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [period, setPeriod] = useState(30); // jours

  // Couleurs SMI
  const colors = {
    red: '#C41E3A',
    darkRed: '#8B1538',
    black: '#1F2937',
    white: '#FFFFFF',
    green: '#10B981',
    orange: '#F59E0B',
    blue: '#3B82F6'
  };

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [filialesRes, recettesRes, depensesRes, alertesRes] = await Promise.all([
          axiosInstance.get('/filiales/with-details'),
          axiosInstance.get('/recettes'),
          axiosInstance.get('/depenses'),
          axiosInstance.get('/alertes')
        ]);

        setFiliales(filialesRes.data || []);
        setRecettes(recettesRes.data || []);
        setDepenses(depensesRes.data || []);
        setAlertes(alertesRes.data || []);
      } catch (err) {
        console.error('Erreur chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculer les KPIs
  const stats = {
    totalFiliales: filiales.length,
    totalRecettes: recettes.reduce((sum, r) => sum + (r.montant || 0), 0),
    totalDepenses: depenses.reduce((sum, d) => sum + (d.montant || 0), 0),
    alertesActives: alertes.filter(a => a.statut !== 'Résolue').length
  };

  stats.solde = stats.totalRecettes - stats.totalDepenses;

  // Données par filiale
  const donneesParFiliale = filiales.map(filiale => {
    const rec = recettes.filter(r => r.filiale_id === filiale.id).reduce((sum, r) => sum + (r.montant || 0), 0);
    const dep = depenses.filter(d => d.filiale_id === filiale.id).reduce((sum, d) => sum + (d.montant || 0), 0);
    return {
      nom: filiale.nom,
      code: filiale.code,
      recettes: rec,
      depenses: dep,
      solde: rec - dep,
      id: filiale.id
    };
  }).sort((a, b) => b.solde - a.solde);

  // Données par domaine
  const donneesParDomaine = filiales.reduce((acc, filiale) => {
    const domaineName = filiale.domaines_activite?.nom || 'Sans domaine';
    const rec = recettes.filter(r => r.filiale_id === filiale.id).reduce((sum, r) => sum + (r.montant || 0), 0);
    const dep = depenses.filter(d => d.filiale_id === filiale.id).reduce((sum, d) => sum + (d.montant || 0), 0);

    const existing = acc.find(d => d.name === domaineName);
    if (existing) {
      existing.recettes += rec;
      existing.depenses += dep;
    } else {
      acc.push({ name: domaineName, recettes: rec, depenses: dep });
    }
    return acc;
  }, []);

  // Tendances (derniers jours)
  const tendances = Array.from({ length: period }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (period - 1 - i));
    const dateStr = date.toISOString().split('T')[0];

    const rec = recettes
      .filter(r => r.created_at?.startsWith(dateStr))
      .reduce((sum, r) => sum + (r.montant || 0), 0);

    const dep = depenses
      .filter(d => d.created_at?.startsWith(dateStr))
      .reduce((sum, d) => sum + (d.montant || 0), 0);

    return {
      date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      recettes: rec,
      depenses: dep,
      solde: rec - dep
    };
  });

  // Format montant
  const formatMontant = (n) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(n);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-700 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header PRO */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold">📊 Tableau de Bord SMI</h1>
          <p className="text-red-100 mt-2">Vue d'ensemble financière et opérationnelle</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* KPI: Filiales */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Filiales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFiliales}</p>
              </div>
              <div className="text-4xl">🏢</div>
            </div>
          </div>

          {/* KPI: Recettes */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Recettes</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{formatMontant(stats.totalRecettes)}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* KPI: Dépenses */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Dépenses</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{formatMontant(stats.totalDepenses)}</p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </div>

          {/* KPI: Solde */}
          <div className={`bg-white rounded-lg shadow-lg p-6 border-t-4 ${stats.solde >= 0 ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Solde Net</p>
                <p className={`text-2xl font-bold mt-2 ${stats.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMontant(stats.solde)}
                </p>
              </div>
              <div className="text-4xl">{stats.solde >= 0 ? '✅' : '⚠️'}</div>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {stats.alertesActives > 0 && (
          <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-700 rounded-lg">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🚨</span>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg">{stats.alertesActives} Alerte(s) Active(s)</h3>
                <div className="mt-3 space-y-2">
                  {alertes.filter(a => a.statut !== 'Résolue').slice(0, 3).map((alerte) => (
                    <p key={alerte.id} className="text-sm text-red-800">
                      • {alerte.type}: {alerte.message}
                    </p>
                  ))}
                </div>
                <a href="/alertes" className="text-red-700 font-semibold text-sm mt-3 inline-block hover:underline">
                  Voir toutes les alertes →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tendances */}
        <div className="mb-8">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">📈 Tendances ({period} jours)</h2>
            <div className="flex gap-2">
              {[7, 30, 90].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition ${
                    period === p
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {p}j
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendances}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => formatMontant(v)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="recettes"
                  stroke={colors.green}
                  strokeWidth={2}
                  name="Recettes"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="depenses"
                  stroke={colors.orange}
                  strokeWidth={2}
                  name="Dépenses"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphiques côte à côte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recettes vs Dépenses par Domaine */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Recettes vs Dépenses par Domaine</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={donneesParDomaine}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => formatMontant(v)} />
                <Legend />
                <Bar dataKey="recettes" fill={colors.green} name="Recettes" />
                <Bar dataKey="depenses" fill={colors.orange} name="Dépenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Recettes par Domaine */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🥧 Distribution Recettes par Domaine</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donneesParDomaine}
                  dataKey="recettes"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${((entry.recettes / stats.totalRecettes) * 100).toFixed(0)}%`}
                >
                  {donneesParDomaine.map((_, idx) => (
                    <Cell key={idx} fill={[colors.red, colors.blue, colors.green, colors.orange, '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'][idx % 8]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMontant(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classement Filiales */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">🏆 Classement Filiales par Performance</h3>

          {donneesParFiliale.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Aucune filiale disponible</p>
          ) : (
            <div className="space-y-3">
              {donneesParFiliale.map((filiale, idx) => (
                <div
                  key={filiale.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border-l-4"
                  style={{ borderColor: idx === 0 ? colors.red : idx === 1 ? colors.blue : colors.orange }}
                >
                  {/* Rang */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">#{idx + 1}</div>
                  </div>

                  {/* Infos filiale */}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{filiale.nom}</p>
                    <p className="text-sm text-gray-600">{filiale.code}</p>
                  </div>

                  {/* Montants */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Recettes / Dépenses</p>
                    <p className="font-bold text-gray-900">
                      {formatMontant(filiale.recettes)} / {formatMontant(filiale.depenses)}
                    </p>
                  </div>

                  {/* Solde */}
                  <div className="text-right min-w-[150px]">
                    <p className="text-sm text-gray-600">Solde</p>
                    <p className={`text-xl font-bold ${filiale.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMontant(filiale.solde)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats additionnelles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Filiale la plus performante */}
          {donneesParFiliale.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border-l-4 border-green-600">
              <p className="text-green-900 font-semibold text-sm">🌟 Plus Performante</p>
              <p className="text-2xl font-bold text-green-900 mt-2">{donneesParFiliale[0].nom}</p>
              <p className="text-green-700 mt-2">{formatMontant(donneesParFiliale[0].solde)}</p>
            </div>
          )}

          {/* Ratio rentabilité */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <p className="text-blue-900 font-semibold text-sm">📊 Ratio Rentabilité</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {stats.totalRecettes > 0 ? ((stats.totalRecettes / (stats.totalRecettes + stats.totalDepenses)) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-blue-700 mt-2">Recettes / Total</p>
          </div>

          {/* Ticket moyen */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border-l-4 border-purple-600">
            <p className="text-purple-900 font-semibold text-sm">💸 Ticket Moyen</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">
              {formatMontant(recettes.length > 0 ? stats.totalRecettes / recettes.length : 0)}
            </p>
            <p className="text-purple-700 mt-2">Par transaction</p>
          </div>
        </div>
      </div>
    </div>
  );
}