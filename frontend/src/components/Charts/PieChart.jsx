// frontend/src/components/Charts/PieChart.jsx
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export function PieChart({ data = null }) {
  const defaultData = {
    labels: ['Salaires', 'Électricité', 'Eau', 'Carburant', 'Autres'],
    datasets: [
      {
        data: [45, 20, 15, 12, 8],
        backgroundColor: [
          '#3B82F6',
          '#FBBF24',
          '#06B6D4',
          '#F97316',
          '#8B5CF6',
        ],
        borderColor: ['#fff'],
        borderWidth: 2,
      },
    ],
  };

  const chartData = data || defaultData;

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-bold text-lg mb-4">Dépenses par Catégorie</h3>
      <Pie
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
          },
        }}
      />
    </div>
  );
}
