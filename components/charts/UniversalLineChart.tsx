'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PALETTE, DARK_BG, GRID_COLOR, TICK_COLOR } from '@/lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Props {
  data: { points: { x: string; y: number }[]; xLabel: string; yLabel: string };
}

export default function UniversalLineChart({ data }: Props) {
  const { points, xLabel, yLabel } = data;
  if (points.length === 0) return <p className="text-slate-400 text-sm">No data.</p>;

  return (
    <div className="chart-container" style={{ height: 320, background: DARK_BG, borderRadius: 8, padding: 12 }}>
      <Line
        data={{
          labels: points.map((p) => p.x),
          datasets: [{
            label: yLabel,
            data: points.map((p) => p.y),
            borderColor: PALETTE[1],
            backgroundColor: PALETTE[1] + '22',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: TICK_COLOR } },
            tooltip: { backgroundColor: '#0f172a', titleColor: '#e2e8f0', bodyColor: '#94a3b8' },
          },
          scales: {
            x: { title: { display: true, text: xLabel, color: TICK_COLOR }, ticks: { color: TICK_COLOR, maxTicksLimit: 12 }, grid: { color: GRID_COLOR } },
            y: { title: { display: true, text: yLabel, color: TICK_COLOR }, ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
          },
        }}
      />
    </div>
  );
}
