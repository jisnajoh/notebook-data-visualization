'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { PALETTE, DARK_BG, GRID_COLOR, TICK_COLOR } from '@/lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  data: { labels: string[]; values: number[] };
  columns: string[];
}

export default function UniversalBarChart({ data, columns }: Props) {
  const { labels, values } = data;
  if (labels.length === 0) return <p className="text-slate-400 text-sm">No data.</p>;

  return (
    <div className="chart-container" style={{ height: 320, background: DARK_BG, borderRadius: 8, padding: 12 }}>
      <Bar
        data={{
          labels,
          datasets: [{
            label: columns[1] ?? 'Value',
            data: values,
            backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length] + 'bb'),
            borderColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
            borderWidth: 1,
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
            x: { ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
            y: { ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
          },
        }}
      />
    </div>
  );
}
