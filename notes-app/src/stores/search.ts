import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as github from '@/services/github'
import * as searchSvc from '@/services/search'
import type { SearchResult, SearchableNote } from '@/services/search'
import { storageGet, storageSet } from '@/utils/storage'

const RECENT_KEY = 'search:recent'
const MAX_RECENT = 5

export const useSearchStore = defineStore('search', () => {
  const indexBuilt = ref(false)
  const loading = ref(false)
  const results = ref<SearchResult[]>([])
  const recentQueries = ref<string[]>(storageGet<string[]>(RECENT_KEY, []))
  const error = ref<string | null>(null)
  const allIndexed = ref<SearchableNote[]>([])

  async function ensureIndex(): Promise<void> {
    if (indexBuilt.value) return
    loading.value = true
    error.value = null
    try {
      const books = await github.listBooks()
      const all: SearchableNote[] = []
      for (const book of books) {
        const notes = await github.listNotes(book.slug)
        for (const n of notes) {
          all.push({
            id: n.id,
            bookSlug: book.slug,
            title: n.title,
            summary: n.summary,
            filePath: n.filePath,
            tags: n.tags,
            updatedAt: n.updatedAt,
          })
        }
      }
      searchSvc.buildIndex(all)
      allIndexed.value = all
      indexBuilt.value = true
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  function query(q: string): void {
    results.value = searchSvc.search(q, 20)
    if (!q.trim()) return
    const existing = recentQueries.value.filter((r) => r !== q)
    recentQueries.value = [q, ...existing].slice(0, MAX_RECENT)
    storageSet(RECENT_KEY, recentQueries.value)
  }

  function invalidate(): void {
    searchSvc.resetIndex()
    indexBuilt.value = false
    results.value = []
    allIndexed.value = []
  }

  return {
    indexBuilt,
    loading,
    results,
    recentQueries,
    error,
    allIndexed,
    ensureIndex,
    query,
    invalidate,
  }
})
