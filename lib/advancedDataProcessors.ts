/**
 * Kernel Density Estimation (Gaussian kernel)
 */
export function kde(
  values: number[],
  bandwidth?: number,
  points = 100
): { x: number; y: number }[] {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min || 1;
  const h = bandwidth ?? (1.06 * std(values) * Math.pow(values.length, -0.2));

  const result: { x: number; y: number }[] = [];
  for (let i = 0; i <= points; i++) {
    const x = min - range * 0.1 + ((range * 1.2) / points) * i;
    const y =
      values.reduce((sum, v) => {
        const u = (x - v) / h;
        return sum + Math.exp(-0.5 * u * u);
      }, 0) /
      (values.length * h * Math.sqrt(2 * Math.PI));
    result.push({ x, y });
  }
  return result;
}

export function std(values: number[]): number {
  if (values.length < 2) return 1;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function histogram(values: number[], bins = 20): { x: number; y: number; width: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / width), bins - 1);
    counts[idx]++;
  }
  return counts.map((count, i) => ({
    x: min + i * width + width / 2,
    y: count,
    width,
  }));
}

export function skewness(values: number[]): number {
  if (values.length < 3) return 0;
  const m = mean(values);
  const s = std(values);
  if (s === 0) return 0;
  return (
    values.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) / values.length
  );
}
