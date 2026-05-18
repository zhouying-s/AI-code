import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { rateLimitMiddleware } from '../middleware/rateLimit'
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
  app.use('*', rateLimitMiddleware({ limit: 3, windowSec: 60 }))
  app.get('/ping', (c) => c.text('pong'))
  return app
}

beforeEach(() => {
  kv.clear()
})

describe('rateLimitMiddleware', () => {
  it('allows requests within limit', async () => {
    const app = makeApp()
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/ping', { headers: { 'CF-Connecting-IP': '1.2.3.4' } }, env)
      expect(res.status).toBe(200)
    }
  })

  it('rejects after limit with 429', async () => {
    const app = makeApp()
    for (let i = 0; i < 3; i++) {
      await app.request('/ping', { headers: { 'CF-Connecting-IP': '5.6.7.8' } }, env)
    }
    const res = await app.request('/ping', { headers: { 'CF-Connecting-IP': '5.6.7.8' } }, env)
    expect(res.status).toBe(429)
  })

  it('different IPs counted separately', async () => {
    const app = makeApp()
    for (let i = 0; i < 3; i++) {
      await app.request('/ping', { headers: { 'CF-Connecting-IP': '9.9.9.9' } }, env)
    }
    const res = await app.request('/ping', { headers: { 'CF-Connecting-IP': '10.10.10.10' } }, env)
    expect(res.status).toBe(200)
  })
})
