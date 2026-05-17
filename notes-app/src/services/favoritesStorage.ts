import { storageGet, storageSet } from '@/utils/storage'

export type FavType = 'note' | 'memo'

const NOTES_KEY = 'favorites:notes'
const MEMOS_KEY = 'favorites:memos'

function keyFor(t: FavType): string {
  return t === 'note' ? NOTES_KEY : MEMOS_KEY
}

export function loadAll(): { notes: string[]; memos: string[] } {
  return {
    notes: storageGet<string[]>(NOTES_KEY, []),
    memos: storageGet<string[]>(MEMOS_KEY, []),
  }
}

export function toggle(type: FavType, id: string): boolean {
  const list = storageGet<string[]>(keyFor(type), [])
  const idx = list.indexOf(id)
  if (idx === -1) {
    list.push(id)
    storageSet(keyFor(type), list)
    return true
  }
  list.splice(idx, 1)
  storageSet(keyFor(type), list)
  return false
}

export function isFavorite(type: FavType, id: string): boolean {
  return storageGet<string[]>(keyFor(type), []).includes(id)
}
