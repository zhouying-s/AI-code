import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BookMeta } from '@/types'
import * as github from '@/services/github'

export const useBooksStore = defineStore('books', () => {
  const books = ref<BookMeta[]>([])
  const currentSlug = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      books.value = await github.listBooks()
      if (!currentSlug.value && books.value.length > 0) {
        currentSlug.value = books.value[0].slug
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function create(args: { slug: string; name: string }) {
    await github.createBook(args)
    await refresh()
  }

  async function remove(slug: string) {
    await github.deleteBook(slug)
    if (currentSlug.value === slug) currentSlug.value = null
    await refresh()
  }

  function setCurrent(slug: string) {
    currentSlug.value = slug
  }

  return { books, currentSlug, loading, error, refresh, create, remove, setCurrent }
})
