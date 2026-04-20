'use client';
import type { ColumnInfo, ColumnType } from '@/lib/chartDataProcessor';

interface DropdownProps {
  label: string;
  columns: string[];
  columnInfo: Record<string, ColumnInfo>;
  filterTypes?: ColumnType[];
  value: string;
  onChange: (v: string) => void;
}

export function ColumnDropdown({ label, columns, columnInfo, filterTypes, value, onChange }: DropdownProps) {
  const filtered = filterTypes
    ? columns.filter((c) => filterTypes.includes(columnInfo[c]?.type))
    : columns;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 text-slate-200 focus:outline-none focus:border-indigo-500"
      >
        <option value="">— select —</option>
        {filtered.map((c) => (
          <option key={c} value={c}>
            {c} ({columnInfo[c]?.type ?? '?'})
          </option>
        ))}
      </select>
    </div>
  );
}

interface MultiProps {
  label: string;
  columns: string[];
  columnInfo: Record<string, ColumnInfo>;
  filterTypes?: ColumnType[];
  selected: string[];
  onChange: (cols: string[]) => void;
  max?: number;
}

export function MultiColumnSelector({ label, columns, columnInfo, filterTypes, selected, onChange, max = 10 }: MultiProps) {
  const filtered = filterTypes
    ? columns.filter((c) => filterTypes.includes(columnInfo[c]?.type))
    : columns;

  function toggle(col: string) {
    if (selected.includes(col)) {
      onChange(selected.filter((c) => c !== col));
    } else if (selected.length < max) {
      onChange([...selected, col]);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">
        {label} <span className="text-slate-500">({selected.length}/{max})</span>
      </label>
      <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1 rounded border border-slate-700 bg-slate-800/50">
        {filtered.map((c) => (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              selected.includes(c)
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
