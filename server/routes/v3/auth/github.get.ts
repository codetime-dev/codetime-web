import { defineEventHandler, getQuery, sendRedirect } from 'h3'
import { setAuthCookies } from '../../../utils/auth-cookie'
import { exchangeGithubCode, fetchGithubUser, frontendUrl, upsertGithubUser } from '../../../utils/oauth'

// Mirrors GET /v3/auth/github. Receives ?code= from the OAuth provider,
// exchanges it for an access token, fetches the GitHub profile,
// upserts the user row, sets the shared auth cookie pair, and
// redirects to the frontend.

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'GitHub OAuth callback',
    parameters: [
      { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
    ],
    responses: {
      302: { description: 'Redirect to frontend' },
    },
  },
})

function safeCode(code: unknown): code is string {
  return typeof code === 'string' && /^[\w-]{8,}$/.test(code)
}

export default defineEventHandler(async (event) => {
  const code = getQuery(event).code
  const fe = frontendUrl()
  if (!safeCode(code)) {
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Invalid authorization code')}`, 302)
  }
  try {
    const { accessToken } = await exchangeGithubCode(code)
    const ghUser = await fetchGithubUser(accessToken)
    if (!ghUser.id) {
      return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('GitHub user ID not found')}`, 302)
    }
    const { id, tokenV1 } = await upsertGithubUser(ghUser)
    setAuthCookies(event, id, tokenV1)
    return sendRedirect(event, fe, 302)
  }
  catch (error) {
    console.error('[auth.github]', error)
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Authentication failed. Please try again.')}`, 302)
  }
})
