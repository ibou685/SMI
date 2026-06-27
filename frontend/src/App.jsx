// frontend/src/App.jsx - VERSION CORRIGÉE (avec Link au lieu de <a>)

import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';

// Pages
import { Dashboard } from './pages/Dashboard';
import { FillialesPage } from './pages/Filiales/FillialesPage';
import { RecettesPage } from './pages/Recettes/RecettesPage';
import { ParametresPage } from './pages/Parametres/ParametresPage';
import { DepensesPage } from './pages/Depenses/DepensesPage';
import { AlertesPage } from './pages/Alertes/AlertesPage';
import { RapportsPage } from './pages/Rapports/RapportsPage';

// Components
import { AlertNotification } from './components/AlertNotification';

// Contexts & Hooks
import { ParametresProvider } from './contexts/ParametresContext';
import { useAlerts } from './hooks/useAlerts';

function Navbar() {
  return (
    <nav className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-red-600">SMI</Link>
            <div className="flex gap-4">
              <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">Dashboard</Link>
              <Link to="/filiales" className="text-gray-700 hover:text-gray-900 font-medium">Filiales</Link>
              <Link to="/recettes" className="text-gray-700 hover:text-gray-900 font-medium">Recettes</Link>
              <Link to="/depenses" className="text-gray-700 hover:text-gray-900 font-medium">Dépenses</Link>
              <Link to="/alertes" className="text-gray-700 hover:text-gray-900 font-medium">🚨 Alertes</Link>
              <Link to="/rapports" className="text-gray-700 hover:text-gray-900 font-medium">📄 Rapports</Link>
              <Link to="/parametres" className="text-gray-700 hover:text-gray-900 font-medium">⚙️ Paramètres</Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const [notifications, setNotifications] = useState([]);
  const { isConnected } = useAlerts((newAlert) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...newAlert, id }]);
  });

  const handleCloseNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {/* Indicateur SSE */}
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

      <Navbar />

      <ParametresProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/filiales" element={<FillialesPage />} />
          <Route path="/recettes" element={<RecettesPage />} />
          <Route path="/depenses" element={<DepensesPage />} />
          <Route path="/alertes" element={<AlertesPage />} />
          <Route path="/rapports" element={<RapportsPage />} />
          <Route path="/parametres" element={<ParametresPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ParametresProvider>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
