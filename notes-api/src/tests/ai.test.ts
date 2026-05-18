import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import ai from '../routes/ai'
import type { Bindings } from '../types'

const env = {
  NOTES_KV: {} as never,
  MASTER_TOKEN: 'tok',
  DEEPSEEK_API_KEY: 'ds-test-key',
  ALLOWED_ORIGINS: '',
}

function makeApp() {
  const app = new Hono<{ Bindings: Bindings }>()
  app.route('/api/ai', ai)
  return app
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('ai routes', () => {
  it('POST /chat without body returns 400', async () => {
    const res = await makeApp().request(
      '/api/ai/chat',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('POST /chat forwards SSE from DeepSeek', async () => {
    const sseBody =
      'data: {"choices":[{"delta":{"content":"hello"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n' +
      'data: [DONE]\n\n'
    const stub = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(sseBody, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )
    const res = await makeApp().request(
      '/api/ai/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'say hi' }],
        }),
      },
      env,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/event-stream/)
    const text = await res.text()
    expect(text).toContain('"hello"')
    expect(text).toContain('world')
    expect(stub).toHaveBeenCalledOnce()
  })

  it('POST /chat returns 502 on upstream error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('upstream broken', { status: 500 }),
    )
    const res = await makeApp().request(
      '/api/ai/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
        }),
      },
      env,
    )
    expect(res.status).toBe(502)
  })
})
