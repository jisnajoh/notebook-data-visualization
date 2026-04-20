'use client';
import type { ChartTypeId } from '@/lib/chartTypes';
import type { ParsedData } from '@/lib/chartDataProcessor';
import { buildChartData } from '@/lib/chartDataProcessor';
import UniversalDistPlot from './UniversalDistPlot';
import UniversalPieChart from './UniversalPieChart';
import UniversalViolinPlot from './UniversalViolinPlot';
import UniversalHeatMap from './UniversalHeatMap';
import UniversalPairPlot from './UniversalPairPlot';
import UniversalJointPlot from './UniversalJointPlot';
import UniversalBarChart from './UniversalBarChart';
import UniversalHistogram from './UniversalHistogram';
import UniversalScatterChart from './UniversalScatterChart';
import UniversalLineChart from './UniversalLineChart';

export interface ChartSpec {
  type: ChartTypeId;
  columns: string[];
  parsedData: ParsedData;
}

export default function UniversalChart({ spec }: { spec: ChartSpec }) {
  const { type, columns, parsedData } = spec;

  if (!columns.length || !parsedData) {
    return <p className="text-slate-400 text-sm p-4">Select columns to render this chart.</p>;
  }

  const chartData = buildChartData(parsedData, columns, type) as never;

  switch (type) {
    case 'DistPlot':
      return <UniversalDistPlot data={chartData} />;
    case 'PieChart':
      return <UniversalPieChart data={chartData} />;
    case 'ViolinPlot':
      return <UniversalViolinPlot data={chartData} />;
    case 'HeatMap':
      return <UniversalHeatMap data={chartData} />;
    case 'PairPlot':
      return <UniversalPairPlot data={chartData} />;
    case 'JointPlot':
      return <UniversalJointPlot data={chartData} />;
    case 'BarChart':
      return <UniversalBarChart data={chartData} columns={columns} />;
    case 'Histogram':
      return <UniversalHistogram data={chartData} />;
    case 'ScatterPlot':
      return <UniversalScatterChart data={chartData} />;
    case 'LineChart':
      return <UniversalLineChart data={chartData} />;
    default:
      return <p className="text-slate-400 text-sm p-4">Unknown chart type: {type}</p>;
  }
}
