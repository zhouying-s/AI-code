import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import sessions from '../routes/sessions'
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
  app.route('/api/ai/sessions', sessions)
  return app
}

beforeEach(() => {
  kv.clear()
})

describe('sessions routes', () => {
  it('GET / returns empty list by default', async () => {
    const res = await makeApp().request('/api/ai/sessions', {}, env)
    expect(await res.json()).toEqual({ items: [] })
  })

  it('POST / creates session with title + model', async () => {
    const res = await makeApp().request(
      '/api/ai/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Hello', model: 'deepseek-chat' }),
      },
      env,
    )
    const session = (await res.json()) as { id: string; title: string; model: string }
    expect(session.id).toMatch(/^[0-9a-f]{8}$/)
    expect(session.title).toBe('Hello')
    expect(session.model).toBe('deepseek-chat')
  })

  it('PATCH /:id updates title', async () => {
    const created = await makeApp().request(
      '/api/ai/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Old', model: 'deepseek-chat' }),
      },
      env,
    )
    const { id } = (await created.json()) as { id: string }
    await makeApp().request(
      `/api/ai/sessions/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New' }),
      },
      env,
    )
    const got = await makeApp().request(`/api/ai/sessions/${id}`, {}, env)
    expect(((await got.json()) as { title: string }).title).toBe('New')
  })

  it('GET /:id/messages returns [] when empty', async () => {
    const created = await makeApp().request(
      '/api/ai/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'X', model: 'deepseek-chat' }),
      },
      env,
    )
    const { id } = (await created.json()) as { id: string }
    const res = await makeApp().request(`/api/ai/sessions/${id}/messages`, {}, env)
    expect(await res.json()).toEqual({ messages: [] })
  })

  it('POST /:id/messages appends to history', async () => {
    const created = await makeApp().request(
      '/api/ai/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'X', model: 'deepseek-chat' }),
      },
      env,
    )
    const { id } = (await created.json()) as { id: string }
    await makeApp().request(
      `/api/ai/sessions/${id}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: 'hi' }),
      },
      env,
    )
    const res = await makeApp().request(`/api/ai/sessions/${id}/messages`, {}, env)
    const body = (await res.json()) as { messages: { content: string }[] }
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0].content).toBe('hi')
  })

  it('DELETE /:id removes session', async () => {
    const created = await makeApp().request(
      '/api/ai/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'X', model: 'deepseek-chat' }),
      },
      env,
    )
    const { id } = (await created.json()) as { id: string }
    await makeApp().request(`/api/ai/sessions/${id}`, { method: 'DELETE' }, env)
    const list = await makeApp().request('/api/ai/sessions', {}, env)
    expect(((await list.json()) as { items: unknown[] }).items).toEqual([])
  })
})
