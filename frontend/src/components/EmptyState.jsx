// frontend/src/components/EmptyState.jsx

export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4 opacity-80">{icon}</div>
      <h3 className="text-xl font-bold text-gray-700">{title}</h3>
      {message && <p className="text-gray-500 mt-2 max-w-md">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}