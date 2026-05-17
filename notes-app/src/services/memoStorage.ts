import { shortId } from '@/utils/uuid'
import { storageGet, storageSet, storageRemove } from '@/utils/storage'

export interface MemoListItem {
  id: string
  createdAt: string
  preview: string
  tags?: string[]
}

export interface Memo {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  linkedNoteId?: string
}

const LIST_KEY = 'memos:list'
const ITEM_PREFIX = 'memos:'

function preview(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ')
  return trimmed.length > 80 ? trimmed.slice(0, 80) + '…' : trimmed
}

export function listMemos(): MemoListItem[] {
  return storageGet<MemoListItem[]>(LIST_KEY, [])
}

export function getMemo(id: string): Memo | null {
  return storageGet<Memo | null>(`${ITEM_PREFIX}${id}`, null)
}

export function createMemo(args: {
  content: string
  tags?: string[]
  linkedNoteId?: string
}): Memo {
  const id = shortId()
  const now = new Date().toISOString()
  const memo: Memo = {
    id,
    content: args.content,
    createdAt: now,
    updatedAt: now,
    tags: args.tags,
    linkedNoteId: args.linkedNoteId,
  }
  storageSet(`${ITEM_PREFIX}${id}`, memo)
  const list = listMemos()
  list.unshift({
    id,
    createdAt: now,
    preview: preview(args.content),
    tags: args.tags,
  })
  storageSet(LIST_KEY, list)
  return memo
}

export function updateMemo(
  id: string,
  patch: { content?: string; tags?: string[] },
): Memo | null {
  const memo = getMemo(id)
  if (!memo) return null
  const updated: Memo = {
    ...memo,
    ...(patch.content !== undefined ? { content: patch.content } : {}),
    ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
    updatedAt: new Date().toISOString(),
  }
  storageSet(`${ITEM_PREFIX}${id}`, updated)
  const list = listMemos().map((m) =>
    m.id === id
      ? {
          ...m,
          preview: patch.content !== undefined ? preview(patch.content) : m.preview,
          tags: patch.tags !== undefined ? patch.tags : m.tags,
        }
      : m,
  )
  storageSet(LIST_KEY, list)
  return updated
}

export function deleteMemo(id: string): void {
  storageRemove(`${ITEM_PREFIX}${id}`)
  storageSet(
    LIST_KEY,
    listMemos().filter((m) => m.id !== id),
  )
}
