// Tiny in-process TTL+LRU cache. Mirrors Python's
// codetime-server-v3/src/utils/cache.py: not shared across workers, but
// good enough to short-circuit hot-path tag rule evaluation between
// repeated badge / dashboard requests.

type Entry<V> = { expiry: number, value: V }

export class TTLCache<K, V> {
  private readonly data = new Map<K, Entry<V>>()
  private readonly maxSize: number
  private readonly ttlMs: number

  constructor(maxSize = 1024, ttlSeconds = 60) {
    this.maxSize = maxSize
    this.ttlMs = ttlSeconds * 1000
  }

  get(key: K): V | undefined {
    const hit = this.data.get(key)
    if (!hit) {
      return undefined
    }
    if (Date.now() > hit.expiry) {
      this.data.delete(key)
      return undefined
    }
    // Move to most-recently-used by re-inserting.
    this.data.delete(key)
    this.data.set(key, hit)
    return hit.value
  }

  set(key: K, value: V): void {
    if (this.data.has(key)) {
      this.data.delete(key)
    }
    this.data.set(key, { expiry: Date.now() + this.ttlMs, value })
    while (this.data.size > this.maxSize) {
      const oldest = this.data.keys().next().value
      if (oldest === undefined) {
        break
      }
      this.data.delete(oldest)
    }
  }

  invalidateWhere(predicate: (key: K) => boolean): number {
    let count = 0
    for (const key of this.data.keys()) {
      if (predicate(key)) {
        this.data.delete(key)
        count++
      }
    }
    return count
  }

  clear(): void {
    this.data.clear()
  }
}
