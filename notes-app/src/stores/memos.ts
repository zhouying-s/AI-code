import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as memoStorage from '@/services/memoStorage'
import type { Memo, MemoListItem } from '@/services/memoStorage'

export const useMemosStore = defineStore('memos', () => {
  const list = ref<MemoListItem[]>(memoStorage.listMemos())
  const currentDetail = ref<Memo | null>(null)

  function refresh() {
    list.value = memoStorage.listMemos()
  }

  function create(args: { content: string; tags?: string[]; linkedNoteId?: string }) {
    const m = memoStorage.createMemo(args)
    refresh()
    return m
  }

  function loadDetail(id: string) {
    currentDetail.value = memoStorage.getMemo(id)
  }

  function update(id: string, patch: { content?: string; tags?: string[] }) {
    memoStorage.updateMemo(id, patch)
    refresh()
    if (currentDetail.value?.id === id) currentDetail.value = memoStorage.getMemo(id)
  }

  function remove(id: string) {
    memoStorage.deleteMemo(id)
    refresh()
    if (currentDetail.value?.id === id) currentDetail.value = null
  }

  return { list, currentDetail, refresh, create, loadDetail, update, remove }
})
