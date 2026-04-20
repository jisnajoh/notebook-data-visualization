'use client';
import { useMemo } from 'react';
import { PALETTE, DARK_BG } from '@/lib/chartConfig';
import { histogram, kde } from '@/lib/advancedDataProcessors';

interface Props {
  data: { points: { x: number; y: number }[]; xLabel: string; yLabel: string };
}

export default function UniversalJointPlot({ data }: Props) {
  const { points, xLabel, yLabel } = data;

  const { xVals, yVals, xBins, yBins, scatterPts } = useMemo(() => {
    const xV = points.map((p) => p.x);
    const yV = points.map((p) => p.y);
    return {
      xVals: xV,
      yVals: yV,
      xBins: histogram(xV, 15),
      yBins: histogram(yV, 15),
      scatterPts: points,
    };
  }, [points]);

  if (points.length === 0) return <p className="text-slate-400 text-sm">No data.</p>;

  const W = 340, H = 260, marg = 70;
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals) || 1;
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals) || 1;
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const toSvgX = (v: number) => marg + ((v - xMin) / xRange) * (W - marg - 10);
  const toSvgY = (v: number) => (H - marg) - ((v - yMin) / yRange) * (H - marg - 10);

  const maxXBin = Math.max(...xBins.map((b) => b.y), 1);
  const maxYBin = Math.max(...yBins.map((b) => b.y), 1);
  const margH = 50;

  return (
    <div style={{ background: DARK_BG, borderRadius: 8, padding: 12 }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H + margH}`} style={{ display: 'block' }}>
        {/* X marginal histogram (top) */}
        {xBins.map((b, i) => {
          const bx = toSvgX(b.x - b.width / 2);
          const bw = ((b.width) / xRange) * (W - marg - 10);
          const bh = (b.y / maxXBin) * (margH - 6);
          return (
            <rect
              key={i}
              x={bx}
              y={margH - bh}
              width={Math.max(bw - 1, 1)}
              height={bh}
              fill={PALETTE[1] + '88'}
            />
          );
        })}

        {/* Scatter area */}
        {scatterPts.slice(0, 500).map((p, i) => (
          <circle
            key={i}
            cx={toSvgX(p.x)}
            cy={margH + toSvgY(p.y)}
            r={2.5}
            fill={PALETTE[0]}
            opacity={0.55}
          />
        ))}

        {/* Y marginal histogram (right) */}
        {yBins.map((b, i) => {
          const by = margH + toSvgY(b.x + b.width / 2);
          const bh_svg = ((b.width) / yRange) * (H - marg - 10);
          const bw = (b.y / maxYBin) * 40;
          return (
            <rect
              key={i}
              x={W - 10}
              y={by}
              width={bw}
              height={Math.max(bh_svg - 1, 1)}
              fill={PALETTE[2] + '88'}
            />
          );
        })}

        {/* Axis labels */}
        <text x={(W + marg) / 2} y={H + margH} textAnchor="middle" fill="#94a3b8" fontSize={11}>
          {xLabel}
        </text>
        <text
          x={10}
          y={margH + (H - marg) / 2}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={11}
          transform={`rotate(-90, 10, ${margH + (H - marg) / 2})`}
        >
          {yLabel}
        </text>

        {/* Axes */}
        <line x1={marg} y1={margH} x2={marg} y2={margH + H - marg} stroke="#334155" strokeWidth={1} />
        <line x1={marg} y1={margH + H - marg} x2={W - 10} y2={margH + H - marg} stroke="#334155" strokeWidth={1} />
      </svg>
    </div>
  );
}
