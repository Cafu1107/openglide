import { useCallback, useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  set(update: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

/** Minimal observable store; React reads it through useSyncExternalStore. */
export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(update) {
      state = typeof update === 'function' ? (update as (prev: T) => T)(state) : update;
      for (const l of listeners) l();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T, S = T>(store: Store<T>, selector: (s: T) => S = (s) => s as unknown as S): S {
  const get = useCallback(() => selector(store.get()), [store, selector]);
  return useSyncExternalStore(store.subscribe, get, get);
}

export const storage = {
  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  },
  write(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode or storage disabled: settings just won't persist */
    }
  },
};
