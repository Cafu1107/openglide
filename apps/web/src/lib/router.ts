import { useSyncExternalStore } from 'react';

/**
 * Hash routing keeps the app working on GitHub Pages and from a local file
 * inside a future desktop shell, with no server rewrites needed.
 */
const read = () => window.location.hash.replace(/^#\/?/, '');

const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
};

export const useRoute = (): string[] => {
  const path = useSyncExternalStore(subscribe, read, () => '');
  return path.split('/').filter(Boolean).map(decodeURIComponent);
};

export const navigate = (path: string) => {
  window.location.hash = `/${path.replace(/^\//, '')}`;
};

export const href = (path: string) => `#/${path.replace(/^\//, '')}`;
