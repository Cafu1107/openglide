import { createStore } from './store';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  body?: string;
}

export const toastStore = createStore<Toast[]>([]);
let nextId = 1;

export function toast(kind: Toast['kind'], title: string, body?: string) {
  const id = nextId++;
  toastStore.set((list) => [...list.slice(-3), { id, kind, title, body }]);
  setTimeout(() => toastStore.set((list) => list.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 3500);
}
