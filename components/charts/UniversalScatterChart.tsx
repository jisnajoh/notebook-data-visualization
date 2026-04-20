'use client';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { PALETTE, DARK_BG, GRID_COLOR, TICK_COLOR } from '@/lib/chartConfig';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface Props {
  data: { points: { x: number; y: number }[]; xLabel: string; yLabel: string };
}

export default function UniversalScatterChart({ data }: Props) {
  const { points, xLabel, yLabel } = data;
  if (points.length === 0) return <p className="text-slate-400 text-sm">No data.</p>;

  return (
    <div className="chart-container" style={{ height: 320, background: DARK_BG, borderRadius: 8, padding: 12 }}>
      <Scatter
        data={{
          datasets: [{
            label: `${xLabel} vs ${yLabel}`,
            data: points,
            backgroundColor: PALETTE[0] + '99',
            pointRadius: 4,
            pointHoverRadius: 6,
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
            x: { title: { display: true, text: xLabel, color: TICK_COLOR }, ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
            y: { title: { display: true, text: yLabel, color: TICK_COLOR }, ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
          },
        }}
      />
    </div>
  );
}
