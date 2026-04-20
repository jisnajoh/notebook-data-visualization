import type { ColumnInfo, ParsedData } from './chartDataProcessor';
import { skewness, mean, std } from './advancedDataProcessors';

interface ColumnKnowledge {
  label: string;
  description: string;
  insight: (stats: Partial<ColumnInfo>) => string;
  pairInsight?: (otherCol: string) => string;
}

const COLUMN_KNOWLEDGE: Record<string, ColumnKnowledge> = {
  age: {
    label: 'Age',
    description: 'Patient or subject age in years',
    insight: (s) =>
      s.mean != null
        ? `Mean age is ${s.mean.toFixed(1)} years (range ${s.min}–${s.max}).`
        : 'Age distribution loaded.',
    pairInsight: (other) => `Age vs ${other} may reveal age-related trends.`,
  },
  chol: {
    label: 'Cholesterol',
    description: 'Serum cholesterol in mg/dl',
    insight: (s) =>
      s.mean != null
        ? `Average cholesterol ${s.mean.toFixed(0)} mg/dl. Values above 200 mg/dl indicate elevated risk.`
        : 'Cholesterol data loaded.',
  },
  trtbps: {
    label: 'Resting Blood Pressure',
    description: 'Resting blood pressure in mm Hg',
    insight: (s) =>
      s.mean != null
        ? `Mean BP ${s.mean.toFixed(0)} mmHg. Values above 130 warrant clinical attention.`
        : 'Blood pressure data loaded.',
  },
  thalachh: {
    label: 'Max Heart Rate',
    description: 'Maximum heart rate achieved',
    insight: (s) =>
      s.mean != null
        ? `Mean max heart rate ${s.mean.toFixed(0)} bpm. Lower rates may suggest cardiac stress.`
        : 'Heart rate data loaded.',
  },
  output: {
    label: 'Heart Disease Output',
    description: 'Target: 1 = disease present, 0 = absent',
    insight: (s) =>
      s.mean != null
        ? `Prevalence: ${(s.mean * 100).toFixed(1)}% positive cases in dataset.`
        : 'Output labels loaded.',
  },
  sepal_length: {
    label: 'Sepal Length',
    description: 'Sepal length in cm',
    insight: (s) =>
      s.mean != null ? `Mean sepal length ${s.mean.toFixed(2)} cm.` : 'Sepal length loaded.',
    pairInsight: () => 'Sepal dimensions often strongly correlate with species.',
  },
  petal_length: {
    label: 'Petal Length',
    description: 'Petal length in cm',
    insight: (s) =>
      s.mean != null ? `Mean petal length ${s.mean.toFixed(2)} cm.` : 'Petal length loaded.',
  },
  sales: {
    label: 'Sales',
    description: 'Sales amount',
    insight: (s) =>
      s.mean != null
        ? `Average sales ${s.mean.toFixed(2)} (range ${s.min}–${s.max}).`
        : 'Sales data loaded.',
  },
  revenue: {
    label: 'Revenue',
    description: 'Revenue amount',
    insight: (s) =>
      s.mean != null ? `Average revenue ${s.mean.toFixed(2)}.` : 'Revenue data loaded.',
  },
};

export interface AnalysisResult {
  datasetName: string;
  context: string;
  insights: string[];
  columnSuitability: string;
}

function getKnowledge(col: string): ColumnKnowledge | null {
  return COLUMN_KNOWLEDGE[col.toLowerCase()] ?? null;
}

function describeDistribution(values: number[]): string {
  const sk = skewness(values);
  const m = mean(values);
  const s = std(values);
  let shape = 'approximately symmetric';
  if (sk > 1) shape = 'right-skewed (long tail to the right)';
  else if (sk < -1) shape = 'left-skewed (long tail to the left)';
  const cv = s / (Math.abs(m) || 1);
  const spread = cv > 0.5 ? 'high variability' : cv > 0.2 ? 'moderate variability' : 'low variability';
  return `Distribution is ${shape} with ${spread} (CV=${cv.toFixed(2)}).`;
}

function numericValues(rows: Record<string, string>[], col: string): number[] {
  return rows.map((r) => Number(r[col])).filter((n) => isFinite(n));
}

export function generateAnalysis(
  chartType: string,
  columns: string[],
  parsedData: ParsedData
): AnalysisResult {
  const { rows, columnInfo } = parsedData;
  const insights: string[] = [];

  for (const col of columns) {
    const info = columnInfo[col];
    const knowledge = getKnowledge(col);
    if (knowledge) {
      insights.push(knowledge.insight(info));
    }
  }

  const numCols = columns.filter(
    (c) => columnInfo[c]?.type === 'numeric' || columnInfo[c]?.type === 'boolean'
  );

  switch (chartType) {
    case 'DistPlot':
    case 'Histogram': {
      const col = columns[0];
      const vals = numericValues(rows, col);
      if (vals.length > 0) insights.push(describeDistribution(vals));
      break;
    }
    case 'PieChart': {
      const col = columns[0];
      const counts: Record<string, number> = {};
      for (const row of rows) {
        const v = String(row[col] ?? '');
        counts[v] = (counts[v] ?? 0) + 1;
      }
      const total = rows.length;
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (dominant) {
        insights.push(
          `"${dominant[0]}" is the most common category at ${((dominant[1] / total) * 100).toFixed(1)}%.`
        );
      }
      break;
    }
    case 'HeatMap': {
      if (numCols.length > 1) {
        insights.push(
          `Correlation matrix across ${numCols.length} numeric columns. Values near ±1 indicate strong linear relationships.`
        );
      }
      break;
    }
    case 'ScatterPlot':
    case 'JointPlot': {
      const [c1, c2] = columns;
      const k1 = getKnowledge(c1);
      if (k1?.pairInsight) insights.push(k1.pairInsight(c2));
      break;
    }
    case 'ViolinPlot': {
      const [numCol] = columns;
      const vals = numericValues(rows, numCol);
      if (vals.length > 0) insights.push(describeDistribution(vals));
      break;
    }
  }

  const datasetName = columns.slice(0, 3).map((c) => getKnowledge(c)?.label ?? c).join(', ');
  const context = `Analyzing ${parsedData.rowCount} rows across columns: ${columns.join(', ')}.`;
  const columnSuitability =
    columns.every((c) => columnInfo[c])
      ? `All ${columns.length} selected column(s) are suitable for this chart type.`
      : 'Some columns may have missing type information.';

  return { datasetName, context, insights, columnSuitability };
}
