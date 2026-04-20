'use client';
import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { kde, histogram } from '@/lib/advancedDataProcessors';
import { PALETTE, DARK_BG, GRID_COLOR, TICK_COLOR } from '@/lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

interface Props {
  data: { values: number[]; label: string };
}

export default function UniversalDistPlot({ data }: Props) {
  const { values, label } = data;

  const { barData, kdeData, kdeMax } = useMemo(() => {
    const bins = histogram(values, 20);
    const kd = kde(values, undefined, 200);
    const maxKde = Math.max(...kd.map((p) => p.y), 0.001);
    const maxBin = Math.max(...bins.map((b) => b.y), 1);
    const scale = maxBin / maxKde;
    return {
      barData: bins,
      kdeData: kd.map((p) => ({ x: p.x, y: p.y * scale })),
      kdeMax: maxKde,
    };
  }, [values]);

  if (values.length === 0) return <p className="text-slate-400 text-sm">No numeric data available.</p>;

  const chartData = {
    datasets: [
      {
        type: 'bar' as const,
        label: `${label} (count)`,
        data: barData.map((b) => ({ x: b.x, y: b.y })),
        backgroundColor: PALETTE[0] + '80',
        borderColor: PALETTE[0],
        borderWidth: 1,
        barPercentage: 0.95,
        categoryPercentage: 0.95,
      },
      {
        type: 'line' as const,
        label: 'KDE',
        data: kdeData,
        borderColor: PALETTE[1],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="chart-container" style={{ height: 320, background: DARK_BG, borderRadius: 8, padding: 12 }}>
      <Chart
        type="bar"
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: TICK_COLOR } },
            tooltip: { backgroundColor: '#0f172a', titleColor: '#e2e8f0', bodyColor: '#94a3b8' },
          },
          scales: {
            x: { type: 'linear', ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
            y: { ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
          },
        }}
      />
    </div>
  );
}
