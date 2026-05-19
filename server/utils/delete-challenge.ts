import { createHmac, timingSafeEqual } from 'node:crypto'

// HMAC-based one-shot challenge token used by the destructive
// /v3/users/self DELETE routes (full account vs. activity-data wipe).
// Keyed by the calling user's own `token_v1`, which rotates whenever the
// account is deleted or tokens are refreshed — so a leaked challenge
// can't outlive the session it was minted in.
//
// Token wire format: `<expMs>.<hex-hmac>`.
// MAC input:         `${userId}.${expMs}.${purpose}`.
//
// `purpose` ('account' | 'data') binds the token to one specific DELETE
// route. A challenge minted to wipe data cannot be redeemed against the
// full-account-delete endpoint or vice versa.

export const CHALLENGE_TTL_MS = 60 * 1000

export type DeletePurpose = 'account' | 'data'

export function signDeleteChallenge(
  userId: number,
  tokenV1: string,
  expMs: number,
  purpose: DeletePurpose,
): string {
  const mac = createHmac('sha256', tokenV1).update(`${userId}.${expMs}.${purpose}`).digest('hex')
  return `${expMs}.${mac}`
}

export function verifyDeleteChallenge(
  challenge: string,
  userId: number,
  tokenV1: string,
  purpose: DeletePurpose,
): boolean {
  const dot = challenge.indexOf('.')
  if (dot <= 0) {
    return false
  }
  const expMs = Number(challenge.slice(0, dot))
  const provided = challenge.slice(dot + 1)
  if (!Number.isFinite(expMs) || expMs < Date.now()) {
    return false
  }
  const expected = createHmac('sha256', tokenV1).update(`${userId}.${expMs}.${purpose}`).digest('hex')
  if (expected.length !== provided.length) {
    return false
  }
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'))
  }
  catch {
    return false
  }
}
