export interface SavedWork {
  id: string;
  fileName: string;
  csvData: string;
  savedAt: string;
  source: 'local' | 'cloud';
  cloudId?: string;
}

const STORAGE_KEY = 'datamentor_saved_works';

export function loadLocalWorks(): SavedWork[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveLocalWork(fileName: string, csvData: string): SavedWork {
  const works = loadLocalWorks();
  const work: SavedWork = {
    id: `local_${Date.now()}`,
    fileName,
    csvData,
    savedAt: new Date().toISOString(),
    source: 'local',
  };
  works.unshift(work);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works.slice(0, 20)));
  return work;
}

export function deleteLocalWork(id: string): void {
  const works = loadLocalWorks().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
}
