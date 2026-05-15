import { randomBytes } from 'node:crypto'
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

export async function exchangeGithubCode(code: string): Promise<{ accessToken: string }> {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
 throw new Error('GitHub OAuth is not configured')
}
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code }),
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
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, existing.id))
    }
    return { id: existing.id, tokenV1: existing.tokenV1 }
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

// Verify a Google ID token by hitting Google's public tokeninfo endpoint —
// avoids pulling the heavy google-auth-library just to validate signatures.
// Returns the verified claims when the audience matches the configured
// client id and the issuer is Google.
type GoogleClaims = {
  sub: string
  email?: string
  name?: string
  picture?: string
  iss: string
  aud: string
  email_verified?: string | boolean
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleClaims> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
 throw new Error('Google OAuth client ID not configured')
}
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  if (!res.ok) {
 throw new Error(`Invalid Google ID token: ${res.status}`)
}
  const claims = await res.json() as GoogleClaims
  if (claims.aud !== clientId) {
 throw new Error('Invalid Google ID token audience')
}
  if (!claims.iss.endsWith('accounts.google.com')) {
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
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, existing.id))
    }
    return { id: existing.id, tokenV1: existing.tokenV1 }
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
