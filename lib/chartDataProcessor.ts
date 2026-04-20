export type ColumnType = 'numeric' | 'categorical' | 'boolean' | 'datetime';

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  uniqueValues: number;
  nullCount: number;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
}

export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  columnInfo: Record<string, ColumnInfo>;
  rowCount: number;
}

function isDateColumn(values: string[]): boolean {
  const nonEmpty = values.filter((v) => v != null && v.trim() !== '');
  if (nonEmpty.length === 0) return false;
  let validDates = 0;
  for (const strVal of nonEmpty.slice(0, 50)) {
    // Skip pure numbers — new Date("63") is valid but misleading
    if (/^-?\d+(\.\d+)?$/.test(strVal.trim())) continue;
    const d = new Date(strVal);
    if (!isNaN(d.getTime())) validDates++;
  }
  const sample = Math.min(nonEmpty.length, 50);
  const pureSampled = nonEmpty.slice(0, 50).filter((v) => /^-?\d+(\.\d+)?$/.test(v.trim())).length;
  return validDates / (sample - pureSampled || 1) > 0.7;
}

export function detectColumnType(values: string[]): ColumnType {
  const nonEmpty = values.filter((v) => v != null && v.trim() !== '' && v.toLowerCase() !== 'nan');
  if (nonEmpty.length === 0) return 'categorical';

  const boolSet = new Set(nonEmpty.map((v) => v.trim()));
  if (boolSet.size <= 2 && [...boolSet].every((v) => v === '0' || v === '1')) {
    return 'boolean';
  }

  const numericCount = nonEmpty.filter((v) => !isNaN(Number(v.trim())) && v.trim() !== '').length;
  if (numericCount / nonEmpty.length > 0.8) return 'numeric';

  if (isDateColumn(nonEmpty)) return 'datetime';

  return 'categorical';
}

export function computeColumnStats(
  values: string[],
  type: ColumnType
): Partial<ColumnInfo> {
  const nonEmpty = values.filter((v) => v != null && v.trim() !== '' && v.toLowerCase() !== 'nan');
  const nullCount = values.length - nonEmpty.length;
  const uniqueValues = new Set(nonEmpty).size;

  if (type === 'numeric' || type === 'boolean') {
    const nums = nonEmpty.map(Number).filter((n) => isFinite(n));
    if (nums.length === 0) return { nullCount, uniqueValues };
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
    const std = Math.sqrt(variance);
    return { nullCount, uniqueValues, min, max, mean, std };
  }

  return { nullCount, uniqueValues };
}

export function processCSV(rows: Record<string, string>[]): ParsedData {
  if (rows.length === 0) return { headers: [], rows: [], columnInfo: {}, rowCount: 0 };

  const headers = Object.keys(rows[0]);
  const columnInfo: Record<string, ColumnInfo> = {};

  for (const header of headers) {
    const values = rows.map((r) => String(r[header] ?? ''));
    const type = detectColumnType(values);
    const stats = computeColumnStats(values, type);
    columnInfo[header] = { name: header, type, ...stats } as ColumnInfo;
  }

  return { headers, rows, columnInfo, rowCount: rows.length };
}

export function cleanCSV(rows: Record<string, string>[]): Record<string, string>[] {
  // Normalize headers
  const normalize = (key: string) =>
    key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const normalized = rows.map((row) => {
    const newRow: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      newRow[normalize(k)] = typeof v === 'string' ? v.trim() : String(v ?? '');
    }
    return newRow;
  });

  // Remove exact duplicate rows
  const seen = new Set<string>();
  return normalized.filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getColumnsByType(
  columnInfo: Record<string, ColumnInfo>,
  ...types: ColumnType[]
): string[] {
  return Object.entries(columnInfo)
    .filter(([, info]) => types.includes(info.type))
    .map(([name]) => name);
}

export function buildChartData(
  parsedData: ParsedData,
  columns: string[],
  chartType: string
): unknown {
  const { rows, columnInfo } = parsedData;

  switch (chartType) {
    case 'DistPlot':
    case 'Histogram': {
      const col = columns[0];
      const vals = rows.map((r) => Number(r[col])).filter((n) => isFinite(n));
      return { values: vals, label: col };
    }
    case 'PieChart': {
      const col = columns[0];
      const counts: Record<string, number> = {};
      for (const row of rows) {
        const v = String(row[col] ?? 'unknown');
        counts[v] = (counts[v] ?? 0) + 1;
      }
      return { labels: Object.keys(counts), values: Object.values(counts) };
    }
    case 'BarChart': {
      const [catCol, numCol] = columns;
      const sums: Record<string, number> = {};
      const cnts: Record<string, number> = {};
      for (const row of rows) {
        const k = String(row[catCol] ?? '');
        const v = Number(row[numCol]);
        if (isFinite(v)) {
          sums[k] = (sums[k] ?? 0) + v;
          cnts[k] = (cnts[k] ?? 0) + 1;
        }
      }
      const labels = Object.keys(sums);
      return { labels, values: labels.map((l) => sums[l] / cnts[l]) };
    }
    case 'ScatterPlot':
    case 'JointPlot': {
      const [xCol, yCol] = columns;
      const points = rows
        .map((r) => ({ x: Number(r[xCol]), y: Number(r[yCol]) }))
        .filter((p) => isFinite(p.x) && isFinite(p.y));
      return { points, xLabel: xCol, yLabel: yCol };
    }
    case 'LineChart': {
      const [xCol, yCol] = columns;
      const points = rows
        .map((r) => ({ x: r[xCol], y: Number(r[yCol]) }))
        .filter((p) => isFinite(p.y));
      return { points, xLabel: xCol, yLabel: yCol };
    }
    case 'ViolinPlot': {
      const [numCol, catCol] = columns;
      const groups: Record<string, number[]> = {};
      for (const row of rows) {
        const cat = String(row[catCol] ?? 'unknown');
        const val = Number(row[numCol]);
        if (isFinite(val)) {
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(val);
        }
      }
      return { groups, numLabel: numCol, catLabel: catCol };
    }
    case 'HeatMap': {
      const numCols = columns.filter(
        (c) => columnInfo[c]?.type === 'numeric' || columnInfo[c]?.type === 'boolean'
      );
      const matrix: number[][] = numCols.map((c1) =>
        numCols.map((c2) => pearsonCorrelation(rows, c1, c2))
      );
      return { matrix, labels: numCols };
    }
    case 'PairPlot': {
      const numCols = columns.filter(
        (c) => columnInfo[c]?.type === 'numeric'
      );
      return { columns: numCols, rows };
    }
    default:
      return {};
  }
}

function pearsonCorrelation(
  rows: Record<string, string>[],
  col1: string,
  col2: string
): number {
  const vals1 = rows.map((r) => Number(r[col1])).filter((n) => isFinite(n));
  const vals2 = rows.map((r) => Number(r[col2])).filter((n) => isFinite(n));
  const n = Math.min(vals1.length, vals2.length);
  if (n < 2) return 0;
  const mean1 = vals1.reduce((a, b) => a + b, 0) / n;
  const mean2 = vals2.reduce((a, b) => a + b, 0) / n;
  let num = 0, d1 = 0, d2 = 0;
  for (let i = 0; i < n; i++) {
    const a = vals1[i] - mean1;
    const b = vals2[i] - mean2;
    num += a * b;
    d1 += a * a;
    d2 += b * b;
  }
  const denom = Math.sqrt(d1 * d2);
  return denom === 0 ? 0 : num / denom;
}
