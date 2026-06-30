// frontend/src/App.jsx - VERSION AVEC AUTH

import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'; 
import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useAlertesStore } from './store/alertesStore';
import { ToastContainer } from './components/ToastContainer';
import { InstallPWA } from './components/InstallPWA'; 

// Pages
import { Dashboard } from './pages/Dashboard';
import { FillialesPage } from './pages/Filiales/FillialesPage';
import { RecettesPage } from './pages/Recettes/RecettesPage';
import { ParametresPage } from './pages/Parametres/ParametresPage'; 
import { DepensesPage } from './pages/Depenses/DepensesPage';
import { AlertesPage } from './pages/Alertes/AlertesPage';
import { RapportsPage } from './pages/Rapports/RapportsPage';
import { Login } from './pages/Login';

// Components
import { AlertNotification } from './components/AlertNotification';

// Contexts & Hooks
import { ParametresProvider } from './contexts/ParametresContext';

function Navbar({ user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: 'ti-layout-dashboard' },
    { to: '/filiales', label: 'Filiales', icon: 'ti-building' },
    { to: '/recettes', label: 'Recettes', icon: 'ti-cash' },
    { to: '/depenses', label: 'Dépenses', icon: 'ti-cash-off' },
    { to: '/alertes', label: 'Alertes', icon: 'ti-bell' },
    { to: '/rapports', label: 'Rapports', icon: 'ti-file-text' },
    { to: '/parametres', label: 'Paramètres', icon: 'ti-settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* ✅ Logo + SMI */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo-smi.jpeg" 
              alt="SMI" 
              className="h-14 w-14 lg:h-16 lg:w-16 rounded-xl object-contain bg-white"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Link to="/" className="text-2xl font-bold text-red-600">SMI</Link>
          </div>

          {/* ✅ Menu desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  isActive(item.to)
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`ti ${item.icon}`}></i>
                {item.label}
              </Link>
            ))}
          </div>

          {/* ✅ User + Logout (desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold">
                {user?.nom?.[0] || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.nom} {user?.prenom}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium flex items-center gap-2"
            >
              <i className="ti ti-logout"></i>
              Déconnexion
            </button>
          </div>

          {/* ✅ Bouton hamburger mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <i className={`ti ${mobileMenuOpen ? 'ti-x' : 'ti-menu-2'} text-2xl`}></i>
          </button>
        </div>
      </div>

      {/* ✅ Menu mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-3 ${
                  isActive(item.to)
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`ti ${item.icon} text-lg`}></i>
                {item.label}
              </Link>
            ))}

            <div className="pt-3 mt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold">
                  {user?.nom?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{user?.nom}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <i className="ti ti-logout"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ✅ Composant pour protéger les routes
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppContent() {
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuthStore();
  const connectSSE = useAlertesStore(s => s.connectSSE);
  const isConnected = useAlertesStore(s => s.isConnected);
  const derniereAlerteSSE = useAlertesStore(s => s.derniereAlerteSSE);

  // ✅ Connexion SSE (seulement si authentifié)
  useEffect(() => {
    if (user) {
      const cleanup = connectSSE();
      return cleanup;
    }
  }, [user, connectSSE]);

  // ✅ Toast pour les nouvelles alertes SSE
  useEffect(() => {
    if (derniereAlerteSSE) {
      const id = Date.now() + Math.random();
      setNotifications(prev => [...prev, { ...derniereAlerteSSE, id }]);
    }
  }, [derniereAlerteSSE]);

  const handleCloseNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Indicateur SSE */}
      {user && (
        <div className="fixed top-2 left-2 z-40 text-xs">
          {isConnected ? (
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Alertes en direct
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              <span className="inline-block w-2 h-2 bg-gray-400"></span>
              Connexion...
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-16 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <AlertNotification
            key={notification.id}
            alert={notification}
            onClose={() => handleCloseNotification(notification.id)}
          />
        ))}
      </div>

      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<Login />} />

        {/* Routes protégées */}
        <Route path="/" element={
          <ProtectedRoute>
            <><Navbar user={user} onLogout={handleLogout} /><Dashboard /></>
          </ProtectedRoute>
        } />
        <Route path="/filiales" element={
          <ProtectedRoute>
            <><Navbar user={user} onLogout={handleLogout} /><FillialesPage /></>
          </ProtectedRoute>
        } />
        <Route path="/recettes" element={
          <ProtectedRoute>
            <><Navbar user={user} onLogout={handleLogout} /><RecettesPage /></>
          </ProtectedRoute>
        } />
        <Route path="/depenses" element={
          <ProtectedRoute>
            <><Navbar user={user} onLogout={handleLogout} /><DepensesPage /></>
          </ProtectedRoute>
        } />
        <Route path="/alertes" element={
          <ProtectedRoute>
            <><Navbar user={user} onLogout={handleLogout} /><AlertesPage /></>
          </ProtectedRoute>
        } />
        <Route path="/rapports" element={
          <ProtectedRoute>
            <><Navbar user={user} onLogout={handleLogout} /><RapportsPage /></>
          </ProtectedRoute>
        } />
        <Route path="/parametres" element={
          <ProtectedRoute>
            <ParametresProvider><Navbar user={user} onLogout={handleLogout} /><ParametresPage /></ParametresProvider>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
       <ToastContainer />
       {/* ✅ Bouton d'installation PWA */}
        <InstallPWA />
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;