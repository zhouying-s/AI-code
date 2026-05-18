import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import memos from '../routes/memos'
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
  app.route('/api/memos', memos)
  return app
}

beforeEach(() => {
  kv.clear()
})

describe('memos routes', () => {
  it('GET / returns {items: []} when empty', async () => {
    const res = await makeApp().request('/api/memos', {}, env)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ items: [] })
  })

  it('POST / creates and returns memo with id', async () => {
    const res = await makeApp().request(
      '/api/memos',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'hello', tags: ['life'] }),
      },
      env,
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string; content: string }
    expect(body.id).toMatch(/^[0-9a-f]{8}$/)
    expect(body.content).toBe('hello')

    const list = await makeApp().request('/api/memos', {}, env)
    const items = ((await list.json()) as { items: unknown[] }).items
    expect(items).toHaveLength(1)
  })

  it('PATCH /:id updates content', async () => {
    const created = await makeApp().request(
      '/api/memos',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'old' }),
      },
      env,
    )
    const { id } = (await created.json()) as { id: string }
    const patched = await makeApp().request(
      `/api/memos/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'new' }),
      },
      env,
    )
    expect(patched.status).toBe(200)
    const got = await makeApp().request(`/api/memos/${id}`, {}, env)
    expect(((await got.json()) as { content: string }).content).toBe('new')
  })

  it('DELETE /:id removes', async () => {
    const created = await makeApp().request(
      '/api/memos',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'gone' }),
      },
      env,
    )
    const { id } = (await created.json()) as { id: string }
    const del = await makeApp().request(`/api/memos/${id}`, { method: 'DELETE' }, env)
    expect(del.status).toBe(200)
    const list = await makeApp().request('/api/memos', {}, env)
    expect(((await list.json()) as { items: unknown[] }).items).toEqual([])
  })

  it('GET /:id returns 404 for missing', async () => {
    const res = await makeApp().request('/api/memos/nope', {}, env)
    expect(res.status).toBe(404)
  })
})
