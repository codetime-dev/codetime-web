import process from 'node:process'
import { createError, defineEventHandler, readBody } from 'h3'
import { setAuthCookies } from '../../../utils/auth-cookie'
import { upsertAppleUser, verifyAppleIdentityToken } from '../../../utils/oauth'

// Web Sign in with Apple endpoint, called from the LoginButton popup flow.
//
// The browser uses `AppleID.auth.signIn({ nonce })` from Apple's JS SDK
// to surface the system Apple-ID prompt in a popup, then POSTs the
// resulting credential here. We verify the identity token, upsert the
// user, set the auth-cookie pair the rest of the app reads, and answer
// the AJAX call so the SPA can reload into a signed-in state.
//
// Distinct from `auth/apple/native.post.ts`:
//   * audience is the web *Services ID* (not the iOS Bundle ID)
//   * the SDK passes the raw nonce verbatim into the JWT, so we compare
//     against the raw value here (iOS native compares against SHA-256(raw))
//   * we set cookies rather than returning a Bearer token

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Web Sign in with Apple (popup → cookie)',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['identity_token', 'nonce'],
            properties: {
              identity_token: { type: 'string' },
              nonce: { type: 'string' },
              email: { type: 'string' },
              full_name: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Signed in; auth cookies set',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['success', 'user_id'],
              properties: {
                success: { type: 'boolean' },
                user_id: { type: 'integer' },
              },
            },
          },
        },
      },
      400: { description: 'Invalid request' },
      401: { description: 'Apple identity token verification failed' },
    },
  },
})

type Body = {
  identity_token?: unknown
  nonce?: unknown
  email?: unknown
  full_name?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event).catch(() => ({} as Body))

  const identityToken = typeof body.identity_token === 'string' ? body.identity_token : null
  const rawNonce = typeof body.nonce === 'string' ? body.nonce : null
  const emailFromClient = typeof body.email === 'string' && body.email.trim() !== ''
    ? body.email.trim()
    : null
  const fullNameFromClient = typeof body.full_name === 'string' && body.full_name.trim() !== ''
    ? body.full_name.trim()
    : null

  if (!identityToken || !rawNonce) {
    throw createError({ statusCode: 400, statusMessage: 'identity_token and nonce are required' })
  }

  const webServiceId = process.env.APPLE_WEB_SERVICE_ID
  if (!webServiceId) {
    console.error('[auth.apple] APPLE_WEB_SERVICE_ID is not configured')
    throw createError({ statusCode: 500, statusMessage: 'Apple Sign In is not configured' })
  }

  // The web AppleID JS SDK puts the *raw* nonce in the JWT's `nonce`
  // claim (unlike iOS, which hashes it first).
  let claims: Awaited<ReturnType<typeof verifyAppleIdentityToken>>
  try {
    claims = await verifyAppleIdentityToken(identityToken, webServiceId, rawNonce)
  }
  catch (error) {
    console.error('[auth.apple]', (error as Error).message)
    throw createError({ statusCode: 401, statusMessage: 'Apple authentication failed' })
  }

  try {
    const { id, tokenV1 } = await upsertAppleUser(
      claims.sub,
      emailFromClient,
      fullNameFromClient,
      claims.email ?? null,
    )
    setAuthCookies(event, id, tokenV1)
    return { success: true, user_id: id }
  }
  catch (error: any) {
    if (error?.statusCode) {
      throw error
    }
    console.error('[auth.apple]', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to provision Apple user' })
  }
})
