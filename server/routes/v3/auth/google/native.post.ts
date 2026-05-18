import process from 'node:process'
import { createError, defineEventHandler, readBody } from 'h3'
import { exchangeGoogleCode, upsertGoogleUser, verifyGoogleIdToken } from '../../../../utils/oauth'

// JSON sign-in endpoint for the iOS App's Google OAuth flow.
//
// Unlike GitHub, Google iOS-type OAuth clients are happy to redirect
// straight to a custom URL scheme, so the App handles the /authorize
// leg locally and only delegates the code-for-token exchange to us —
// which we have to do server-side because Google's /token endpoint
// requires the request to come from a trusted origin (even though
// iOS clients are technically "public", PKCE+server-side exchange
// keeps the token off the device's network logs).
//
// Body shape:
//   { code: string, code_verifier: string, redirect_uri: string,
//     client_id?: string }
// `client_id` is optional; if omitted we use GOOGLE_IOS_CLIENT_ID.
//
// Response:
//   200 { token: string, user_id: number }
//   4xx { error: string }

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Native Google sign-in (PKCE code exchange)',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['code', 'code_verifier', 'redirect_uri'],
            properties: {
              code: { type: 'string' },
              code_verifier: { type: 'string' },
              redirect_uri: { type: 'string' },
              client_id: { type: 'string' },
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
      401: { description: 'Google token verification failed' },
    },
  },
})

type Body = {
  code?: unknown
  code_verifier?: unknown
  redirect_uri?: unknown
  client_id?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event).catch(() => ({} as Body))

  const code = typeof body.code === 'string' ? body.code : null
  const codeVerifier = typeof body.code_verifier === 'string' ? body.code_verifier : null
  const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri : null
  const requestedClientId = typeof body.client_id === 'string' ? body.client_id : null

  if (!code || !codeVerifier || !redirectUri) {
    throw createError({ statusCode: 400, statusMessage: 'code, code_verifier and redirect_uri are required' })
  }

  // The iOS client ID is distinct from the web one. We trust the env value
  // and refuse to use whatever client_id the request claims unless it
  // matches — otherwise an attacker could swap in their own client.
  const configuredIosClientId = process.env.GOOGLE_IOS_CLIENT_ID
  if (!configuredIosClientId) {
    console.error('[auth.google.native] GOOGLE_IOS_CLIENT_ID is not configured')
    throw createError({ statusCode: 500, statusMessage: 'Google iOS OAuth client is not configured' })
  }
  if (requestedClientId && requestedClientId !== configuredIosClientId) {
    throw createError({ statusCode: 400, statusMessage: 'Unexpected client_id' })
  }

  try {
    const { idToken } = await exchangeGoogleCode(code, codeVerifier, redirectUri, configuredIosClientId)
    const claims = await verifyGoogleIdToken(idToken, configuredIosClientId)
    if (!claims.sub) {
      throw createError({ statusCode: 401, statusMessage: 'Google user ID not found' })
    }
    const { id, tokenV1 } = await upsertGoogleUser(claims)
    return { token: tokenV1, user_id: id }
  }
  catch (error: any) {
    if (error?.statusCode) {
 throw error
}
    console.error('[auth.google.native]', error)
    throw createError({ statusCode: 401, statusMessage: 'Google authentication failed' })
  }
})
