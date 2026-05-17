import Fuse from 'fuse.js'

export interface SearchableNote {
  id: string
  bookSlug: string
  title: string
  summary?: string
  filePath: string
  tags?: string[]
  updatedAt?: string
}

export interface SearchResult {
  note: SearchableNote
  score: number
}

let fuseInstance: Fuse<SearchableNote> | null = null

export function buildIndex(notes: SearchableNote[]): void {
  fuseInstance = new Fuse(notes, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'tags', weight: 1.5 },
      { name: 'summary', weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 1,
    ignoreLocation: true,
  })
}

export function search(query: string, limit = 20): SearchResult[] {
  if (!fuseInstance || !query.trim()) return []
  return fuseInstance.search(query, { limit }).map((r) => ({
    note: r.item,
    score: r.score ?? 0,
  }))
}

export function resetIndex(): void {
  fuseInstance = null
}
