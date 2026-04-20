'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface PyodideInterface {
  loadPackage: (pkgs: string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { set: (key: string, value: unknown) => void };
}

declare global {
  interface Window {
    loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

export function usePyodide() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pyRef = useRef<PyodideInterface | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      try {
        // Load Pyodide script
        if (!document.getElementById('pyodide-script')) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'pyodide-script';
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide'));
            document.head.appendChild(script);
          });
        }
        const py = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        await py.loadPackage(['pandas', 'numpy', 'matplotlib', 'scipy']);
        if (mounted) {
          pyRef.current = py;
          setReady(true);
        }
      } catch (e) {
        if (mounted) setError(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  const runCode = useCallback(
    async (code: string, csvData?: string): Promise<string> => {
      if (!pyRef.current) return 'Pyodide not ready.';
      try {
        if (csvData) {
          pyRef.current.globals.set('__csv_data__', csvData);
        }
        // Capture stdout
        const wrapped = `
import sys
import io
_stdout = sys.stdout
sys.stdout = io.StringIO()
try:
    exec(${JSON.stringify(code)})
except Exception as e:
    import traceback
    print(traceback.format_exc())
finally:
    _out = sys.stdout.getvalue()
    sys.stdout = _stdout
_out
`;
        const result = await pyRef.current.runPythonAsync(wrapped);
        return String(result ?? '');
      } catch (e) {
        return `Error: ${String(e)}`;
      }
    },
    []
  );

  return { ready, loading, error, runCode };
}
