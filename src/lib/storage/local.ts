export function isBrowser() {
  return typeof window !== "undefined";
}

export function safeRead<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeWrite<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

export function clearStorage(): void {
  if (!isBrowser()) return;
  window.localStorage.clear();
}
