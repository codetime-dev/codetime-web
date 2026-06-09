import { createHash, createPublicKey, createVerify, randomBytes } from 'node:crypto'
import process from 'node:process'
import { and, eq, isNull } from 'drizzle-orm'
import { users } from '../db/schema'
import { useDb } from './db'
import { isProduction } from './env'

// OAuth helpers — GitHub code exchange + Google ID-token verification.
// Mirrors codetime-server-v3 services/auth.py. Cookies and downstream
// user_guard checks live in utils/auth-cookie.ts and utils/auth.ts.

// OAuth callback handlers redirect the browser back to the frontend
// after a successful sign-in. `FRONTEND_URL` env overrides; otherwise
// production resolves to https://codetime.dev (see utils/env.ts for the
// production detection cascade), with a localhost fallback for dev.
export function frontendUrl(): string {
  const override = process.env.FRONTEND_URL
  if (override) {
 return override.replace(/\/$/, '')
}
  return isProduction() ? 'https://codetime.dev' : 'http://localhost:3001'
}

// HttpOnly cookies that bridge /v3/auth/github/start → GitHub /authorize
// → /v3/auth/github callback. STATE pins the OAuth `state` param;
// LINK_INTENT marks the round-trip as link-mode (attach identity to
// signed-in user instead of upsert). See server/routes/v3/auth/github/start.get.ts.
export const GITHUB_STATE_COOKIE = 'gh_oauth_state'
export const GITHUB_LINK_COOKIE = 'gh_link_intent'
// Bridges /v3/auth/github/start?return_to=… → callback so a logged-out
// user who signs in from e.g. /cli/auth lands back there (with its
// ?port=&state= intact) instead of the homepage. See safeReturnPath.
export const GITHUB_RETURN_COOKIE = 'gh_return_to'
export const GITHUB_STATE_TTL_SECONDS = 10 * 60

// Validate a post-login redirect target. We only ever redirect within
// our own site, so the value must be a root-relative path. Rejecting
// anything that isn't `/<path>` — and specifically `//` or `/\`, which
// browsers treat as protocol-relative — closes the open-redirect hole
// where an attacker crafts ?return_to=//evil.com to bounce a freshly
// authenticated user off-site. Returns the safe path, or null.
export function safeReturnPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 512) {
    return null
  }
  // Must be root-relative and not protocol-relative / backslash-tricked.
  if (raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\') {
    return null
  }
  // No control characters (incl. CR/LF) that could split headers.
  if (/[\u0000-\u001F\u007F]/.test(raw)) {
    return null
  }
  return raw
}

export async function exchangeGithubCode(code: string, redirectUri?: string): Promise<{ accessToken: string }> {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
 throw new Error('GitHub OAuth is not configured')
}
  // GitHub binds the issued code to whichever redirect_uri was sent at
  // /authorize. When the OAuth app has multiple callback URLs registered
  // (legacy api.codetime.dev + new codetime.dev) the default is no longer
  // unambiguous, so /access_token must echo the SAME redirect_uri the
  // browser used or GitHub returns `bad_verification_code`.
  const params: Record<string, string> = { client_id: clientId, client_secret: clientSecret, code }
  if (redirectUri) {
 params.redirect_uri = redirectUri
}
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
  if (!res.ok) {
 throw new Error(`GitHub token exchange failed: ${res.status}`)
}
  const body = await res.json() as Record<string, any>
  if (body.error) {
 throw new Error(`GitHub OAuth error: ${body.error_description ?? body.error}`)
}
  if (!body.access_token) {
 throw new Error('GitHub access token missing')
}
  return { accessToken: String(body.access_token) }
}

export type GithubUser = {
  id: number
  login: string
  email: string | null
  avatar_url: string | null
}

export async function fetchGithubUser(accessToken: string): Promise<GithubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) {
 throw new Error(`Failed to get GitHub user info: ${res.status}`)
}
  const u = await res.json() as Record<string, any>
  return {
    id: Number(u.id),
    login: String(u.login),
    email: u.email ?? null,
    avatar_url: u.avatar_url ?? null,
  }
}

export async function upsertGithubUser(gh: GithubUser): Promise<{ id: number, tokenV1: string, uploadToken: string }> {
  const db = useDb()
  // `deleted_at IS NULL` so a soft-deleted account is never resurrected
  // — DELETE /v3/users/self also nulls github_id, but defence in depth
  // in case a future code path forgets to clear it.
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.githubId, gh.id), isNull(users.deletedAt)))
    .limit(1)
  if (existing) {
    const patch: Partial<typeof users.$inferInsert> = {}
    if (!existing.email && gh.email) {
      patch.email = gh.email
    }
    if (gh.avatar_url) {
      patch.avatar = gh.avatar_url
    }
    if (gh.login && existing.githubLogin !== gh.login) {
      patch.githubLogin = gh.login
    }
    // Some legacy rows (carried over from the Vue/Next-era backends) have
    // `token_v1 = ''` / `upload_token = ''` even though the columns are
    // NOT NULL. The cookie pair / Bearer header we mint then carries an
    // empty value and `tryUser` rejects it — the user appears
    // unauthenticated immediately after a successful GitHub callback.
    // Re-mint on the fly so login works.
    let tokenV1 = existing.tokenV1
    if (!tokenV1) {
      tokenV1 = randomBytes(24).toString('hex')
      patch.tokenV1 = tokenV1
    }
    let uploadToken = existing.uploadToken
    if (!uploadToken) {
      uploadToken = randomBytes(24).toString('hex')
      patch.uploadToken = uploadToken
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, existing.id))
    }
    return { id: existing.id, tokenV1, uploadToken }
  }
  const tokenV1 = randomBytes(24).toString('hex')
  const uploadToken = randomBytes(24).toString('hex')
  const now = new Date()
  const [created] = await db.insert(users).values({
    githubId: gh.id,
    githubLogin: gh.login,
    email: gh.email,
    username: gh.login,
    avatar: gh.avatar_url,
    googleId: null,
    plan: 'free',
    uploadToken,
    tokenV1,
    createdAt: now,
    updatedAt: now,
  } as any).returning({ id: users.id, tokenV1: users.tokenV1, uploadToken: users.uploadToken })
  if (!created) {
 throw new Error('Failed to create user')
}
  return { id: Number(created.id), tokenV1: created.tokenV1, uploadToken: created.uploadToken }
}

// Verify a Google ID token by validating its RS256 signature against
// Google's public JWKS. Previously hit the `tokeninfo` debug endpoint,
// but Google has been progressively rejecting credentials there (returns
// HTTP 400 even for tokens that pass full signature verification),
// which broke Sign In With Google in production. JWKS-based verification
// is the path Google's own docs recommend for production servers.
type GoogleClaims = {
  sub: string
  email?: string
  name?: string
  picture?: string
  iss: string
  aud: string
  exp: number
  iat: number
  email_verified?: string | boolean
}

type Jwk = { kid: string, kty: string, alg: string, n: string, e: string, use?: string }

let jwksCache: { keys: Map<string, ReturnType<typeof createPublicKey>>, fetchedAt: number } | null = null

async function loadGoogleJwks(): Promise<Map<string, ReturnType<typeof createPublicKey>>> {
  const TTL_MS = 60 * 60 * 1000
  if (jwksCache && Date.now() - jwksCache.fetchedAt < TTL_MS) {
    return jwksCache.keys
  }
  const res = await fetch('https://www.googleapis.com/oauth2/v3/certs')
  if (!res.ok) {
    throw new Error(`Failed to fetch Google JWKS: ${res.status}`)
  }
  const body = await res.json() as { keys: Jwk[] }
  const keys = new Map<string, ReturnType<typeof createPublicKey>>()
  for (const jwk of body.keys) {
    keys.set(jwk.kid, createPublicKey({ key: jwk as any, format: 'jwk' }))
  }
  jwksCache = { keys, fetchedAt: Date.now() }
  return keys
}

function b64urlToBuffer(s: string): Buffer {
  return Buffer.from(s.replaceAll('-', '+').replaceAll('_', '/'), 'base64')
}

// Exchange a Google OAuth authorization code for an ID token using PKCE.
// Used by the iOS App's native sign-in flow: the App generated the
// code_verifier locally, kicked off /authorize with the matching challenge,
// got the code via custom-scheme redirect, and now hands {code,verifier}
// to us. We're a public-client exchange (no client_secret) because the
// Google OAuth client is of type "iOS" — PKCE is the security boundary.
export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  clientId: string,
): Promise<{ idToken: string }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Google token exchange failed: ${res.status} ${detail}`)
  }
  const body = await res.json() as Record<string, any>
  if (body.error) {
    throw new Error(`Google OAuth error: ${body.error_description ?? body.error}`)
  }
  if (!body.id_token) {
    throw new Error('Google id_token missing from token response')
  }
  return { idToken: String(body.id_token) }
}

export async function verifyGoogleIdToken(
  idToken: string,
  expectedAudience?: string,
): Promise<GoogleClaims> {
  const clientId = expectedAudience
    || process.env.GOOGLE_CLIENT_ID
    || process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('Google OAuth client ID not configured')
  }
  const parts = idToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid Google ID token: malformed JWT')
  }
  const [headerB64, payloadB64, signatureB64] = parts
  let header: { alg: string, kid: string, typ?: string }
  let claims: GoogleClaims
  try {
    header = JSON.parse(b64urlToBuffer(headerB64!).toString('utf8'))
    claims = JSON.parse(b64urlToBuffer(payloadB64!).toString('utf8'))
  }
  catch {
    throw new Error('Invalid Google ID token: undecodable')
  }
  if (header.alg !== 'RS256') {
    throw new Error(`Invalid Google ID token: alg ${header.alg}`)
  }
  const keys = await loadGoogleJwks()
  let key = keys.get(header.kid)
  if (!key) {
    // Key rotation: force-refresh JWKS once before giving up.
    jwksCache = null
    const refreshed = await loadGoogleJwks()
    key = refreshed.get(header.kid)
    if (!key) {
      throw new Error(`Invalid Google ID token: unknown kid ${header.kid}`)
    }
  }
  const signed = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8')
  const verifier = createVerify('RSA-SHA256')
  verifier.update(signed)
  verifier.end()
  if (!verifier.verify(key, b64urlToBuffer(signatureB64!))) {
    throw new Error('Invalid Google ID token: signature mismatch')
  }
  const now = Math.floor(Date.now() / 1000)
  if (typeof claims.exp === 'number' && claims.exp < now - 30) {
    throw new Error('Invalid Google ID token: expired')
  }
  if (typeof claims.iat === 'number' && claims.iat > now + 300) {
    throw new Error('Invalid Google ID token: issued in the future')
  }
  if (claims.aud !== clientId) {
    throw new Error('Invalid Google ID token audience')
  }
  if (claims.iss !== 'accounts.google.com' && claims.iss !== 'https://accounts.google.com') {
    throw new Error('Invalid Google ID token issuer')
  }
  return claims
}

// Apple Sign in with Apple support.
// JWKS at https://appleid.apple.com/auth/keys; identity tokens are RS256
// JWTs whose `aud` is the requesting bundle/Service ID and whose `nonce`
// is the SHA-256 hex digest of the raw nonce the client generated. The
// `sub` claim is the stable per-team user identifier — same value for
// the same Apple ID across iOS bundle + web Service ID as long as both
// are in the same App ID group / configured as primary App ID.
type AppleClaims = {
  sub: string
  email?: string
  email_verified?: string | boolean
  is_private_email?: string | boolean
  nonce?: string
  iss: string
  aud: string
  exp: number
  iat: number
}

let appleJwksCache: { keys: Map<string, ReturnType<typeof createPublicKey>>, fetchedAt: number } | null = null

async function loadAppleJwks(): Promise<Map<string, ReturnType<typeof createPublicKey>>> {
  const TTL_MS = 60 * 60 * 1000
  if (appleJwksCache && Date.now() - appleJwksCache.fetchedAt < TTL_MS) {
    return appleJwksCache.keys
  }
  const res = await fetch('https://appleid.apple.com/auth/keys')
  if (!res.ok) {
    throw new Error(`Failed to fetch Apple JWKS: ${res.status}`)
  }
  const body = await res.json() as { keys: Jwk[] }
  const keys = new Map<string, ReturnType<typeof createPublicKey>>()
  for (const jwk of body.keys) {
    keys.set(jwk.kid, createPublicKey({ key: jwk as any, format: 'jwk' }))
  }
  appleJwksCache = { keys, fetchedAt: Date.now() }
  return keys
}

// Verifies an Apple `identity_token`. `expectedAudience` is the Bundle ID
// (iOS) or Services ID (web).
//
// `expectedNonceClaim` is the exact string we expect to find in the JWT's
// `nonce` claim. The two client SDKs hash the user-provided nonce
// differently — Sign in with Apple on iOS expects the *SHA-256 hex
// digest* in `request.nonce` and that's what lands in the JWT; the web
// `AppleID.auth.init({ nonce })` SDK ships the raw value verbatim. So
// callers compute the appropriate form before calling this:
//   * iOS native: `sha256Hex(rawNonce)`
//   * Web popup:  `rawNonce`
// Pass `null` to skip the nonce check (e.g. when using `state` instead
// for a form-post flow).
export async function verifyAppleIdentityToken(
  identityToken: string,
  expectedAudience: string,
  expectedNonceClaim: string | null,
): Promise<AppleClaims> {
  const parts = identityToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid Apple identity token: malformed JWT')
  }
  const [headerB64, payloadB64, signatureB64] = parts
  let header: { alg: string, kid: string, typ?: string }
  let claims: AppleClaims
  try {
    header = JSON.parse(b64urlToBuffer(headerB64!).toString('utf8'))
    claims = JSON.parse(b64urlToBuffer(payloadB64!).toString('utf8'))
  }
  catch {
    throw new Error('Invalid Apple identity token: undecodable')
  }
  if (header.alg !== 'RS256') {
    throw new Error(`Invalid Apple identity token: alg ${header.alg}`)
  }
  const keys = await loadAppleJwks()
  let key = keys.get(header.kid)
  if (!key) {
    // Apple rotates keys; force-refresh once before giving up.
    appleJwksCache = null
    const refreshed = await loadAppleJwks()
    key = refreshed.get(header.kid)
    if (!key) {
      throw new Error(`Invalid Apple identity token: unknown kid ${header.kid}`)
    }
  }
  const signed = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8')
  const verifier = createVerify('RSA-SHA256')
  verifier.update(signed)
  verifier.end()
  if (!verifier.verify(key, b64urlToBuffer(signatureB64!))) {
    throw new Error('Invalid Apple identity token: signature mismatch')
  }
  const now = Math.floor(Date.now() / 1000)
  if (typeof claims.exp === 'number' && claims.exp < now - 30) {
    throw new Error('Invalid Apple identity token: expired')
  }
  if (typeof claims.iat === 'number' && claims.iat > now + 300) {
    throw new Error('Invalid Apple identity token: issued in the future')
  }
  if (claims.iss !== 'https://appleid.apple.com') {
    throw new Error('Invalid Apple identity token issuer')
  }
  if (claims.aud !== expectedAudience) {
    throw new Error('Invalid Apple identity token audience')
  }
  if (expectedNonceClaim !== null && (!claims.nonce || claims.nonce !== expectedNonceClaim)) {
      throw new Error('Invalid Apple identity token: nonce mismatch')
    }
  if (!claims.sub) {
    throw new Error('Invalid Apple identity token: missing sub')
  }
  return claims
}

// SHA-256 hex digest of the raw nonce, matching what Apple Sign In
// clients (Swift `SignInWithAppleButton`, JS AppleID auth) place in the
// `nonce` field of the identity token.
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

export async function upsertAppleUser(
  appleSub: string,
  emailFromClient: string | null,
  fullNameFromClient: string | null,
  emailFromClaims: string | null,
): Promise<{ id: number, tokenV1: string, uploadToken: string }> {
  const db = useDb()
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.appleId, appleSub), isNull(users.deletedAt)))
    .limit(1)

  // Apple only returns email/fullName on the *first* successful sign-in
  // for a given (Apple ID, App ID) pair. For email, prefer the JWT
  // claim because it's signed by Apple — the client-supplied body field
  // is unauthenticated and a malicious client could otherwise persist
  // any address (including a third party's) as the new account's email.
  // We fall back to the body value only when Apple itself did not ship
  // an `email` claim. Names are not in the JWT, so we have no choice but
  // to trust the body for `full_name`.
  const preferredEmail = emailFromClaims ?? emailFromClient ?? null

  if (existing) {
    const patch: Partial<typeof users.$inferInsert> = {}
    if (!existing.email && preferredEmail) {
      patch.email = preferredEmail
    }
    // Same legacy-empty-token mitigation as in upsertGithubUser /
    // upsertGoogleUser. Some pre-Drizzle rows shipped with empty
    // upload_token / token_v1 columns.
    let tokenV1 = existing.tokenV1
    if (!tokenV1) {
      tokenV1 = randomBytes(24).toString('hex')
      patch.tokenV1 = tokenV1
    }
    let uploadToken = existing.uploadToken
    if (!uploadToken) {
      uploadToken = randomBytes(24).toString('hex')
      patch.uploadToken = uploadToken
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, existing.id))
    }
    return { id: existing.id, tokenV1, uploadToken }
  }

  const tokenV1 = randomBytes(24).toString('hex')
  const uploadToken = randomBytes(24).toString('hex')
  const username = deriveAppleUsername(fullNameFromClient, preferredEmail, appleSub)
  const now = new Date()
  const [created] = await db.insert(users).values({
    appleId: appleSub,
    email: preferredEmail,
    username,
    plan: 'free',
    uploadToken,
    tokenV1,
    createdAt: now,
    updatedAt: now,
  } as any).returning({ id: users.id, tokenV1: users.tokenV1, uploadToken: users.uploadToken })
  if (!created) {
    throw new Error('Failed to create user')
  }
  return { id: Number(created.id), tokenV1: created.tokenV1, uploadToken: created.uploadToken }
}

function deriveAppleUsername(fullName: string | null, email: string | null, sub: string): string {
  const cleanedName = fullName?.trim()
  if (cleanedName) {
    return cleanedName
  }
  if (email) {
    const local = email.split('@')[0]
    if (local) {
      return local
    }
  }
  // Apple sub is opaque and quite long; truncate for a usable handle.
  return `apple_${sub.slice(0, 8)}`
}

export async function upsertGoogleUser(claims: GoogleClaims): Promise<{ id: number, tokenV1: string, uploadToken: string }> {
  const db = useDb()
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.googleId, claims.sub), isNull(users.deletedAt)))
    .limit(1)
  if (existing) {
    const patch: Partial<typeof users.$inferInsert> = {}
    if (!existing.email && claims.email) {
      patch.email = claims.email
    }
    if (claims.picture) {
      patch.avatar = claims.picture
    }
    // Same legacy-empty-token mitigation as in upsertGithubUser.
    let tokenV1 = existing.tokenV1
    if (!tokenV1) {
      tokenV1 = randomBytes(24).toString('hex')
      patch.tokenV1 = tokenV1
    }
    let uploadToken = existing.uploadToken
    if (!uploadToken) {
      uploadToken = randomBytes(24).toString('hex')
      patch.uploadToken = uploadToken
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, existing.id))
    }
    return { id: existing.id, tokenV1, uploadToken }
  }
  const tokenV1 = randomBytes(24).toString('hex')
  const uploadToken = randomBytes(24).toString('hex')
  const username = claims.email ? claims.email.split('@')[0] : `user_${claims.sub}`
  const now = new Date()
  const [created] = await db.insert(users).values({
    googleId: claims.sub,
    email: claims.email ?? null,
    username: username ?? `user_${claims.sub}`,
    avatar: claims.picture ?? null,
    plan: 'free',
    uploadToken,
    tokenV1,
    createdAt: now,
    updatedAt: now,
  } as any).returning({ id: users.id, tokenV1: users.tokenV1, uploadToken: users.uploadToken })
  if (!created) {
 throw new Error('Failed to create user')
}
  return { id: Number(created.id), tokenV1: created.tokenV1, uploadToken: created.uploadToken }
}

// =============================================================================
// Account linking — attach an additional provider identity to an existing
// signed-in user without spawning a new row, and detach it later.
//
// Called from POST/DELETE /v3/auth/{provider}/link after the route has
// verified the provider credential the same way the signin path does.
// =============================================================================

export type LinkOutcome = 'linked' | 'already-yours' | 'taken-by-self' | 'conflict'

type ProviderIdField = 'githubId' | 'googleId' | 'appleId'

// Outcomes:
//   * 'linked'        — patched the field on the current user row.
//   * 'already-yours' — the user is already linked to this exact sub
//                       (idempotent; safe for the UI to retry).
//   * 'taken-by-self' — the user already has a *different* identity on
//                       this provider — refuse to silently overwrite.
//   * 'conflict'      — some other non-deleted user already owns this
//                       sub.
//
// Soft-deleted users do not count as conflicts; DELETE /v3/users/self
// nulls the OAuth IDs already, but defence in depth.
export async function linkProviderIdentity(
  userId: number,
  field: ProviderIdField,
  value: number | string,
): Promise<LinkOutcome> {
  const db = useDb()
  const column = users[field]
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(column as any, value as any), isNull(users.deletedAt)))
    .limit(1)
  if (existing) {
    return existing.id === userId ? 'already-yours' : 'conflict'
  }
  const [self] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!self) {
    return 'conflict'
  }
  const current = self[field]
  if (current != null && current !== value) {
    return 'taken-by-self'
  }
  await db
    .update(users)
    .set({ [field]: value as any, updatedAt: new Date() })
    .where(eq(users.id, userId))
  return 'linked'
}

// Persist a fresh GitHub `login` for an already-linked user. Used by the
// /v3/auth/github link branch (which only patches github_id) and any future
// re-link path — kept idempotent so callers don't need to read first.
export async function setGithubLogin(userId: number, login: string): Promise<void> {
  if (!login) {
    return
  }
  const db = useDb()
  await db
    .update(users)
    .set({ githubLogin: login, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

export type UnlinkOutcome = 'unlinked' | 'not-linked' | 'last-one'

// Refuses to remove the LAST connected provider — once all three OAuth
// IDs are null the row becomes unreachable through any login flow.
export async function unlinkProviderIdentity(
  userId: number,
  field: ProviderIdField,
): Promise<UnlinkOutcome> {
  const db = useDb()
  const [self] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!self || self[field] == null) {
    return 'not-linked'
  }
  const others: ProviderIdField[] = (['githubId', 'googleId', 'appleId'] as const).filter(f => f !== field)
  const hasAnother = others.some(f => self[f] != null)
  if (!hasAnother) {
    return 'last-one'
  }
  // Clear github_login alongside github_id — without the numeric id the
  // login is dangling and the public profile would still try to render the
  // link icon.
  const patch: Record<string, any> = { [field]: null, updatedAt: new Date() }
  if (field === 'githubId') {
    patch.githubLogin = null
  }
  await db
    .update(users)
    .set(patch)
    .where(eq(users.id, userId))
  return 'unlinked'
}
