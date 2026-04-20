export type ChartTypeId =
  | 'DistPlot'
  | 'PieChart'
  | 'ViolinPlot'
  | 'HeatMap'
  | 'PairPlot'
  | 'JointPlot'
  | 'BarChart'
  | 'Histogram'
  | 'ScatterPlot'
  | 'LineChart';

export interface ChartTypeDef {
  id: ChartTypeId;
  label: string;
  description: string;
  icon: string;
  requiredNumeric: number;
  requiredCategorical: number;
  supportsMultiColumn: boolean;
}

export const CHART_TYPES: ChartTypeDef[] = [
  {
    id: 'DistPlot',
    label: 'Distribution Plot',
    description: 'Show the distribution of a numeric column with KDE curve',
    icon: '📊',
    requiredNumeric: 1,
    requiredCategorical: 0,
    supportsMultiColumn: false,
  },
  {
    id: 'PieChart',
    label: 'Pie Chart',
    description: 'Show proportions of categories in a column',
    icon: '🥧',
    requiredNumeric: 0,
    requiredCategorical: 1,
    supportsMultiColumn: false,
  },
  {
    id: 'ViolinPlot',
    label: 'Violin Plot',
    description: 'Show distribution of a numeric column grouped by a category',
    icon: '🎻',
    requiredNumeric: 1,
    requiredCategorical: 1,
    supportsMultiColumn: false,
  },
  {
    id: 'HeatMap',
    label: 'Heat Map',
    description: 'Show correlation matrix of multiple numeric columns',
    icon: '🔥',
    requiredNumeric: 2,
    requiredCategorical: 0,
    supportsMultiColumn: true,
  },
  {
    id: 'PairPlot',
    label: 'Pair Plot',
    description: 'Show all pairwise scatter plots of selected numeric columns',
    icon: '🔢',
    requiredNumeric: 2,
    requiredCategorical: 0,
    supportsMultiColumn: true,
  },
  {
    id: 'JointPlot',
    label: 'Joint Plot',
    description: 'Scatter plot with marginal distributions for two numeric columns',
    icon: '🔗',
    requiredNumeric: 2,
    requiredCategorical: 0,
    supportsMultiColumn: false,
  },
  {
    id: 'BarChart',
    label: 'Bar Chart',
    description: 'Compare a numeric measure across categories',
    icon: '📈',
    requiredNumeric: 1,
    requiredCategorical: 1,
    supportsMultiColumn: false,
  },
  {
    id: 'Histogram',
    label: 'Histogram',
    description: 'Show frequency distribution of a numeric column',
    icon: '📉',
    requiredNumeric: 1,
    requiredCategorical: 0,
    supportsMultiColumn: false,
  },
  {
    id: 'ScatterPlot',
    label: 'Scatter Plot',
    description: 'Plot two numeric columns against each other',
    icon: '✨',
    requiredNumeric: 2,
    requiredCategorical: 0,
    supportsMultiColumn: false,
  },
  {
    id: 'LineChart',
    label: 'Line Chart',
    description: 'Show trends over a numeric or datetime axis',
    icon: '📐',
    requiredNumeric: 2,
    requiredCategorical: 0,
    supportsMultiColumn: false,
  },
];

export const CHART_TYPE_MAP = Object.fromEntries(
  CHART_TYPES.map((c) => [c.id, c])
) as Record<ChartTypeId, ChartTypeDef>;
