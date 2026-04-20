import type { ChartTypeId } from './chartTypes';
import type { ColumnInfo } from './chartDataProcessor';

export function suggestChartType(
  columnInfo: Record<string, ColumnInfo>
): ChartTypeId {
  const cols = Object.values(columnInfo);
  const numericCount = cols.filter(
    (c) => c.type === 'numeric' || c.type === 'boolean'
  ).length;
  const categoricalCount = cols.filter((c) => c.type === 'categorical').length;
  const datetimeCount = cols.filter((c) => c.type === 'datetime').length;

  if (datetimeCount >= 1 && numericCount >= 1) return 'LineChart';
  if (numericCount >= 4) return 'HeatMap';
  if (numericCount >= 2 && categoricalCount >= 1) return 'ViolinPlot';
  if (numericCount >= 2) return 'ScatterPlot';
  if (categoricalCount >= 1 && numericCount >= 1) return 'BarChart';
  if (categoricalCount >= 1) return 'PieChart';
  if (numericCount >= 1) return 'Histogram';
  return 'BarChart';
}
