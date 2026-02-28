import { getToken, setToken } from "./api";
interface AuthState {
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// We use a simple React context approach instead of zustand
// since zustand isn't installed. Just export helpers.

let listeners: Array<() => void> = [];

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function logout() {
  setToken(null);
  listeners.forEach((fn) => fn());
}

export function onAuthChange(fn: () => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function notifyAuthChange() {
  listeners.forEach((fn) => fn());
}
