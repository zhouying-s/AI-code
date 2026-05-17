import { describe, it, expect, beforeEach } from 'vitest'
import { storageGet, storageSet, storageRemove } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('storage helpers', () => {
  it('storageSet stores JSON under prefixed key', () => {
    storageSet('test:key', { foo: 1 })
    expect(localStorage.getItem('notes-app:test:key')).toBe('{"foo":1}')
  })

  it('storageGet returns parsed value', () => {
    localStorage.setItem('notes-app:test:key', '{"foo":1}')
    expect(storageGet('test:key', null)).toEqual({ foo: 1 })
  })

  it('storageGet returns default when key missing', () => {
    expect(storageGet('test:missing', { fallback: true })).toEqual({ fallback: true })
  })

  it('storageGet returns default on parse error', () => {
    localStorage.setItem('notes-app:test:bad', 'not json{{{')
    expect(storageGet('test:bad', 'default')).toBe('default')
  })

  it('storageRemove deletes the key', () => {
    storageSet('test:key', 'x')
    storageRemove('test:key')
    expect(localStorage.getItem('notes-app:test:key')).toBeNull()
  })
})
