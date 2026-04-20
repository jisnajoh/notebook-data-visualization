import type { ChartOptions } from 'chart.js';

export const PALETTE = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

export const DARK_BG = '#1a1a2e';
export const GRID_COLOR = 'rgba(255,255,255,0.06)';
export const TICK_COLOR = '#94a3b8';

export const baseOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: TICK_COLOR,
        font: { size: 12 },
      },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      borderColor: '#334155',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: TICK_COLOR },
      grid: { color: GRID_COLOR },
    },
    y: {
      ticks: { color: TICK_COLOR },
      grid: { color: GRID_COLOR },
    },
  },
};
