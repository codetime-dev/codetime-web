// Simple in-process token-bucket rate limiter. Used by the auth-rate-limit
// middleware to throttle anonymous endpoints (OAuth callbacks, JWT
// verification, refresh-token) so a single client can't drive unbounded
// JWKS fetches, DB writes, or CPU on identity-token verification.
//
// Caveats:
//   * Per-process state. PM2 cluster runs 2 workers, so the effective
//     rate is up to 2x what `capacity` says. Acceptable for the goal of
//     making abuse unattractive rather than impossible.
//   * Map is pruned opportunistically each call. A periodic sweep would
//     be tidier but the bucket count is bounded by recent-IP count anyway.

type Bucket = {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()
const PRUNE_EVERY_N_CALLS = 1024
const PRUNE_IDLE_MS = 10 * 60 * 1000
let calls = 0

function maybePrune(now: number): void {
  calls += 1
  if (calls % PRUNE_EVERY_N_CALLS !== 0) {
    return
  }
  for (const [key, b] of buckets) {
    if (now - b.lastRefill > PRUNE_IDLE_MS) {
      buckets.delete(key)
    }
  }
}

// `capacity` is the burst size (initial tokens); `refillPerSec` is the
// long-run rate. Returns true when a token was consumed, false when
// rate-limited. Bucket is created lazily on first miss for `key`.
export function takeToken(key: string, capacity: number, refillPerSec: number): boolean {
  const now = Date.now()
  maybePrune(now)
  const bucket = buckets.get(key) ?? { tokens: capacity, lastRefill: now }
  const elapsedSec = Math.max(0, (now - bucket.lastRefill) / 1000)
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillPerSec)
  bucket.lastRefill = now
  if (bucket.tokens < 1) {
    buckets.set(key, bucket)
    return false
  }
  bucket.tokens -= 1
  buckets.set(key, bucket)
  return true
}
