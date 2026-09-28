import { en } from './en';
import { tr } from './tr';

export type Lang = 'en' | 'tr';
export type Key = keyof typeof en;
export type Dict = Record<Key, string>;

export const DICTS: Record<Lang, Dict> = { en, tr };
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'tr', label: 'Türkçe' },
];

export const detectLang = (): Lang =>
  typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en';

/** Translate with `{name}` placeholders. Falls back to English. */
export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
