import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type { Bindings } from '../types'

function makeApp() {
  const app = new Hono<{ Bindings: Bindings }>()
  app.use('*', authMiddleware)
  app.get('/ping', (c) => c.text('pong'))
  return app
}

const env = {
  NOTES_KV: {} as never,
  MASTER_TOKEN: 'secret123',
  DEEPSEEK_API_KEY: 'ds-key',
  ALLOWED_ORIGINS: 'http://localhost:5180',
}

describe('authMiddleware', () => {
  it('rejects missing Authorization with 401', async () => {
    const res = await makeApp().request('/ping', {}, env)
    expect(res.status).toBe(401)
  })

  it('rejects wrong token with 401', async () => {
    const res = await makeApp().request(
      '/ping',
      { headers: { Authorization: 'Bearer wrong' } },
      env,
    )
    expect(res.status).toBe(401)
  })

  it('passes through when token matches', async () => {
    const res = await makeApp().request(
      '/ping',
      { headers: { Authorization: 'Bearer secret123' } },
      env,
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('pong')
  })
})
