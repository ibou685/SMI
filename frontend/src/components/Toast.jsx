// frontend/src/components/Toast.jsx
// Toast non-bloquant pour remplacer alert()

import { useEffect, useState } from 'react';

export function Toast({ message, type = 'info', duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600'
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100]">
      <div className={`${colors[type]} text-white rounded-lg shadow-2xl p-4 max-w-md min-w-[300px]`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icons[type]}</span>
          <div className="flex-1 whitespace-pre-line">{message}</div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white hover:opacity-75 text-xl font-bold ml-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}