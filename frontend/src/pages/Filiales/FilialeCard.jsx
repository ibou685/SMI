// frontend/src/pages/Filiales/FilialeCard.jsx
// Carte affichant les informations d'une filiale

export function FilialeCard({ filiale, onEdit, onDelete }) {
  const getStatusColor = (statut) => {
    switch (statut) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Suspendue':
        return 'bg-yellow-100 text-yellow-800';
      case 'Fermée':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{filiale.nom}</h3>
          <p className="text-sm text-gray-500">{filiale.code}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(filiale.statut)}`}>
          {filiale.statut}
        </span>
      </div>

      {/* Infos */}
      <div className="space-y-2 mb-4 text-sm">
        {filiale.ville && (
          <div className="flex items-center gap-2 text-gray-600">
            <i className="ti ti-map-pin"></i>
            {filiale.ville}
            {filiale.region && `, ${filiale.region}`}
          </div>
        )}
        {filiale.telephone && (
          <div className="flex items-center gap-2 text-gray-600">
            <i className="ti ti-phone"></i>
            {filiale.telephone}
          </div>
        )}
        {filiale.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <i className="ti ti-mail"></i>
            {filiale.email}
          </div>
        )}
      </div>

      {/* Adresse */}
      {filiale.adresse && (
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
          <p className="text-xs text-gray-500 mb-1">Adresse</p>
          {filiale.adresse}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm font-medium"
        >
          <i className="ti ti-edit"></i>
          Modifier
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm font-medium"
        >
          <i className="ti ti-trash"></i>
          Supprimer
        </button>
      </div>
    </div>
  );
}
