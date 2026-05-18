import process from 'node:process'
import { defineEventHandler, getQuery, sendRedirect } from 'h3'
import { exchangeGithubCode, fetchGithubUser, frontendUrl, upsertGithubUser } from '../../../../utils/oauth'

// Server-side OAuth callback for the iOS App.
//
// GitHub OAuth Apps reject `codetime://` (or any non-http(s)) URL in the
// Authorization callback field, so the App can't have GitHub redirect to
// it directly. Instead the App sends `redirect_uri=https://codetime.dev
// /v3/auth/github/native-callback` to /authorize; GitHub posts the code
// back to us, we run the same exchange the web flow uses, and 302 back
// out to `codetime://oauth/github?token=…` with the freshly-minted
// session token. ASWebAuthenticationSession on the App side is watching
// for that scheme and hands the URL straight to AuthService.

const APP_CALLBACK_SCHEME = process.env.MOBILE_AUTH_CALLBACK_SCHEME ?? 'codetime'

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'GitHub OAuth callback for the native iOS app',
    description:
      'Server-side leg of the GitHub OAuth Authorization-Code flow for the mobile app. '
      + 'Receives ?code= from GitHub, exchanges it, and 302s back to a custom-scheme URL '
      + 'carrying the Codetime session token so the App can pick it up.',
    parameters: [
      { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
      { name: 'state', in: 'query', required: false, schema: { type: 'string' } },
    ],
    responses: {
      302: { description: 'Redirect into the App via custom URL scheme' },
    },
  },
})

function safeCode(code: unknown): code is string {
  return typeof code === 'string' && /^[\w-]{8,}$/.test(code)
}

function appErrorRedirect(message: string, state?: string): string {
  const params = new URLSearchParams({ error: message })
  if (state) {
 params.set('state', state)
}
  return `${APP_CALLBACK_SCHEME}://oauth/github?${params.toString()}`
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const code = q.code
  const state = typeof q.state === 'string' ? q.state : undefined

  if (!safeCode(code)) {
    return sendRedirect(event, appErrorRedirect('invalid_code', state), 302)
  }

  try {
    // Mirror the redirect_uri that the App put in /authorize — GitHub binds
    // the code to that exact value and rejects the exchange otherwise.
    // The App always sends this same path, so derive it from frontendUrl().
    const redirectUri = `${frontendUrl()}/v3/auth/github/native-callback`
    const { accessToken } = await exchangeGithubCode(code, redirectUri)
    const ghUser = await fetchGithubUser(accessToken)
    if (!ghUser.id) {
      return sendRedirect(event, appErrorRedirect('github_user_missing', state), 302)
    }
    const { id, tokenV1 } = await upsertGithubUser(ghUser)

    const out = new URLSearchParams({
      token: tokenV1,
      user_id: String(id),
    })
    if (state) {
 out.set('state', state)
}
    return sendRedirect(event, `${APP_CALLBACK_SCHEME}://oauth/github?${out.toString()}`, 302)
  }
  catch (error) {
    console.error('[auth.github.native-callback]', error)
    return sendRedirect(event, appErrorRedirect('exchange_failed', state), 302)
  }
})
