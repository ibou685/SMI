// frontend/src/components/InstallPWA.jsx

import { useEffect, useState } from 'react';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Empêcher le prompt par défaut
      e.preventDefault();
      // Stocker l'événement pour le déclencher plus tard
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Détecter si déjà installé
    window.addEventListener('appinstalled', () => {
      setShowButton(false);
      console.log('✅ PWA installée');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Afficher le prompt d'installation
    deferredPrompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ Utilisateur a accepté l\'installation');
    } else {
      console.log('❌ Utilisateur a refusé l\'installation');
    }

    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 bg-red-700 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-red-800 transition flex items-center gap-2 animate-slide-in"
    >
      <i className="ti ti-download"></i>
      Installer l'application
    </button>
  );
}