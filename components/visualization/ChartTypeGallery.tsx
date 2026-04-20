'use client';
import { CHART_TYPES, type ChartTypeId } from '@/lib/chartTypes';

interface Props {
  selected: ChartTypeId | null;
  onSelect: (id: ChartTypeId) => void;
}

export default function ChartTypeGallery({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {CHART_TYPES.map((ct) => (
        <button
          key={ct.id}
          onClick={() => onSelect(ct.id)}
          className={`rounded-lg p-3 text-left transition-all border ${
            selected === ct.id
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
          }`}
        >
          <div className="text-2xl mb-1">{ct.icon}</div>
          <div className="text-xs font-medium text-slate-200">{ct.label}</div>
          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ct.description}</div>
        </button>
      ))}
    </div>
  );
}
