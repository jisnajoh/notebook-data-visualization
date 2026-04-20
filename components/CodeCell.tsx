'use client';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { tryRepair } from '@/lib/pythonAssistant';

interface Props {
  cellIndex: number;
  title: string;
  code: string;
  explanation: string;
  onRun: (code: string) => Promise<string>;
}

export default function CodeCell({ cellIndex, title, code, explanation, onRun }: Props) {
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [repairSuggestion, setRepairSuggestion] = useState<{ code: string; explanation: string } | null>(null);
  const [editedCode, setEditedCode] = useState(code);
  const [editing, setEditing] = useState(false);

  async function run() {
    setRunning(true);
    setRepairSuggestion(null);
    const result = await onRun(editedCode);
    setOutput(result);
    setRunning(false);

    if (result.includes('Error') || result.includes('Traceback')) {
      const repair = tryRepair(editedCode, result);
      if (repair.fixed || repair.explanation) {
        setRepairSuggestion({ code: repair.code, explanation: repair.explanation });
      }
    }
  }

  function applyRepair() {
    if (repairSuggestion) {
      setEditedCode(repairSuggestion.code);
      setRepairSuggestion(null);
    }
  }

  const outputLines = (output ?? '').split('\n');

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">In [{cellIndex + 1}]</span>
          <span className="text-sm font-medium text-slate-200">{title}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showExplanation ? 'Hide' : 'Explain'}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {editing ? 'View' : 'Edit'}
          </button>
          <button
            onClick={run}
            disabled={running}
            className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {running ? '⏳ Running…' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="px-4 py-3 bg-slate-900/50 text-xs text-slate-400 border-b border-slate-700 leading-relaxed whitespace-pre-line">
          {explanation}
        </div>
      )}

      {/* Code */}
      {editing ? (
        <textarea
          value={editedCode}
          onChange={(e) => setEditedCode(e.target.value)}
          className="w-full bg-slate-900 text-slate-200 font-mono text-xs p-4 outline-none resize-y min-h-[120px]"
          spellCheck={false}
        />
      ) : (
        <div className="syntax-cell">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{ margin: 0, background: '#0d1117', fontSize: '0.82rem', borderRadius: 0 }}
          >
            {editedCode}
          </SyntaxHighlighter>
        </div>
      )}

      {/* Output */}
      {output !== null && (
        <div className="border-t border-slate-700 bg-slate-900 px-4 py-3 cell-output">
          <p className="text-xs text-slate-500 mb-1 font-mono">Out [{cellIndex + 1}]:</p>
          {outputLines.map((line, i) => {
            if (line.startsWith('__IMG_BASE64__:')) {
              const b64 = line.replace('__IMG_BASE64__:', '');
              return (
                <img
                  key={i}
                  src={`data:image/png;base64,${b64}`}
                  alt="matplotlib output"
                  className="max-w-full rounded mt-1"
                />
              );
            }
            return <pre key={i} className="text-xs">{line}</pre>;
          })}
        </div>
      )}

      {/* AI Repair suggestion */}
      {repairSuggestion && (
        <div className="border-t border-yellow-700/40 bg-yellow-900/10 px-4 py-3">
          <p className="text-xs font-medium text-yellow-400 mb-1">AI Repair Suggestion</p>
          <p className="text-xs text-slate-400 mb-2">{repairSuggestion.explanation}</p>
          {repairSuggestion.code !== editedCode && (
            <button
              onClick={applyRepair}
              className="text-xs px-3 py-1 rounded bg-yellow-600/80 text-white hover:bg-yellow-500 transition-colors"
            >
              Apply Fix
            </button>
          )}
        </div>
      )}
    </div>
  );
}
