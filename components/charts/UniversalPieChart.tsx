'use client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PALETTE, DARK_BG, TICK_COLOR } from '@/lib/chartConfig';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: { labels: string[]; values: number[] };
}

export default function UniversalPieChart({ data }: Props) {
  const { labels, values } = data;
  if (labels.length === 0) return <p className="text-slate-400 text-sm">No categorical data.</p>;

  const top10 = labels
    .map((l, i) => ({ label: l, value: values[i] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="chart-container" style={{ height: 320, background: DARK_BG, borderRadius: 8, padding: 12 }}>
      <Doughnut
        data={{
          labels: top10.map((d) => d.label),
          datasets: [
            {
              data: top10.map((d) => d.value),
              backgroundColor: PALETTE,
              borderColor: '#0d0d1a',
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: TICK_COLOR, boxWidth: 12 } },
            tooltip: { backgroundColor: '#0f172a', titleColor: '#e2e8f0', bodyColor: '#94a3b8' },
          },
        }}
      />
    </div>
  );
}
