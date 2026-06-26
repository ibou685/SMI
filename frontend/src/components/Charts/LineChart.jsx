// frontend/src/components/Charts/LineChart.jsx
// Graphique évolution recettes sur 6 mois

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { apiClient } from '../../api/client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function LineChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.stats.evolution();
        
        const labels = response.data.map((d) => d.mois);
        const recettesData = response.data.map((d) => d.recettes);
        const depensesData = response.data.map((d) => d.depenses);
        const soldeData = response.data.map((d) => d.solde);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Recettes (M FCFA)',
              data: recettesData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              borderWidth: 3
            },
            {
              label: 'Dépenses (M FCFA)',
              data: depensesData,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointBackgroundColor: '#ef4444',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              borderWidth: 3
            },
            {
              label: 'Solde (M FCFA)',
              data: soldeData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              borderWidth: 3
            }
          ]
        });
      } catch (err) {
        console.error('Erreur chargement graphique:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-bold mb-4">Évolution 6 Mois</h3>
      {chartData ? (
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 15,
                  font: { size: 12, weight: 'bold' }
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: function (context) {
                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}M`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Montant (Millions FCFA)'
                }
              }
            }
          }}
        />
      ) : (
        <p className="text-gray-500">Aucune donnée disponible</p>
      )}
    </div>
  );
}
