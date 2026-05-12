import { defineEventHandler, readBody, readFormData, sendRedirect } from 'h3'
import { setAuthCookies } from '../../../utils/auth-cookie'
import { frontendUrl, upsertGoogleUser, verifyGoogleIdToken } from '../../../utils/oauth'

// Mirrors POST /v3/auth/google. Receives a `credential` JWT from
// Google Sign-In (form-encoded), verifies it, upserts the user, sets
// the shared auth cookie pair, and redirects to the frontend.

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Google Sign-In callback',
    requestBody: {
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          schema: {
            type: 'object',
            required: ['credential'],
            properties: { credential: { type: 'string' } },
          },
        },
      },
    },
    responses: { 302: { description: 'Redirect to frontend' } },
  },
})

async function readCredential(event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => any ? E : never): Promise<string | null> {
  try {
    const form = await readFormData(event)
    const v = form.get('credential')
    if (typeof v === 'string' && v) {
 return v
}
  }
  catch {}
  const body = await readBody(event).catch(() => null) as Record<string, any> | null
  return typeof body?.credential === 'string' ? body.credential : null
}

export default defineEventHandler(async (event) => {
  const fe = frontendUrl()
  const credential = await readCredential(event as any)
  if (!credential) {
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Missing credential parameter')}`, 302)
  }
  if (credential.length < 32 || credential.length > 4096) {
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Invalid Google credential')}`, 302)
  }
  try {
    const claims = await verifyGoogleIdToken(credential)
    if (!claims.sub) {
      return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Google user ID not found')}`, 302)
    }
    const { id, tokenV1 } = await upsertGoogleUser(claims)
    setAuthCookies(event, id, tokenV1)
    return sendRedirect(event, fe, 302)
  }
  catch (error) {
    console.error('[auth.google]', error)
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Authentication failed. Please try again.')}`, 302)
  }
})
