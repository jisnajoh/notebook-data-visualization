import type { ChartTypeId } from './chartTypes';

export const CHART_REGISTRY: Record<ChartTypeId, string> = {
  DistPlot: 'UniversalDistPlot',
  PieChart: 'UniversalPieChart',
  ViolinPlot: 'UniversalViolinPlot',
  HeatMap: 'UniversalHeatMap',
  PairPlot: 'UniversalPairPlot',
  JointPlot: 'UniversalJointPlot',
  BarChart: 'UniversalBarChart',
  Histogram: 'UniversalHistogram',
  ScatterPlot: 'UniversalScatterChart',
  LineChart: 'UniversalLineChart',
};
