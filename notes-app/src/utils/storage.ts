const PREFIX = 'notes-app:'

export function storageSet(key: string, value: unknown): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function storageGet<T>(key: string, defaultValue: T): T {
  const raw = localStorage.getItem(PREFIX + key)
  if (raw === null) return defaultValue
  try {
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

export function storageRemove(key: string): void {
  localStorage.removeItem(PREFIX + key)
}
