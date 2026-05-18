import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import favorites from '../routes/favorites'
import type { Bindings } from '../types'
import { FakeKV } from './fakeKV'

const kv = new FakeKV()
const env = {
  NOTES_KV: kv as never,
  MASTER_TOKEN: 'tok',
  DEEPSEEK_API_KEY: 'ds',
  ALLOWED_ORIGINS: '',
}

function makeApp() {
  const app = new Hono<{ Bindings: Bindings }>()
  app.route('/api/favorites', favorites)
  return app
}

beforeEach(() => {
  kv.clear()
})

describe('favorites routes', () => {
  it('GET returns empty by default', async () => {
    const res = await makeApp().request('/api/favorites', {}, env)
    expect(await res.json()).toEqual({ notes: [], memos: [] })
  })

  it('POST {op:add, type:note} adds an id', async () => {
    await makeApp().request(
      '/api/favorites',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', id: 'n1', op: 'add' }),
      },
      env,
    )
    const res = await makeApp().request('/api/favorites', {}, env)
    expect(((await res.json()) as { notes: string[] }).notes).toEqual(['n1'])
  })

  it('POST {op:remove} removes the id', async () => {
    await makeApp().request(
      '/api/favorites',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', id: 'n1', op: 'add' }),
      },
      env,
    )
    await makeApp().request(
      '/api/favorites',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', id: 'n1', op: 'remove' }),
      },
      env,
    )
    const res = await makeApp().request('/api/favorites', {}, env)
    expect(((await res.json()) as { notes: string[] }).notes).toEqual([])
  })

  it('notes and memos are independent', async () => {
    await makeApp().request(
      '/api/favorites',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', id: 'n', op: 'add' }),
      },
      env,
    )
    await makeApp().request(
      '/api/favorites',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'memo', id: 'm', op: 'add' }),
      },
      env,
    )
    const res = await makeApp().request('/api/favorites', {}, env)
    expect(await res.json()).toEqual({ notes: ['n'], memos: ['m'] })
  })
})
