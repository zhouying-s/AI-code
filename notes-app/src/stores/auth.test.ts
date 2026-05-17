import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('isConfigured is false when missing pat/owner/repo', () => {
    const s = useAuthStore()
    expect(s.isConfigured).toBe(false)
  })

  it('isConfigured is true once required fields set', () => {
    const s = useAuthStore()
    s.setConfig({ githubPat: 'p', owner: 'me', repo: 'notes-db' })
    expect(s.isConfigured).toBe(true)
  })

  it('persists to localStorage', () => {
    const s = useAuthStore()
    s.setConfig({ githubPat: 'p', owner: 'me', repo: 'notes-db' })
    expect(localStorage.getItem('notes-app:auth')).toContain('"owner":"me"')
  })

  it('hydrates from localStorage on instantiation', () => {
    localStorage.setItem(
      'notes-app:auth',
      JSON.stringify({ githubPat: 'p', owner: 'me', repo: 'r' }),
    )
    const s = useAuthStore()
    expect(s.owner).toBe('me')
    expect(s.isConfigured).toBe(true)
  })

  it('clears wipes localStorage', () => {
    const s = useAuthStore()
    s.setConfig({ githubPat: 'p', owner: 'me', repo: 'r' })
    s.clear()
    expect(localStorage.getItem('notes-app:auth')).toBeNull()
    expect(s.isConfigured).toBe(false)
  })
})
