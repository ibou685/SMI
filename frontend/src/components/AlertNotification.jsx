// À créer dans: frontend/src/components/AlertNotification.jsx

import { useEffect, useState } from 'react';

export function AlertNotification({ alert, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-fermer après 8 secondes
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Attendre l'animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  // Couleur selon le type d'alerte
  const getColor = () => {
    switch (alert.type) {
      case 'Dépense inhabituelle':
        return 'bg-red-500';
      case 'Retard paiement':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Icône selon le type
  const getIcon = () => {
    switch (alert.type) {
      case 'Dépense inhabituelle':
        return '💰';
      case 'Retard paiement':
        return '⏰';
      default:
        return '🔔';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 max-w-md
        ${getColor()} text-white
        rounded-lg shadow-lg p-4
        animate-slide-in
        z-50
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{alert.titre}</h3>
          <p className="text-sm mt-1">{alert.message}</p>
          <p className="text-xs mt-2 opacity-75">{alert.timestamp}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:opacity-75 text-xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* Barre de progression pour le auto-close */}
      <div className="mt-3 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
        <div
          className="h-full bg-white bg-opacity-80 animate-shrink-width"
          style={{
            animation: 'shrinkWidth 8s linear forwards'
          }}
        />
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
