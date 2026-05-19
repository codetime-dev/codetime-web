import process from 'node:process'
import { createError, defineEventHandler, readBody } from 'h3'
import { sha256Hex, upsertAppleUser, verifyAppleIdentityToken } from '../../../../utils/oauth'

// JSON sign-in endpoint for the iOS App's Sign in with Apple flow.
//
// Unlike Google, Apple doesn't require us to do a code-for-token swap on
// the server: the iOS client already holds a signed identity token (a
// JWT signed by Apple). We just verify it and turn it into a Codetime
// session token.
//
// Body shape:
//   { identity_token: string,         // JWT from ASAuthorizationAppleIDCredential
//     authorization_code?: string,    // ignored unless we ever need refresh tokens
//     nonce: string,                  // raw nonce; sha256(hex) must equal JWT.nonce
//     email?: string,                 // first-login only, per Apple
//     full_name?: string }            // first-login only, per Apple
//
// Response:
//   200 { token: string, user_id: number }
//   4xx { error: string }

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Native Sign in with Apple (identity token verification)',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['identity_token', 'nonce'],
            properties: {
              identity_token: { type: 'string' },
              authorization_code: { type: 'string' },
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
        description: 'Session token issued',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'user_id'],
              properties: {
                token: { type: 'string' },
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
  authorization_code?: unknown
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

  // Bundle ID of the iOS app. Distinct from the web Services ID; the
  // backend accepts either as long as it's configured. Audiences are
  // compared exactly, so a misconfiguration here would silently let the
  // wrong app trade Apple tokens for Codetime sessions — fail closed.
  const iosBundleId = process.env.APPLE_IOS_BUNDLE_ID
  if (!iosBundleId) {
    console.error('[auth.apple.native] APPLE_IOS_BUNDLE_ID is not configured')
    throw createError({ statusCode: 500, statusMessage: 'Apple Sign In is not configured' })
  }

  // iOS-native flow: Apple's `ASAuthorizationAppleIDRequest.nonce` is
  // expected to be the SHA-256 hex digest of the raw nonce, and that's
  // what lands in the JWT's `nonce` claim. The web SDK works differently
  // (raw nonce verbatim) — see `auth/apple.post.ts`.
  const expectedNonceClaim = sha256Hex(rawNonce)

  let claims: Awaited<ReturnType<typeof verifyAppleIdentityToken>> | null = null
  try {
    claims = await verifyAppleIdentityToken(identityToken, iosBundleId, expectedNonceClaim)
  }
  catch (error) {
    console.error('[auth.apple.native]', (error as Error).message)
  }
  if (!claims) {
    throw createError({ statusCode: 401, statusMessage: 'Apple authentication failed' })
  }

  try {
    const { id, uploadToken } = await upsertAppleUser(
      claims.sub,
      emailFromClient,
      fullNameFromClient,
      claims.email ?? null,
    )
    return { token: uploadToken, user_id: id }
  }
  catch (error: any) {
    if (error?.statusCode) {
      throw error
    }
    console.error('[auth.apple.native]', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to provision Apple user' })
  }
})
