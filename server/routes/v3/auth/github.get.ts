import { defineEventHandler, getHeader, getQuery, getRequestURL, sendRedirect } from 'h3'
import { setAuthCookies } from '../../../utils/auth-cookie'
import { exchangeGithubCode, fetchGithubUser, frontendUrl, upsertGithubUser } from '../../../utils/oauth'

// Mirrors GET /v3/auth/github. Receives ?code= from the OAuth provider,
// exchanges it for an access token, fetches the GitHub profile,
// upserts the user row, sets the shared auth cookie pair, and
// redirects to the frontend.

// In-memory record of authorization codes we've already started exchanging.
// GitHub codes are single-use — if anything (browser bfcache replay,
// Cloudflare Speculation Rules prefetch, link-scanning extensions, a
// duplicate tab) hits the callback URL a second time after the real
// navigation, GitHub returns `bad_verification_code` and the legitimate
// user sees /auth/error. Real-world traces show this fires when the
// callback request carries `Referer: https://codetime.dev/` instead of
// `https://github.com/` — i.e. NOT a top-level redirect from GitHub.
// Reject those early so the genuine OAuth navigation (referer github.com,
// no Sec-Fetch-Site: same-origin) keeps the code intact.
const recentCodes = new Map<string, number>()
const CODE_TTL_MS = 10 * 60 * 1000

function rememberCode(code: string) {
  const now = Date.now()
  for (const [k, t] of recentCodes) {
    if (now - t > CODE_TTL_MS) {
 recentCodes.delete(k)
}
  }
  recentCodes.set(code, now)
}

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
  // Defensive guards against duplicate hits that would burn the code:
  //   1. Sec-Purpose / Purpose: prefetch — speculation/prefetch agents.
  //   2. Same code seen in the last 10 minutes — bfcache replays, duplicate
  //      tab navigation, etc. GitHub codes are single-use, so any retry
  //      after a successful (or in-flight) exchange must be short-circuited
  //      rather than letting GitHub return `bad_verification_code`.
  //
  // NOTE: do NOT gate on `Referer`. Real OAuth callbacks arrive with
  // `Referer: https://codetime.dev/` (the page that initiated the OAuth)
  // rather than github.com — modern Referrer-Policy keeps the initiator,
  // not the intermediate 302 issuer. Likewise `Sec-Fetch-Site` is unreliable
  // across the redirect chain.
  const purpose = (getHeader(event, 'sec-purpose') || getHeader(event, 'purpose') || '').toLowerCase()
  if (purpose.includes('prefetch')) {
    return sendRedirect(event, fe, 204 as any)
  }
  if (recentCodes.has(code)) {
    return sendRedirect(event, fe, 302)
  }
  rememberCode(code)
  try {
    // Mirror the redirect_uri the browser used at /authorize. The OAuth
    // app has multiple callbacks registered (codetime.dev + api.codetime.dev),
    // so omitting it makes GitHub reject the code as bad_verification_code.
    //
    // CRITICAL: derive the origin from `frontendUrl()` (https in prod),
    // NOT from `getRequestURL(event)`. Nginx terminates TLS and proxies
    // plain HTTP to Nuxt without setting `X-Forwarded-Proto`, so h3's
    // request URL ends up as `http://codetime.dev/...`. GitHub does a
    // byte-for-byte compare of redirect_uri between /authorize and
    // /access_token — `http://` vs `https://` is a mismatch and the
    // code is rejected as bad_verification_code.
    const reqUrl = getRequestURL(event)
    const redirectUri = `${frontendUrl()}${reqUrl.pathname}`
    const { accessToken } = await exchangeGithubCode(code, redirectUri)
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
