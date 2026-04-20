'use client';
import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { histogram } from '@/lib/advancedDataProcessors';
import { PALETTE, DARK_BG, GRID_COLOR, TICK_COLOR } from '@/lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  data: { values: number[]; label: string };
}

export default function UniversalHistogram({ data }: Props) {
  const { values, label } = data;
  const bins = useMemo(() => histogram(values, 20), [values]);

  if (values.length === 0) return <p className="text-slate-400 text-sm">No data.</p>;

  return (
    <div className="chart-container" style={{ height: 320, background: DARK_BG, borderRadius: 8, padding: 12 }}>
      <Bar
        data={{
          labels: bins.map((b) => b.x.toFixed(2)),
          datasets: [{
            label,
            data: bins.map((b) => b.y),
            backgroundColor: PALETTE[2] + '90',
            borderColor: PALETTE[2],
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
            x: { ticks: { color: TICK_COLOR, maxTicksLimit: 10 }, grid: { color: GRID_COLOR } },
            y: { ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
          },
        }}
      />
    </div>
  );
}
