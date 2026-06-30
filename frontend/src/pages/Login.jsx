// frontend/src/pages/Login.jsx - VERSION MODERNE

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const loading = useAuthStore(s => s.loading);
  const error = useAuthStore(s => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Côté gauche : Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-700 via-red-800 to-red-900 text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/logo-smi.jpeg" 
            alt="SMI" 
            className="h-20 w-20 rounded-xl bg-white/10 backdrop-blur p-2 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h1 className="text-4xl font-bold">SMI</h1>
            <p className="text-red-200 text-sm">Sénégal Multiservices International</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Gérez votre entreprise<br />en toute simplicité
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <span className="text-red-100">Tableau de bord en temps réel</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏢</span>
              <span className="text-red-100">Gestion multi-filiales</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <span className="text-red-100">Alertes automatiques</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <span className="text-red-100">Rapports PDF & Excel</span>
            </div>
          </div>
        </div>

        <div className="text-red-300 text-sm">
          © 2026 SMI — Dakar, Sénégal
        </div>
      </div>

      {/* Côté droit : Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/logo-smi.jpeg" 
              alt="SMI" 
              className="h-20 w-20 mx-auto rounded-xl object-contain mb-3"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h1 className="text-3xl font-bold text-red-700">SMI</h1>
            <p className="text-gray-600 mt-1 text-sm">Sénégal Multiservices International</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenue 👋</h2>
            <p className="text-gray-500 mt-1"> Connexion requise. Veuillez vous connecter. </p>

            {error && (
              <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                <div className="flex items-center gap-2">
                  <span>❌</span>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition outline-none"
                  placeholder="admin@smi.sn"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔒 Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-700 to-red-800 text-white font-bold py-3 rounded-xl hover:from-red-800 hover:to-red-900 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Connexion...
                  </span>
                ) : '🔐 Se connecter'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              SMI v1.0.0 — Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}