'use client';
import { DARK_BG, PALETTE } from '@/lib/chartConfig';

interface Props {
  data: { matrix: number[][]; labels: string[] };
}

function corColor(v: number): string {
  // -1 → red, 0 → dark, +1 → indigo
  if (v >= 0) {
    const t = v;
    const r = Math.round(99 * (1 - t) + 99 * t);
    const g = Math.round(102 * (1 - t));
    const b = Math.round(241 * t + 102 * (1 - t));
    return `rgb(${r},${g},${b})`;
  } else {
    const t = -v;
    return `rgba(239,68,68,${0.2 + t * 0.7})`;
  }
}

export default function UniversalHeatMap({ data }: Props) {
  const { matrix, labels } = data;
  if (labels.length === 0) return <p className="text-slate-400 text-sm">No numeric columns selected.</p>;

  const cellSize = Math.max(40, Math.min(80, Math.floor(480 / labels.length)));

  return (
    <div style={{ background: DARK_BG, borderRadius: 8, padding: 16, overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `80px repeat(${labels.length}, ${cellSize}px)`,
          gap: 2,
        }}
      >
        {/* Header row */}
        <div />
        {labels.map((l) => (
          <div
            key={l}
            className="text-center text-xs text-slate-400 truncate"
            style={{ fontSize: cellSize < 50 ? 9 : 11, paddingBottom: 4 }}
            title={l}
          >
            {l}
          </div>
        ))}
        {/* Data rows */}
        {matrix.map((row, i) => (
          <>
            <div
              key={`label-${i}`}
              className="text-right text-xs text-slate-400 pr-2 flex items-center justify-end truncate"
              style={{ fontSize: cellSize < 50 ? 9 : 11 }}
              title={labels[i]}
            >
              {labels[i]}
            </div>
            {row.map((val, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="flex items-center justify-center rounded text-xs font-mono"
                style={{
                  height: cellSize,
                  background: corColor(val),
                  color: Math.abs(val) > 0.5 ? '#fff' : '#94a3b8',
                  fontSize: cellSize < 50 ? 8 : 10,
                }}
                title={`${labels[i]} × ${labels[j]}: ${val.toFixed(3)}`}
              >
                {val.toFixed(2)}
              </div>
            ))}
          </>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">Pearson correlation — blue = positive, red = negative</p>
    </div>
  );
}
