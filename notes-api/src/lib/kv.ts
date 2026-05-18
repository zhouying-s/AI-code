import type { KVNamespace } from '@cloudflare/workers-types'

export async function getJson<T>(kv: KVNamespace, key: string, fallback: T): Promise<T> {
  const raw = await kv.get(key, 'json')
  if (raw === null || raw === undefined) return fallback
  return raw as T
}

export async function putJson(kv: KVNamespace, key: string, value: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(value))
}

export async function deleteKey(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key)
}
