import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as fav from '@/services/favoritesStorage'

export const useFavoritesStore = defineStore('favorites', () => {
  const all = fav.loadAll()
  const noteIds = ref<string[]>(all.notes)
  const memoIds = ref<string[]>(all.memos)

  function toggleNote(id: string) {
    fav.toggle('note', id)
    noteIds.value = fav.loadAll().notes
  }

  function toggleMemo(id: string) {
    fav.toggle('memo', id)
    memoIds.value = fav.loadAll().memos
  }

  function isNoteFavorite(id: string): boolean {
    return noteIds.value.includes(id)
  }

  function isMemoFavorite(id: string): boolean {
    return memoIds.value.includes(id)
  }

  return { noteIds, memoIds, toggleNote, toggleMemo, isNoteFavorite, isMemoFavorite }
})
