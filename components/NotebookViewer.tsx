'use client';
import { useMemo } from 'react';
import { usePyodide } from '@/hooks/usePyodide';
import CodeCell from './CodeCell';
import type { ParsedData } from '@/lib/chartDataProcessor';
import { getColumnsByType } from '@/lib/chartDataProcessor';

interface Props {
  parsedData: ParsedData;
  csvData: string;
  fileName: string;
}

function buildCells(parsedData: ParsedData, fileName: string) {
  const { headers, columnInfo } = parsedData;
  const numCols = getColumnsByType(columnInfo, 'numeric');
  const catCols = getColumnsByType(columnInfo, 'categorical', 'boolean');
  const nc1 = numCols[0] ?? 'value';
  const nc2 = numCols[1] ?? numCols[0] ?? 'value';
  const cc1 = catCols[0] ?? headers[0] ?? 'category';

  const IMG_FOOTER = `
buf = BytesIO()
plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='#1a1a2e', edgecolor='none')
buf.seek(0)
img_b64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close()
print(f'__IMG_BASE64__:{img_b64}')
`;

  return [
    {
      title: 'Load CSV',
      code: `import pandas as pd
from io import StringIO

csv_str = __csv_data__
df = pd.read_csv(StringIO(csv_str))
print(f"Loaded {len(df)} rows × {len(df.columns)} columns")
print(df.head())`,
      explanation: `Loads the CSV data from the browser's memory into a pandas DataFrame using StringIO.
__csv_data__ is injected automatically from the uploaded file.
df.head() prints the first 5 rows to confirm the data loaded correctly.`,
    },
    {
      title: 'Shape & Info',
      code: `print("Shape:", df.shape)
print("\\nColumn types:")
print(df.dtypes)`,
      explanation: `df.shape returns (rows, columns) — tells you the size of the dataset.
df.dtypes lists each column and its inferred data type (int64, float64, object, etc.).
Use this to quickly spot columns that need type conversion.`,
    },
    {
      title: 'Descriptive Stats',
      code: `print(df.describe(include='all').to_string())`,
      explanation: `df.describe() computes count, mean, std, min, quartiles, and max for all columns.
include='all' extends the summary to categorical columns (unique counts, top values).
This is the fastest way to understand the range and distribution of each feature.`,
    },
    {
      title: 'Missing Values',
      code: `missing = df.isnull().sum()
pct = (missing / len(df) * 100).round(2)
print(pd.DataFrame({'count': missing, 'pct': pct})[missing > 0])`,
      explanation: `df.isnull().sum() counts missing values per column.
We compute the percentage missing to gauge how much data is absent.
Columns with > 30% missing often require imputation or removal.`,
    },
    {
      title: 'Duplicates',
      code: `dup_count = df.duplicated().sum()
print(f"Duplicate rows: {dup_count}")
if dup_count > 0:
    df = df.drop_duplicates()
    print(f"Removed. New shape: {df.shape}")`,
      explanation: `df.duplicated() marks each row that is an exact copy of a previous row.
.sum() counts all duplicates.
drop_duplicates() removes them, keeping only the first occurrence.`,
    },
    {
      title: 'Correlation Matrix',
      code: `numeric_df = df.select_dtypes(include='number')
print(numeric_df.corr().round(3).to_string())`,
      explanation: `select_dtypes(include='number') keeps only numeric columns.
.corr() computes the Pearson correlation coefficient between every pair of columns.
Values close to 1 or -1 indicate strong linear relationships.`,
    },
    {
      title: 'Value Counts',
      code: `cat_cols = df.select_dtypes(include='object').columns.tolist()
for col in cat_cols[:3]:
    print(f"\\n{col}:")
    print(df[col].value_counts().head(10))`,
      explanation: `Iterates over up to 3 categorical columns and prints their top 10 value frequencies.
This reveals class imbalance and the cardinality of categorical features.
High cardinality (many unique values) may require encoding strategies.`,
    },
    {
      title: 'Distribution Plot',
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import numpy as np
from scipy.stats import gaussian_kde

col = '${nc1}'
data = df[col].dropna().values.astype(float)

fig, ax = plt.subplots(figsize=(10, 5))
ax.hist(data, bins=25, color='#6366f1', alpha=0.6, density=True, label='Histogram')
kde = gaussian_kde(data)
xs = np.linspace(data.min(), data.max(), 300)
ax.plot(xs, kde(xs), color='#06b6d4', lw=2, label='KDE')
ax.set_title(f'Distribution of {col}', color='white')
ax.set_facecolor('#0d1117')
fig.patch.set_facecolor('#1a1a2e')
ax.tick_params(colors='#94a3b8')
ax.legend(facecolor='#1a1a2e', labelcolor='white')
${IMG_FOOTER}`,
      explanation: `Plots a histogram (density=True normalizes it) overlaid with a KDE curve.
gaussian_kde estimates the smooth probability density function.
The dual-layer view shows both the raw frequency distribution and its smooth estimate.`,
    },
    {
      title: 'Pie Chart',
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
from io import BytesIO
import base64

col = '${cc1}'
counts = df[col].value_counts().head(8)
colors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']

fig, ax = plt.subplots(figsize=(8, 8))
ax.pie(counts.values, labels=counts.index, autopct='%1.1f%%',
       colors=colors, textprops={'color': 'white'}, startangle=90)
ax.set_title(f'{col} Distribution', color='white', pad=20)
fig.patch.set_facecolor('#1a1a2e')
${IMG_FOOTER}`,
      explanation: `value_counts().head(8) gets the top 8 categories by frequency.
autopct='%1.1f%%' adds percentage labels to each slice.
startangle=90 places the first slice at the top.`,
    },
    {
      title: 'Violin Plot',
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
from io import BytesIO
import base64

num_col = '${nc1}'
cat_col = '${cc1}'

groups = [df[df[cat_col]==v][num_col].dropna().values for v in df[cat_col].unique()[:6]]
labels = list(df[cat_col].unique()[:6])

fig, ax = plt.subplots(figsize=(10, 6))
parts = ax.violinplot(groups, showmedians=True, showextrema=True)
for i, pc in enumerate(parts['bodies']):
    pc.set_facecolor(['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6'][i % 6])
    pc.set_alpha(0.7)
ax.set_xticks(range(1, len(labels)+1))
ax.set_xticklabels(labels, color='#94a3b8', rotation=20)
ax.set_title(f'{num_col} by {cat_col}', color='white')
ax.set_facecolor('#0d1117')
fig.patch.set_facecolor('#1a1a2e')
ax.tick_params(colors='#94a3b8')
${IMG_FOOTER}`,
      explanation: `violinplot shows the full distribution shape (wide = more data) for each group.
showmedians=True draws a white line at the median of each group.
Comparing widths across groups reveals distributional differences.`,
    },
    {
      title: 'Correlation Heatmap',
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import numpy as np

numeric_df = df.select_dtypes(include='number')
corr = numeric_df.corr()
cols = corr.columns
n = len(cols)

fig, ax = plt.subplots(figsize=(max(6, n), max(5, n-1)))
im = ax.imshow(corr.values, cmap='coolwarm', vmin=-1, vmax=1)
ax.set_xticks(range(n)); ax.set_yticks(range(n))
ax.set_xticklabels(cols, rotation=45, ha='right', color='#94a3b8', fontsize=9)
ax.set_yticklabels(cols, color='#94a3b8', fontsize=9)
for i in range(n):
    for j in range(n):
        ax.text(j, i, f'{corr.values[i,j]:.2f}', ha='center', va='center',
                color='white' if abs(corr.values[i,j]) > 0.5 else '#94a3b8', fontsize=8)
plt.colorbar(im, ax=ax)
ax.set_title('Correlation Matrix', color='white', pad=12)
ax.set_facecolor('#0d1117')
fig.patch.set_facecolor('#1a1a2e')
${IMG_FOOTER}`,
      explanation: `imshow renders the correlation matrix as a colour grid (coolwarm: blue=negative, red=positive).
Annotating each cell with the numeric value aids interpretation.
Look for off-diagonal values near ±1 to find highly correlated feature pairs.`,
    },
    {
      title: 'Pair Plot',
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import numpy as np

num_cols = df.select_dtypes(include='number').columns[:4].tolist()
n = len(num_cols)
fig, axes = plt.subplots(n, n, figsize=(3*n, 3*n))
fig.patch.set_facecolor('#1a1a2e')

for i, c1 in enumerate(num_cols):
    for j, c2 in enumerate(num_cols):
        ax = axes[i][j]
        ax.set_facecolor('#0d1117')
        ax.tick_params(colors='#94a3b8', labelsize=7)
        if i == j:
            ax.hist(df[c1].dropna(), bins=20, color='#6366f1', alpha=0.7)
        else:
            ax.scatter(df[c2], df[c1], alpha=0.4, s=8, color='#06b6d4')
        if i == n-1: ax.set_xlabel(c2, color='#94a3b8', fontsize=8)
        if j == 0:   ax.set_ylabel(c1, color='#94a3b8', fontsize=8)

plt.tight_layout()
${IMG_FOOTER}`,
      explanation: `Creates an NxN grid where diagonal cells show histograms and off-diagonal cells show scatter plots.
This lets you see all pairwise relationships and individual distributions in one view.
Limited to 4 columns for readability — edit num_cols to change the selection.`,
    },
    {
      title: 'Joint Plot',
      code: `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import numpy as np
from scipy.stats import gaussian_kde

x_col, y_col = '${nc1}', '${nc2}'
x = df[x_col].dropna().values.astype(float)
y = df[y_col].dropna().values.astype(float)
n = min(len(x), len(y))
x, y = x[:n], y[:n]

fig = plt.figure(figsize=(8, 8))
fig.patch.set_facecolor('#1a1a2e')
gs = fig.add_gridspec(4, 4)
ax_joint = fig.add_subplot(gs[1:, :3])
ax_top   = fig.add_subplot(gs[0, :3])
ax_right = fig.add_subplot(gs[1:, 3])

ax_joint.scatter(x, y, alpha=0.4, s=12, color='#6366f1')
ax_joint.set_xlabel(x_col, color='#94a3b8'); ax_joint.set_ylabel(y_col, color='#94a3b8')
ax_joint.set_facecolor('#0d1117'); ax_joint.tick_params(colors='#94a3b8')

ax_top.hist(x, bins=20, color='#06b6d4', alpha=0.7); ax_top.set_facecolor('#0d1117')
ax_top.tick_params(colors='#94a3b8', labelbottom=False)

ax_right.hist(y, bins=20, color='#10b981', alpha=0.7, orientation='horizontal')
ax_right.set_facecolor('#0d1117'); ax_right.tick_params(colors='#94a3b8', labelleft=False)

plt.tight_layout()
${IMG_FOOTER}`,
      explanation: `A joint plot combines a central scatter with marginal histograms on the top and right.
The marginal distributions let you see the shape of each variable independently.
GridSpec creates a flexible layout with different subplot sizes.`,
    },
    {
      title: 'Custom Code',
      code: `# Your code here
# The DataFrame is available as: df
# Example: print(df['${nc1}'].describe())
print(df.head())`,
      explanation: `This cell is yours to experiment with.
The DataFrame df contains your cleaned data with all columns available.
Try custom aggregations, filters, or additional visualizations.`,
    },
  ];
}

export default function NotebookViewer({ parsedData, csvData, fileName }: Props) {
  const { ready, loading, error: pyError, runCode } = usePyodide();

  const cells = useMemo(() => buildCells(parsedData, fileName), [parsedData, fileName]);

  async function handleRun(code: string): Promise<string> {
    return runCode(code, csvData);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading Python runtime (Pyodide)…</p>
        <p className="text-slate-500 text-xs">Downloading pandas, numpy, matplotlib, scipy (~30 MB)</p>
      </div>
    );
  }

  if (pyError) {
    return (
      <div className="rounded-lg border border-red-700/40 bg-red-900/10 p-4 text-sm text-red-400">
        Failed to load Pyodide: {pyError}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-200">Python Notebook</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {cells.length} cells · {parsedData.rowCount} rows · {parsedData.headers.length} columns
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${ready ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
          {ready ? '● Python ready' : '○ Loading…'}
        </span>
      </div>

      {cells.map((cell, i) => (
        <CodeCell
          key={i}
          cellIndex={i}
          title={cell.title}
          code={cell.code}
          explanation={cell.explanation}
          onRun={handleRun}
        />
      ))}
    </div>
  );
}
