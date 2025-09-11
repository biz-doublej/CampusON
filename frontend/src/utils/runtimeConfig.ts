export type RuntimeSettings = {
  defaultTheme?: 'light' | 'dark' | 'auto';
  enableGlobalChat?: boolean;
  language?: 'ko' | 'en';
  compactMode?: boolean;
  animation?: boolean;
  showSystemBanner?: boolean;
};

const KEY = 'runtime_settings';

export function getRuntimeSettings(): RuntimeSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveRuntimeSettings(patch: Partial<RuntimeSettings>) {
  const current = getRuntimeSettings();
  const next = { ...current, ...patch } as RuntimeSettings;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    // broadcast to other tabs
    localStorage.setItem(KEY + ':ts', String(Date.now()));
  } catch {}
  return next;
}

export function applyTheme(_theme?: 'light' | 'dark' | 'auto') {
  // Theme is locked to light
  const root = document.documentElement;
  root.setAttribute('data-theme', 'light');
  root.classList.remove('dark');
}
