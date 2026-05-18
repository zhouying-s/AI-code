import * as memoStorage from './memoStorage'
import * as fav from './favoritesStorage'
import { workerJson } from './workerClient'

export interface MigrationResult {
  memos: number
  favorites: { notes: number; memos: number }
  errors: string[]
}

export async function migrateToWorker(): Promise<MigrationResult> {
  const errors: string[] = []

  const localMemos = memoStorage.listMemos()
  let memosUploaded = 0
  for (const item of localMemos) {
    const full = memoStorage.getMemo(item.id)
    if (!full) continue
    try {
      await workerJson('/api/memos', {
        method: 'POST',
        body: JSON.stringify({
          content: full.content,
          tags: full.tags,
          linkedNoteId: full.linkedNoteId,
        }),
      })
      memosUploaded++
    } catch (e) {
      errors.push(`memo ${item.id}: ${(e as Error).message}`)
    }
  }

  const localFavs = fav.loadAll()
  let favNotes = 0
  let favMemos = 0
  for (const id of localFavs.notes) {
    try {
      await workerJson('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ type: 'note', id, op: 'add' }),
      })
      favNotes++
    } catch (e) {
      errors.push(`fav note ${id}: ${(e as Error).message}`)
    }
  }
  for (const id of localFavs.memos) {
    try {
      await workerJson('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ type: 'memo', id, op: 'add' }),
      })
      favMemos++
    } catch (e) {
      errors.push(`fav memo ${id}: ${(e as Error).message}`)
    }
  }

  return {
    memos: memosUploaded,
    favorites: { notes: favNotes, memos: favMemos },
    errors,
  }
}
