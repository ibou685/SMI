// frontend/src/components/KPICard.jsx
// Composant carte KPI pour dashboard

export function KPICard({ title, value, unit = 'FCFA', trend, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900'
  };

  const trendColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const getTrendColor = () => {
    if (!trend) return 'neutral';
    if (trend.startsWith('+')) return 'positive';
    if (trend.startsWith('-')) return 'negative';
    return 'neutral';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };

  return (
    <div className={`${colorMap[color]} rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold">
          {formatNumber(value)}
        </p>
        <p className="text-xs text-gray-500">{unit}</p>
      </div>
      {trend && (
        <p className={`text-xs mt-2 ${trendColor[getTrendColor()]}`}>
          {trend}
        </p>
      )}
    </div>
  );
}
