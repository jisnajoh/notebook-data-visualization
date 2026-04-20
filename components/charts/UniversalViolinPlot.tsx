'use client';
import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { kde, quantile } from '@/lib/advancedDataProcessors';
import { PALETTE, DARK_BG, GRID_COLOR, TICK_COLOR } from '@/lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

interface Props {
  data: { groups: Record<string, number[]>; numLabel: string; catLabel: string };
}

export default function UniversalViolinPlot({ data }: Props) {
  const { groups, numLabel } = data;
  const groupNames = Object.keys(groups);

  const summary = useMemo(() =>
    groupNames.map((name, i) => {
      const vals = [...groups[name]].sort((a, b) => a - b);
      const q1 = quantile(vals, 0.25);
      const median = quantile(vals, 0.5);
      const q3 = quantile(vals, 0.75);
      const min = vals[0];
      const max = vals[vals.length - 1];
      return { name, q1, median, q3, min, max, color: PALETTE[i % PALETTE.length] };
    }),
    [groups, groupNames]
  );

  if (groupNames.length === 0) return <p className="text-slate-400 text-sm">No data.</p>;

  return (
    <div style={{ background: DARK_BG, borderRadius: 8, padding: 16 }}>
      <p className="text-xs text-slate-400 mb-3">Violin summary (min / Q1 / median / Q3 / max)</p>
      <div className="flex gap-4 flex-wrap">
        {summary.map((s) => (
          <div key={s.name} className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className="text-xs font-medium" style={{ color: s.color }}>{s.name}</span>
            <div className="relative flex flex-col items-center" style={{ height: 120 }}>
              {/* Box */}
              <div
                className="absolute rounded"
                style={{
                  background: s.color + '33',
                  border: `1px solid ${s.color}`,
                  width: 24,
                  top: `${((s.max - s.q3) / ((s.max - s.min) || 1)) * 100}%`,
                  height: `${((s.q3 - s.q1) / ((s.max - s.min) || 1)) * 100}%`,
                }}
              />
              {/* Median line */}
              <div
                className="absolute w-8 h-0.5"
                style={{
                  background: s.color,
                  top: `${((s.max - s.median) / ((s.max - s.min) || 1)) * 100}%`,
                }}
              />
              {/* Whiskers */}
              <div className="absolute w-0.5 h-full" style={{ background: s.color + '55' }} />
            </div>
            <span className="text-xs text-slate-500">{s.median.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">{numLabel} — median values shown</p>
    </div>
  );
}
