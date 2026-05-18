import type { KVNamespace } from '@cloudflare/workers-types'

export interface Bindings {
  NOTES_KV: KVNamespace
  MASTER_TOKEN: string
  DEEPSEEK_API_KEY: string
  ALLOWED_ORIGINS: string
}

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

export interface Favorites {
  notes: string[]
  memos: string[]
}

export type FavType = 'note' | 'memo'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  ts?: string
}

export interface AiSessionMeta {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
  msgCount: number
}

export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner'
