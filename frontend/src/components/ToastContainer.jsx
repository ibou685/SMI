// frontend/src/components/ToastContainer.jsx

import { useEffect } from 'react';
import { useToastStore } from '../store/toastStore';

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const remove = useToastStore(s => s.remove);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const colors = {
    success: 'bg-green-600 border-green-700',
    error: 'bg-red-600 border-red-700',
    info: 'bg-blue-600 border-blue-700',
    warning: 'bg-yellow-500 border-yellow-600'
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  return (
    <div className={`${colors[toast.type]} text-white rounded-lg shadow-2xl border-l-4 p-4 min-w-[300px] max-w-md flex items-start gap-3 animate-slide-in`}>
      <span className="text-xl">{icons[toast.type]}</span>
      <div className="flex-1 text-sm whitespace-pre-line">{toast.message}</div>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white text-lg font-bold ml-2"
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}