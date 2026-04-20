'use client';
import { useState, useMemo } from 'react';
import type { ParsedData } from '@/lib/chartDataProcessor';
import { getColumnsByType } from '@/lib/chartDataProcessor';
import type { ChartTypeId } from '@/lib/chartTypes';
import { CHART_TYPES } from '@/lib/chartTypes';
import UniversalChart from './charts/UniversalChart';
import AnalysisPanel from './charts/AnalysisPanel';
import ChartTypeGallery from './visualization/ChartTypeGallery';
import { ColumnDropdown, MultiColumnSelector } from './visualization/ColumnSelector';

interface Props {
  parsedData: ParsedData;
}

// ─── Column selectors per chart type ───────────────────────────────────────

function StandardChartPanel({
  chartType,
  parsedData,
}: {
  chartType: ChartTypeId;
  parsedData: ParsedData;
}) {
  const { headers, columnInfo } = parsedData;
  const numCols = getColumnsByType(columnInfo, 'numeric', 'boolean');
  const catCols = getColumnsByType(columnInfo, 'categorical', 'boolean');
  const allCols = headers;

  const defaultNum1 = numCols[0] ?? '';
  const defaultNum2 = numCols[1] ?? numCols[0] ?? '';
  const defaultCat = catCols[0] ?? '';
  const defaultMultiNum = numCols.slice(0, Math.min(5, numCols.length));

  const [col1, setCol1] = useState(defaultNum1);
  const [col2, setCol2] = useState(defaultNum2);
  const [catCol, setCatCol] = useState(defaultCat);
  const [multiCols, setMultiCols] = useState<string[]>(defaultMultiNum);
  const [groupCol, setGroupCol] = useState('');

  const columns: string[] = useMemo(() => {
    switch (chartType) {
      case 'DistPlot':
      case 'Histogram':
        return col1 ? [col1] : [];
      case 'PieChart':
        return catCol ? [catCol] : [];
      case 'ViolinPlot':
        return col1 && catCol ? [col1, catCol] : [];
      case 'HeatMap':
        return multiCols.length >= 2 ? multiCols : [];
      case 'PairPlot':
        return multiCols.length >= 2 ? multiCols : [];
      case 'JointPlot':
      case 'ScatterPlot':
        return col1 && col2 ? [col1, col2] : [];
      case 'BarChart':
        return catCol && col1 ? [catCol, col1] : [];
      case 'LineChart':
        return col1 && col2 ? [col1, col2] : [];
      default:
        return [];
    }
  }, [chartType, col1, col2, catCol, multiCols]);

  return (
    <div className="space-y-3">
      {/* Column selectors */}
      <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
        {(chartType === 'DistPlot' || chartType === 'Histogram') && (
          <ColumnDropdown label="Numeric column" columns={allCols} columnInfo={columnInfo} filterTypes={['numeric', 'boolean']} value={col1} onChange={setCol1} />
        )}
        {chartType === 'PieChart' && (
          <ColumnDropdown label="Category column" columns={allCols} columnInfo={columnInfo} filterTypes={['categorical', 'boolean']} value={catCol} onChange={setCatCol} />
        )}
        {chartType === 'ViolinPlot' && (
          <>
            <ColumnDropdown label="Numeric (y)" columns={allCols} columnInfo={columnInfo} filterTypes={['numeric']} value={col1} onChange={setCol1} />
            <ColumnDropdown label="Category (x)" columns={allCols} columnInfo={columnInfo} filterTypes={['categorical', 'boolean']} value={catCol} onChange={setCatCol} />
          </>
        )}
        {(chartType === 'HeatMap' || chartType === 'PairPlot') && (
          <MultiColumnSelector
            label="Numeric columns"
            columns={allCols}
            columnInfo={columnInfo}
            filterTypes={['numeric', 'boolean']}
            selected={multiCols}
            onChange={setMultiCols}
            max={chartType === 'HeatMap' ? 8 : 10}
          />
        )}
        {(chartType === 'JointPlot' || chartType === 'ScatterPlot') && (
          <>
            <ColumnDropdown label="X axis" columns={allCols} columnInfo={columnInfo} filterTypes={['numeric']} value={col1} onChange={setCol1} />
            <ColumnDropdown label="Y axis" columns={allCols} columnInfo={columnInfo} filterTypes={['numeric']} value={col2} onChange={setCol2} />
          </>
        )}
        {chartType === 'BarChart' && (
          <>
            <ColumnDropdown label="Category (x)" columns={allCols} columnInfo={columnInfo} filterTypes={['categorical', 'boolean']} value={catCol} onChange={setCatCol} />
            <ColumnDropdown label="Numeric (y)" columns={allCols} columnInfo={columnInfo} filterTypes={['numeric']} value={col1} onChange={setCol1} />
          </>
        )}
        {chartType === 'LineChart' && (
          <>
            <ColumnDropdown label="X axis" columns={allCols} columnInfo={columnInfo} value={col1} onChange={setCol1} />
            <ColumnDropdown label="Y axis (numeric)" columns={allCols} columnInfo={columnInfo} filterTypes={['numeric']} value={col2} onChange={setCol2} />
          </>
        )}
      </div>

      {/* Chart */}
      <UniversalChart spec={{ type: chartType, columns, parsedData }} />

      {/* Analysis */}
      {columns.length > 0 && (
        <AnalysisPanel chartType={chartType} columns={columns} parsedData={parsedData} />
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function CsvVisualizations({ parsedData }: Props) {
  const [mode, setMode] = useState<'standard' | 'custom'>('standard');
  const [activeChart, setActiveChart] = useState<ChartTypeId>('DistPlot');
  const [customChart, setCustomChart] = useState<ChartTypeId | null>(null);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['standard', 'custom'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {m === 'standard' ? 'Standard' : 'Custom'}
          </button>
        ))}
      </div>

      {mode === 'standard' ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-40 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setActiveChart(ct.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeChart === ct.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{ct.icon}</span>
                <span>{ct.label}</span>
              </button>
            ))}
          </div>

          {/* Chart panel */}
          <div className="flex-1 min-w-0">
            <StandardChartPanel chartType={activeChart} parsedData={parsedData} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ChartTypeGallery selected={customChart} onSelect={setCustomChart} />
          {customChart && (
            <div className="mt-4">
              <StandardChartPanel chartType={customChart} parsedData={parsedData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
