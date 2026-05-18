import { Hono } from 'hono'
import { z } from 'zod'
import type { Bindings, Memo, MemoListItem } from '../types'
import { getJson, putJson, deleteKey } from '../lib/kv'
import { shortId } from '../lib/uuid'

const LIST_KEY = 'memos:list'
const ITEM_PREFIX = 'memos:'

function preview(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ')
  return trimmed.length > 80 ? trimmed.slice(0, 80) + '…' : trimmed
}

const createSchema = z.object({
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  linkedNoteId: z.string().optional(),
})

const patchSchema = z.object({
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
})

const memos = new Hono<{ Bindings: Bindings }>()

memos.get('/', async (c) => {
  const items = await getJson<MemoListItem[]>(c.env.NOTES_KV, LIST_KEY, [])
  return c.json({ items })
})

memos.post('/', async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'invalid body', detail: parsed.error.message }, 400)
  }
  const id = shortId()
  const now = new Date().toISOString()
  const memo: Memo = {
    id,
    content: parsed.data.content,
    tags: parsed.data.tags,
    linkedNoteId: parsed.data.linkedNoteId,
    createdAt: now,
    updatedAt: now,
  }
  await putJson(c.env.NOTES_KV, `${ITEM_PREFIX}${id}`, memo)
  const list = await getJson<MemoListItem[]>(c.env.NOTES_KV, LIST_KEY, [])
  list.unshift({
    id,
    createdAt: now,
    preview: preview(parsed.data.content),
    tags: parsed.data.tags,
  })
  await putJson(c.env.NOTES_KV, LIST_KEY, list)
  return c.json(memo)
})

memos.get('/:id', async (c) => {
  const memo = await getJson<Memo | null>(
    c.env.NOTES_KV,
    `${ITEM_PREFIX}${c.req.param('id')}`,
    null,
  )
  if (!memo) return c.json({ error: 'not found' }, 404)
  return c.json(memo)
})

memos.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const parsed = patchSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'invalid body', detail: parsed.error.message }, 400)
  }
  const memo = await getJson<Memo | null>(c.env.NOTES_KV, `${ITEM_PREFIX}${id}`, null)
  if (!memo) return c.json({ error: 'not found' }, 404)
  const updated: Memo = {
    ...memo,
    ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
    ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
    updatedAt: new Date().toISOString(),
  }
  await putJson(c.env.NOTES_KV, `${ITEM_PREFIX}${id}`, updated)
  const list = (await getJson<MemoListItem[]>(c.env.NOTES_KV, LIST_KEY, [])).map((m) =>
    m.id === id
      ? {
          ...m,
          preview:
            parsed.data.content !== undefined ? preview(parsed.data.content) : m.preview,
          tags: parsed.data.tags !== undefined ? parsed.data.tags : m.tags,
        }
      : m,
  )
  await putJson(c.env.NOTES_KV, LIST_KEY, list)
  return c.json({ ok: true })
})

memos.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await deleteKey(c.env.NOTES_KV, `${ITEM_PREFIX}${id}`)
  const list = (await getJson<MemoListItem[]>(c.env.NOTES_KV, LIST_KEY, [])).filter(
    (m) => m.id !== id,
  )
  await putJson(c.env.NOTES_KV, LIST_KEY, list)
  return c.json({ ok: true })
})

export default memos
