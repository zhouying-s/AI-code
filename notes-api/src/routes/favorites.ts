import { Hono } from 'hono'
import { z } from 'zod'
import type { Bindings, FavType } from '../types'
import { getJson, putJson } from '../lib/kv'

const NOTES_KEY = 'favorites:notes'
const MEMOS_KEY = 'favorites:memos'

function keyFor(t: FavType): string {
  return t === 'note' ? NOTES_KEY : MEMOS_KEY
}

const opSchema = z.object({
  type: z.enum(['note', 'memo']),
  id: z.string().min(1),
  op: z.enum(['add', 'remove']),
})

const favorites = new Hono<{ Bindings: Bindings }>()

favorites.get('/', async (c) => {
  const notes = await getJson<string[]>(c.env.NOTES_KV, NOTES_KEY, [])
  const memos = await getJson<string[]>(c.env.NOTES_KV, MEMOS_KEY, [])
  return c.json({ notes, memos })
})

favorites.post('/', async (c) => {
  const parsed = opSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'invalid body', detail: parsed.error.message }, 400)
  }
  const k = keyFor(parsed.data.type)
  const list = await getJson<string[]>(c.env.NOTES_KV, k, [])
  if (parsed.data.op === 'add') {
    if (!list.includes(parsed.data.id)) list.push(parsed.data.id)
  } else {
    const idx = list.indexOf(parsed.data.id)
    if (idx >= 0) list.splice(idx, 1)
  }
  await putJson(c.env.NOTES_KV, k, list)
  return c.json({ ok: true })
})

export default favorites
