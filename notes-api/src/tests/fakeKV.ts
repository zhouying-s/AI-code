// In-memory KV mock that mimics the subset of @cloudflare/workers-types KVNamespace
// we actually use in routes (get/put/delete/list).
export class FakeKV {
  store = new Map<string, { value: string; expiresAt?: number }>()

  async get(key: string, type?: 'text' | 'json'): Promise<unknown> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    if (type === 'json') {
      try {
        return JSON.parse(entry.value)
      } catch {
        return null
      }
    }
    return entry.value
  }

  async put(
    key: string,
    value: string,
    opts?: { expirationTtl?: number },
  ): Promise<void> {
    const expiresAt = opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : undefined
    this.store.set(key, { value, expiresAt })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async list(opts?: { prefix?: string }): Promise<{ keys: { name: string }[] }> {
    const prefix = opts?.prefix ?? ''
    const keys = Array.from(this.store.keys())
      .filter((k) => k.startsWith(prefix))
      .map((name) => ({ name }))
    return { keys }
  }

  clear(): void {
    this.store.clear()
  }
}
