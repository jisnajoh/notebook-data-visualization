'use client';
import { useState } from 'react';
import { tryRepair } from '@/lib/pythonAssistant';

interface Props {
  code: string;
  error: string;
  onApply: (fixedCode: string) => void;
}

export default function AIAssistant({ code, error, onApply }: Props) {
  const [expanded, setExpanded] = useState(true);
  const repair = tryRepair(code, error);

  return (
    <div className="rounded-lg border border-yellow-700/30 bg-yellow-900/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-left"
      >
        <span className="text-sm font-medium text-yellow-400">AI Assistant — Error Repair</span>
        <span className="text-yellow-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Error detected:</p>
            <pre className="text-xs text-red-400 bg-red-900/20 rounded p-2 overflow-auto">{error}</pre>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Suggestion:</p>
            <p className="text-xs text-slate-300">{repair.explanation}</p>
          </div>
          {repair.fixed && repair.code !== code && (
            <button
              onClick={() => onApply(repair.code)}
              className="text-xs px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-500 transition-colors"
            >
              Apply Fix & Re-run
            </button>
          )}
        </div>
      )}
    </div>
  );
}
