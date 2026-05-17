import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, NoteSummary, SaveStatus } from '@/types'
import * as github from '@/services/github'

export const useNotesStore = defineStore('notes', () => {
  const notesByBook = ref<Record<string, NoteSummary[]>>({})
  const current = ref<Note | null>(null)
  const saveStatus = ref<SaveStatus>('clean')
  const lastError = ref<string | null>(null)

  async function loadTree(bookSlug: string): Promise<void> {
    notesByBook.value[bookSlug] = await github.listNotes(bookSlug)
  }

  async function loadCurrent(filePath: string): Promise<void> {
    saveStatus.value = 'clean'
    current.value = await github.getNote(filePath)
  }

  function updateContent(content: string) {
    if (!current.value) return
    current.value = { ...current.value, content }
    saveStatus.value = 'dirty'
  }

  function updateMeta(patch: Partial<Note>) {
    if (!current.value) return
    current.value = { ...current.value, ...patch }
    saveStatus.value = 'dirty'
  }

  async function save(): Promise<void> {
    if (!current.value) return
    saveStatus.value = 'saving'
    try {
      const newSha = await github.saveNote({
        filePath: current.value.filePath,
        meta: {
          id: current.value.id,
          title: current.value.title,
          tags: current.value.tags,
          summary: current.value.summary,
        },
        content: current.value.content,
        sha: current.value.sha,
      })
      current.value = { ...current.value, sha: newSha }
      saveStatus.value = 'saved'
      setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'clean'
      }, 1500)
    } catch (err) {
      const conflict = err as { type?: string }
      if (conflict.type === 'conflict') {
        saveStatus.value = 'conflict'
        lastError.value = 'remote-changed'
      } else {
        saveStatus.value = 'error'
        lastError.value = (err as Error).message
      }
      throw err
    }
  }

  async function removeNote(filePath: string, sha: string): Promise<void> {
    await github.deleteNote(filePath, sha)
    if (current.value?.filePath === filePath) current.value = null
  }

  return {
    notesByBook,
    current,
    saveStatus,
    lastError,
    loadTree,
    loadCurrent,
    updateContent,
    updateMeta,
    save,
    removeNote,
  }
})
