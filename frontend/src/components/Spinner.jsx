// frontend/src/components/Spinner.jsx

export function Spinner({ size = 'md', label = 'Chargement...' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizes[size]} border-gray-200 border-t-red-600 rounded-full animate-spin`}></div>
      {label && <p className="text-gray-500 text-sm mt-4">{label}</p>}
    </div>
  );
}

// ✅ Loader plein écran (pour le login ou transitions)
export function FullScreenLoader({ label = 'Chargement...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-gray-700 font-medium mt-4">{label}</p>
      </div>
    </div>
  );
}