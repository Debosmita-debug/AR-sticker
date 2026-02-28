/**
 * auth.ts – Lightweight auth change notification bus.
 * Actual JWT storage lives in AuthContext (in memory only).
 */

let listeners: Array<() => void> = [];

export function onAuthChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function notifyAuthChange(): void {
  listeners.forEach((fn) => fn());
}
