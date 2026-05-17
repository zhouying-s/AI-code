import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthConfig } from '@/types'

const STORAGE_KEY = 'notes-app:auth'

function loadFromStorage(): Partial<AuthConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<AuthConfig>) : {}
  } catch {
    return {}
  }
}

export const useAuthStore = defineStore('auth', () => {
  const initial = loadFromStorage()
  const githubPat = ref(initial.githubPat ?? '')
  const owner = ref(initial.owner ?? '')
  const repo = ref(initial.repo ?? '')
  const workerUrl = ref(initial.workerUrl ?? '')
  const masterToken = ref(initial.masterToken ?? '')
  const defaultBookSlug = ref(initial.defaultBookSlug ?? '')

  const isConfigured = computed(
    () => !!(githubPat.value && owner.value && repo.value),
  )

  function persist() {
    const data: AuthConfig = {
      githubPat: githubPat.value,
      owner: owner.value,
      repo: repo.value,
      workerUrl: workerUrl.value || undefined,
      masterToken: masterToken.value || undefined,
      defaultBookSlug: defaultBookSlug.value || undefined,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function setConfig(cfg: Partial<AuthConfig>) {
    if (cfg.githubPat !== undefined) githubPat.value = cfg.githubPat
    if (cfg.owner !== undefined) owner.value = cfg.owner
    if (cfg.repo !== undefined) repo.value = cfg.repo
    if (cfg.workerUrl !== undefined) workerUrl.value = cfg.workerUrl
    if (cfg.masterToken !== undefined) masterToken.value = cfg.masterToken
    if (cfg.defaultBookSlug !== undefined) defaultBookSlug.value = cfg.defaultBookSlug
    persist()
  }

  function clear() {
    githubPat.value = ''
    owner.value = ''
    repo.value = ''
    workerUrl.value = ''
    masterToken.value = ''
    defaultBookSlug.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    githubPat,
    owner,
    repo,
    workerUrl,
    masterToken,
    defaultBookSlug,
    isConfigured,
    setConfig,
    clear,
  }
})
