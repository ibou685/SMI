// frontend/src/components/AlertsList.jsx
export function AlertsList() {
  const alerts = [
    {
      id: 1,
      titre: 'Retard paiement',
      description: 'Filiale Pikine - 24h de retard',
      type: 'Retard',
      statut: 'Active',
      date: new Date(),
    },
    {
      id: 2,
      titre: 'Dépense inhabituelle',
      description: 'Maintenance: 75M FCFA',
      type: 'Dépense',
      statut: 'Active',
      date: new Date(),
    },
  ];

  const getAlertColor = (type) => {
    switch (type) {
      case 'Retard':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'Dépense':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-bold text-lg mb-4">Alertes Actives</h3>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune alerte</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-3 rounded ${getAlertColor(alert.type)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{alert.titre}</p>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                </div>
                <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded font-semibold">
                  {alert.statut}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
