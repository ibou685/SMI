// frontend/src/components/Charts/BarChart.jsx
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function BarChart({ data = null }) {
  const defaultData = {
    labels: ['Dakar', 'Pikine', 'Rufisque', 'Thiès', 'Kaolack'],
    datasets: [
      {
        label: 'Recettes (M FCFA)',
        data: [28.5, 22, 19.5, 18.75, 17.25],
        backgroundColor: '#059669',
        borderColor: '#047857',
        borderWidth: 1,
      },
    ],
  };

  const chartData = data || defaultData;

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-bold text-lg mb-4">Top 5 Filiales</h3>
      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}
