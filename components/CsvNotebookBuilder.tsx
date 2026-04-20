'use client';
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { processCSV, cleanCSV, type ParsedData } from '@/lib/chartDataProcessor';
import { saveLocalWork, loadLocalWorks, deleteLocalWork, type SavedWork } from '@/lib/visualizationStorage';
import { SAMPLE_DATASETS } from '@/lib/sampleDatasets';
import CsvVisualizations from './CsvVisualizations';
import NotebookViewer from './NotebookViewer';

// Firebase imports — optional; gracefully degraded if config is missing
import { getFirebaseAuth, getFirebaseDb, getGoogleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useRef } from 'react';

type Tab = 'upload' | 'cleaning' | 'notebook' | 'visualizations' | 'account';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'upload', label: 'Upload', icon: '📂' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { id: 'notebook', label: 'Notebook', icon: '📓' },
  { id: 'visualizations', label: 'Visualize', icon: '📊' },
  { id: 'account', label: 'Account', icon: '👤' },
];

export default function CsvNotebookBuilder() {
  const [tab, setTab] = useState<Tab>('upload');
  const [rawCsv, setRawCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [cleanedData, setCleanedData] = useState<ParsedData | null>(null);
  const [cleanedCsv, setCleanedCsv] = useState('');
  const [dragging, setDragging] = useState(false);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [savedWorks, setSavedWorks] = useState<SavedWork[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const authInitialized = useRef(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (u) loadCloudWorks(u.uid);
      });
      authInitialized.current = true;
      return unsub;
    } catch { /* Firebase not configured */ }
  }, []);

  useEffect(() => {
    setSavedWorks(loadLocalWorks());
  }, []);

  // ── CSV Parsing ─────────────────────────────────────────────────────────

  function parseFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? '');
      setRawCsv(text);
      Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const cleaned = cleanCSV(result.data);
          const pd = processCSV(cleaned);
          setParsedData(pd);
          // Rebuild cleaned CSV string
          const header = pd.headers.join(',');
          const rows = cleaned.map((r) => pd.headers.map((h) => r[h] ?? '').join(','));
          setCleanedCsv([header, ...rows].join('\n'));
          setCleanedData(pd);
          setTab('cleaning');
        },
      });
    };
    reader.readAsText(file);
  }

  function loadSample(csv: string, name: string) {
    setFileName(name + '.csv');
    setRawCsv(csv);
    Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const cleaned = cleanCSV(result.data);
        const pd = processCSV(cleaned);
        setParsedData(pd);
        const header = pd.headers.join(',');
        const rows = cleaned.map((r) => pd.headers.map((h) => r[h] ?? '').join(','));
        setCleanedCsv([header, ...rows].join('\n'));
        setCleanedData(pd);
        setTab('cleaning');
      },
    });
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  async function signIn() {
    const auth = getFirebaseAuth();
    const googleProvider = getGoogleProvider();
    if (!auth || !googleProvider) {
      setAuthError('Sign-in is unavailable: Firebase is not configured.');
      return;
    }
    try {
      setAuthError('');
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setAuthError(String(e));
    }
  }

  async function handleSignOut() {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try { await signOut(auth); } catch { /* ignore */ }
  }

  // ── Cloud persistence ───────────────────────────────────────────────────

  async function loadCloudWorks(uid: string) {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const q = query(collection(db, 'userWorks'), where('userId', '==', uid), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const works: SavedWork[] = snap.docs.map((d) => ({
        id: d.id,
        fileName: d.data().fileName,
        csvData: d.data().csvData,
        savedAt: d.data().timestamp?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        source: 'cloud',
        cloudId: d.id,
      }));
      setSavedWorks((prev) => {
        const local = prev.filter((w) => w.source === 'local');
        return [...works, ...local];
      });
    } catch { /* Firestore not configured */ }
  }

  async function saveWork() {
    if (!cleanedCsv || !fileName) return;
    const db = getFirebaseDb();
    if (user && db) {
      try {
        await addDoc(collection(db, 'userWorks'), {
          userId: user.uid,
          fileName,
          csvData: cleanedCsv,
          timestamp: serverTimestamp(),
        });
        await loadCloudWorks(user.uid);
        return;
      } catch { /* fallback to local */ }
    }
    const work = saveLocalWork(fileName, cleanedCsv);
    setSavedWorks((prev) => [work, ...prev]);
  }

  async function deleteWork(work: SavedWork) {
    if (!confirm(`Delete "${work.fileName}"?`)) return;
    const db = getFirebaseDb();
    if (work.source === 'cloud' && work.cloudId && db) {
      try {
        await deleteDoc(doc(db, 'userWorks', work.cloudId));
        setSavedWorks((prev) => prev.filter((w) => w.id !== work.id));
        return;
      } catch { /* ignore */ }
    }
    deleteLocalWork(work.id);
    setSavedWorks((prev) => prev.filter((w) => w.id !== work.id));
  }

  function loadWork(work: SavedWork) {
    loadSample(work.csvData, work.fileName.replace(/\.csv$/i, ''));
  }

  // ── Drag-and-drop ───────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) parseFile(file);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  const hasData = !!cleanedData;

  return (
    <div className="min-h-screen" style={{ background: '#0d0d1a' }}>
      {/* Top nav */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-indigo-400">DataMentor</span>
          {fileName && <span className="text-xs text-slate-500 ml-2">· {fileName}</span>}
        </div>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              disabled={!hasData && t.id !== 'upload' && t.id !== 'account'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                tab === t.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Upload ── */}
        {tab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Upload a CSV</h2>
              <p className="text-sm text-slate-400 mt-1">Drag and drop, click to browse, or load a sample dataset.</p>
            </div>

            {/* Drop zone */}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-16 ${
                dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-400 bg-slate-800/30'
              }`}
            >
              <span className="text-4xl">📂</span>
              <p className="text-slate-300 font-medium">Drop CSV here or click to browse</p>
              <p className="text-xs text-slate-500">Supports any comma-separated file</p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
              />
            </label>

            {/* Samples */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Or try a sample dataset:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_DATASETS.map((ds) => (
                  <button
                    key={ds.name}
                    onClick={() => loadSample(ds.csv, ds.name)}
                    className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-sm text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition-colors"
                  >
                    {ds.name}
                    <span className="block text-xs text-slate-500">{ds.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Cleaning ── */}
        {tab === 'cleaning' && cleanedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Data Cleaning Report</h2>
                <p className="text-sm text-slate-400 mt-1">{cleanedData.rowCount} rows · {cleanedData.headers.length} columns after cleaning</p>
              </div>
              <button
                onClick={() => setTab('notebook')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500"
              >
                Proceed to Notebook →
              </button>
            </div>

            {/* Column type table */}
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    {['Column', 'Type', 'Unique', 'Missing', 'Min', 'Max', 'Mean'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cleanedData.headers.map((col) => {
                    const info = cleanedData.columnInfo[col];
                    return (
                      <tr key={col} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="px-4 py-2 font-mono text-xs text-slate-200">{col}</td>
                        <td className="px-4 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            info.type === 'numeric' ? 'bg-blue-900/40 text-blue-300' :
                            info.type === 'categorical' ? 'bg-green-900/40 text-green-300' :
                            info.type === 'boolean' ? 'bg-yellow-900/40 text-yellow-300' :
                            'bg-purple-900/40 text-purple-300'
                          }`}>{info.type}</span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-400">{info.uniqueValues}</td>
                        <td className="px-4 py-2 text-xs text-slate-400">{info.nullCount}</td>
                        <td className="px-4 py-2 text-xs text-slate-400">{info.min?.toFixed(2) ?? '—'}</td>
                        <td className="px-4 py-2 text-xs text-slate-400">{info.max?.toFixed(2) ?? '—'}</td>
                        <td className="px-4 py-2 text-xs text-slate-400">{info.mean?.toFixed(2) ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Preview */}
            <div>
              <p className="text-xs text-slate-500 mb-1">First 5 rows (cleaned):</p>
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="text-xs">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-700">
                      {cleanedData.headers.map((h) => (
                        <th key={h} className="px-3 py-1.5 text-left text-slate-400 font-mono whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cleanedData.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        {cleanedData.headers.map((h) => (
                          <td key={h} className="px-3 py-1.5 text-slate-300 whitespace-nowrap">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Notebook ── */}
        {tab === 'notebook' && cleanedData && (
          <NotebookViewer parsedData={cleanedData} csvData={cleanedCsv} fileName={fileName} />
        )}

        {/* ── Visualizations ── */}
        {tab === 'visualizations' && cleanedData && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-100">Visualizations</h2>
              <p className="text-sm text-slate-500">{cleanedData.rowCount} rows · {cleanedData.headers.length} columns</p>
            </div>
            <CsvVisualizations parsedData={cleanedData} />
          </div>
        )}

        {/* ── Account ── */}
        {tab === 'account' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-100">Account & Saved Works</h2>

            {/* Auth */}
            {!user ? (
              <div className="rounded-xl border border-slate-700 p-6 bg-slate-800/30 space-y-3">
                <p className="text-slate-300 text-sm">Sign in with Google to save works to the cloud across devices.</p>
                {authError && <p className="text-xs text-red-400">{authError}</p>}
                <button
                  onClick={signIn}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-800 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
                <p className="text-xs text-slate-500">Works also save locally in your browser without sign-in.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700 p-4 bg-slate-800/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />}
                  <div>
                    <p className="text-sm font-medium text-slate-200">{user.displayName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 rounded border border-slate-600 hover:border-slate-400">
                  Sign out
                </button>
              </div>
            )}

            {/* Save current work */}
            {hasData && (
              <button
                onClick={saveWork}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition-colors"
              >
                💾 Save current work ({fileName})
              </button>
            )}

            {/* Saved works list */}
            {savedWorks.length > 0 ? (
              <div className="rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-700">
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2 text-left text-xs text-slate-400">File</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-400">Saved</th>
                      <th className="px-3 py-2 text-left text-xs text-slate-400">Source</th>
                      <th className="px-3 py-2 text-xs text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedWorks.map((work) => (
                      <tr key={work.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="px-3 py-2">
                          <input
                            type="radio"
                            name="selectedWork"
                            checked={selectedWorkId === work.id}
                            onChange={() => setSelectedWorkId(work.id)}
                            className="accent-indigo-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-slate-200 text-xs font-mono">{work.fileName}</td>
                        <td className="px-3 py-2 text-slate-400 text-xs">
                          {new Date(work.savedAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${work.source === 'cloud' ? 'bg-blue-900/40 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                            {work.source}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => loadWork(work)}
                              className="text-xs px-2 py-1 rounded bg-indigo-700/50 text-indigo-300 hover:bg-indigo-600/50"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteWork(work)}
                              className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No saved works yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
