import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Parses "ctrl+j" / "meta+k" / "shift+/" into a KeyboardEvent matcher.
 * Listener is attached on mount and removed on unmount.
 */
export function useShortcut(combo: string, handler: (e: KeyboardEvent) => void): void {
  const parts = combo.toLowerCase().split('+')
  const needsCtrl = parts.includes('ctrl') || parts.includes('control')
  const needsMeta = parts.includes('meta') || parts.includes('cmd')
  const needsShift = parts.includes('shift')
  const needsAlt = parts.includes('alt')
  const key = parts.find((p) => !['ctrl', 'control', 'meta', 'cmd', 'shift', 'alt'].includes(p))

  function onKey(e: KeyboardEvent) {
    if (!key) return
    if (e.key.toLowerCase() !== key) return
    if (e.ctrlKey !== needsCtrl) return
    if (e.metaKey !== needsMeta) return
    if (e.shiftKey !== needsShift) return
    if (e.altKey !== needsAlt) return
    handler(e)
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
