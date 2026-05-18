import { Hono } from 'hono'
import { z } from 'zod'
import type { AiSessionMeta, Bindings, ChatMessage } from '../types'
import { getJson, putJson, deleteKey } from '../lib/kv'
import { shortId } from '../lib/uuid'

const LIST_KEY = 'ai-sessions:list'
const SESSION_PREFIX = 'ai-sessions:'

function metaKey(id: string) {
  return `${SESSION_PREFIX}${id}`
}
function messagesKey(id: string) {
  return `${SESSION_PREFIX}${id}:messages`
}

const createSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  model: z.string().min(1),
})

const patchSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  model: z.string().min(1).optional(),
})

const msgSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
})

const sessions = new Hono<{ Bindings: Bindings }>()

sessions.get('/', async (c) => {
  const items = await getJson<AiSessionMeta[]>(c.env.NOTES_KV, LIST_KEY, [])
  return c.json({ items })
})

sessions.post('/', async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'invalid body', detail: parsed.error.message }, 400)
  }
  const id = shortId()
  const now = new Date().toISOString()
  const meta: AiSessionMeta = {
    id,
    title: parsed.data.title ?? '新会话',
    model: parsed.data.model,
    createdAt: now,
    updatedAt: now,
    msgCount: 0,
  }
  await putJson(c.env.NOTES_KV, metaKey(id), meta)
  await putJson(c.env.NOTES_KV, messagesKey(id), [] as ChatMessage[])
  const list = await getJson<AiSessionMeta[]>(c.env.NOTES_KV, LIST_KEY, [])
  list.unshift(meta)
  await putJson(c.env.NOTES_KV, LIST_KEY, list)
  return c.json(meta)
})

sessions.get('/:id', async (c) => {
  const meta = await getJson<AiSessionMeta | null>(
    c.env.NOTES_KV,
    metaKey(c.req.param('id')),
    null,
  )
  if (!meta) return c.json({ error: 'not found' }, 404)
  return c.json(meta)
})

sessions.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const parsed = patchSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'invalid body', detail: parsed.error.message }, 400)
  }
  const meta = await getJson<AiSessionMeta | null>(c.env.NOTES_KV, metaKey(id), null)
  if (!meta) return c.json({ error: 'not found' }, 404)
  const updated: AiSessionMeta = {
    ...meta,
    ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
    ...(parsed.data.model !== undefined ? { model: parsed.data.model } : {}),
    updatedAt: new Date().toISOString(),
  }
  await putJson(c.env.NOTES_KV, metaKey(id), updated)
  const list = (await getJson<AiSessionMeta[]>(c.env.NOTES_KV, LIST_KEY, [])).map(
    (m) => (m.id === id ? updated : m),
  )
  await putJson(c.env.NOTES_KV, LIST_KEY, list)
  return c.json({ ok: true })
})

sessions.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await deleteKey(c.env.NOTES_KV, metaKey(id))
  await deleteKey(c.env.NOTES_KV, messagesKey(id))
  const list = (await getJson<AiSessionMeta[]>(c.env.NOTES_KV, LIST_KEY, [])).filter(
    (m) => m.id !== id,
  )
  await putJson(c.env.NOTES_KV, LIST_KEY, list)
  return c.json({ ok: true })
})

sessions.get('/:id/messages', async (c) => {
  const id = c.req.param('id')
  const messages = await getJson<ChatMessage[]>(c.env.NOTES_KV, messagesKey(id), [])
  return c.json({ messages })
})

sessions.post('/:id/messages', async (c) => {
  const id = c.req.param('id')
  const parsed = msgSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'invalid body', detail: parsed.error.message }, 400)
  }
  const meta = await getJson<AiSessionMeta | null>(c.env.NOTES_KV, metaKey(id), null)
  if (!meta) return c.json({ error: 'session not found' }, 404)
  const messages = await getJson<ChatMessage[]>(c.env.NOTES_KV, messagesKey(id), [])
  messages.push({
    role: parsed.data.role,
    content: parsed.data.content,
    ts: new Date().toISOString(),
  })
  await putJson(c.env.NOTES_KV, messagesKey(id), messages)
  const updatedMeta: AiSessionMeta = {
    ...meta,
    msgCount: messages.length,
    updatedAt: new Date().toISOString(),
  }
  await putJson(c.env.NOTES_KV, metaKey(id), updatedMeta)
  const list = (await getJson<AiSessionMeta[]>(c.env.NOTES_KV, LIST_KEY, [])).map(
    (m) => (m.id === id ? updatedMeta : m),
  )
  await putJson(c.env.NOTES_KV, LIST_KEY, list)
  return c.json({ ok: true, msgCount: messages.length })
})

export default sessions
