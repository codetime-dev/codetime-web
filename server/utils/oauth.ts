import { createPublicKey, createVerify, randomBytes } from 'node:crypto'
import process from 'node:process'
import { eq } from 'drizzle-orm'
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

export async function upsertGithubUser(gh: GithubUser): Promise<{ id: number, tokenV1: string }> {
  const db = useDb()
  const [existing] = await db.select().from(users).where(eq(users.githubId, gh.id)).limit(1)
  if (existing) {
    const patch: Partial<typeof users.$inferInsert> = {}
    if (!existing.email && gh.email) {
      patch.email = gh.email
    }
    if (gh.avatar_url) {
      patch.avatar = gh.avatar_url
    }
    // Some legacy rows (carried over from the Vue/Next-era backends) have
    // `token_v1 = ''` even though the column is NOT NULL. The cookie pair
    // we mint then carries an empty `auth_token` which `tryUser` rejects
    // — the user appears unauthenticated immediately after a successful
    // GitHub callback. Re-mint a fresh token on the fly so login works.
    let tokenV1 = existing.tokenV1
    if (!tokenV1) {
      tokenV1 = randomBytes(24).toString('hex')
      patch.tokenV1 = tokenV1
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, existing.id))
    }
    return { id: existing.id, tokenV1 }
  }
  const tokenV1 = randomBytes(24).toString('hex')
  const uploadToken = randomBytes(24).toString('hex')
  const now = new Date()
  const [created] = await db.insert(users).values({
    githubId: gh.id,
    email: gh.email,
    username: gh.login,
    avatar: gh.avatar_url,
    googleId: null,
    plan: 'free',
    uploadToken,
    tokenV1,
    createdAt: now,
    updatedAt: now,
  } as any).returning({ id: users.id, tokenV1: users.tokenV1 })
  if (!created) {
 throw new Error('Failed to create user')
}
  return { id: Number(created.id), tokenV1: created.tokenV1 }
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

export async function upsertGoogleUser(claims: GoogleClaims): Promise<{ id: number, tokenV1: string }> {
  const db = useDb()
  const [existing] = await db.select().from(users).where(eq(users.googleId, claims.sub)).limit(1)
  if (existing) {
    const patch: Partial<typeof users.$inferInsert> = {}
    if (!existing.email && claims.email) {
      patch.email = claims.email
    }
    if (claims.picture) {
      patch.avatar = claims.picture
    }
    // Same legacy-empty-token_v1 mitigation as in upsertGithubUser.
    let tokenV1 = existing.tokenV1
    if (!tokenV1) {
      tokenV1 = randomBytes(24).toString('hex')
      patch.tokenV1 = tokenV1
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, existing.id))
    }
    return { id: existing.id, tokenV1 }
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
  } as any).returning({ id: users.id, tokenV1: users.tokenV1 })
  if (!created) {
 throw new Error('Failed to create user')
}
  return { id: Number(created.id), tokenV1: created.tokenV1 }
}
