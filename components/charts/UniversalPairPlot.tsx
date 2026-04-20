'use client';
import { useMemo } from 'react';
import { PALETTE, DARK_BG } from '@/lib/chartConfig';
import { histogram } from '@/lib/advancedDataProcessors';

interface Props {
  data: { columns: string[]; rows: Record<string, string>[] };
}

function cellMaxHeight(n: number) {
  if (n <= 2) return 320;
  if (n === 3) return 240;
  if (n === 4) return 180;
  if (n <= 6) return 130;
  return 90;
}

function MiniScatter({ xVals, yVals, color }: { xVals: number[]; yVals: number[]; color: string }) {
  const w = 100, h = 100;
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals) || 1;
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals) || 1;
  const pts = xVals.slice(0, 300).map((x, i) => ({
    cx: ((x - xMin) / (xMax - xMin)) * (w - 10) + 5,
    cy: h - ((yVals[i] - yMin) / (yMax - yMin)) * (h - 10) - 5,
  }));
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
      {pts.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={1.5} fill={color} opacity={0.6} />
      ))}
    </svg>
  );
}

function MiniHist({ vals, color }: { vals: number[]; color: string }) {
  const bins = histogram(vals, 12);
  const maxY = Math.max(...bins.map((b) => b.y), 1);
  const w = 100, h = 100;
  const binW = w / bins.length;
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
      {bins.map((b, i) => {
        const barH = (b.y / maxY) * (h - 4);
        return (
          <rect
            key={i}
            x={i * binW + 1}
            y={h - barH}
            width={binW - 2}
            height={barH}
            fill={color}
            opacity={0.75}
          />
        );
      })}
    </svg>
  );
}

export default function UniversalPairPlot({ data }: Props) {
  const { columns, rows } = data;
  const n = columns.length;

  const vals = useMemo(() =>
    Object.fromEntries(
      columns.map((c) => [
        c,
        rows.map((r) => Number(r[c])).filter((v) => isFinite(v)),
      ])
    ),
    [columns, rows]
  );

  if (n < 2) return <p className="text-slate-400 text-sm">Select at least 2 numeric columns.</p>;

  const labelW = Math.max(40, Math.min(80, Math.floor(60 / (n / 4))));
  const maxH = cellMaxHeight(n);
  const fontSize = n > 6 ? 9 : n > 4 ? 10 : 12;

  return (
    <div style={{ background: DARK_BG, borderRadius: 8, padding: 12, overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${labelW}px repeat(${n}, minmax(0, 1fr))`,
          gap: 2,
        }}
      >
        {/* Top-left blank */}
        <div />
        {/* Column headers */}
        {columns.map((c) => (
          <div
            key={c}
            className="text-center text-slate-400 truncate pb-1"
            style={{ fontSize }}
            title={c}
          >
            {c}
          </div>
        ))}

        {columns.map((rowCol, i) => (
          <>
            {/* Row label */}
            <div
              key={`rl-${i}`}
              className="flex items-center justify-end pr-1 text-slate-400 truncate"
              style={{ fontSize }}
              title={rowCol}
            >
              {rowCol}
            </div>
            {/* Cells */}
            {columns.map((colCol, j) => (
              <div
                key={`cell-${i}-${j}`}
                style={{
                  aspectRatio: '1',
                  maxHeight: maxH,
                  background: '#0f172a',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                {i === j ? (
                  <MiniHist vals={vals[rowCol]} color={PALETTE[i % PALETTE.length]} />
                ) : (
                  <MiniScatter
                    xVals={vals[colCol]}
                    yVals={vals[rowCol]}
                    color={PALETTE[i % PALETTE.length]}
                  />
                )}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}
