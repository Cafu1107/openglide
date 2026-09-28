import { useCallback } from 'react';
import { detectLang, translate, type Key, type Lang } from '../i18n';
import { createStore, storage, useStore } from './store';

export type Theme = 'system' | 'dark' | 'light';
export type Accent = 'mint' | 'violet' | 'cyan' | 'amber' | 'rose';

export interface Settings {
  theme: Theme;
  accent: Accent;
  lang: Lang;
  autoApply: boolean;
  verboseLog: boolean;
}

const KEY = 'openglide.settings';

export const ACCENTS: { id: Accent; color: string }[] = [
  { id: 'mint', color: '#5dde89' },
  { id: 'violet', color: '#a78bfa' },
  { id: 'cyan', color: '#67d8ff' },
  { id: 'amber', color: '#f5b454' },
  { id: 'rose', color: '#fb7185' },
];

export const settingsStore = createStore<Settings>(
  storage.read(KEY, { theme: 'system', accent: 'mint', lang: detectLang(), autoApply: false, verboseLog: false }),
);

const media = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: light)') : null;

function applyToDocument(s: Settings) {
  const root = document.documentElement;
  root.dataset.theme = s.theme === 'system' ? (media?.matches ? 'light' : 'dark') : s.theme;
  root.dataset.accent = s.accent;
  root.lang = s.lang;
}

applyToDocument(settingsStore.get());
media?.addEventListener('change', () => applyToDocument(settingsStore.get()));
settingsStore.subscribe(() => {
  const s = settingsStore.get();
  storage.write(KEY, s);
  applyToDocument(s);
});

export const updateSettings = (patch: Partial<Settings>) => settingsStore.set((s) => ({ ...s, ...patch }));

export const useSettings = () => useStore(settingsStore);

/** Translation hook bound to the current language. */
export function useT() {
  const lang = useStore(settingsStore, selectLang);
  return useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
}
const selectLang = (s: Settings) => s.lang;

/** Translate outside React (toasts from async code). */
export const t = (key: Key, vars?: Record<string, string | number>) => translate(settingsStore.get().lang, key, vars);
