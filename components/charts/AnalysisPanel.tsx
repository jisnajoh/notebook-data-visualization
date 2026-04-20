'use client';
import { useMemo } from 'react';
import { generateAnalysis } from '@/lib/visualizationAnalysis';
import type { ParsedData } from '@/lib/chartDataProcessor';
import type { ChartTypeId } from '@/lib/chartTypes';

interface Props {
  chartType: ChartTypeId;
  columns: string[];
  parsedData: ParsedData;
}

export default function AnalysisPanel({ chartType, columns, parsedData }: Props) {
  const analysis = useMemo(
    () => generateAnalysis(chartType, columns, parsedData),
    [chartType, columns, parsedData]
  );

  if (columns.length === 0) return null;

  return (
    <div className="rounded-lg p-4 mt-3" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
      <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
        Dataset: {analysis.datasetName}
      </h4>
      <p className="text-xs text-slate-400 mb-3">{analysis.context}</p>

      {analysis.insights.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-300 mb-1">Insights from your data</p>
          <ul className="space-y-1">
            {analysis.insights.map((insight, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-2">
                <span className="text-indigo-400 shrink-0">▸</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500">{analysis.columnSuitability}</p>
    </div>
  );
}
