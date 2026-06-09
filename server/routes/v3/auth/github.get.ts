import { defineEventHandler, deleteCookie, getCookie, getHeader, getQuery, getRequestURL, sendRedirect } from 'h3'
import { tryUser } from '../../../utils/auth'
import { setAuthCookies } from '../../../utils/auth-cookie'
import { exchangeGithubCode, fetchGithubUser, frontendUrl, GITHUB_LINK_COOKIE, GITHUB_RETURN_COOKIE, GITHUB_STATE_COOKIE, linkProviderIdentity, safeReturnPath, setGithubLogin, upsertGithubUser } from '../../../utils/oauth'

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
  const q = getQuery(event)
  const code = q.code
  const fe = frontendUrl()
  if (!safeCode(code)) {
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Invalid authorization code')}`, 302)
  }

  // OAuth Login-CSRF defence: every legitimate flow originated at
  // /v3/auth/github/start, which set an HttpOnly `gh_oauth_state`
  // cookie. The `state` parameter we got back from GitHub must match.
  // Delete the cookie either way so a single state can't be reused.
  const stateFromQuery = typeof q.state === 'string' ? q.state : ''
  const stateFromCookie = getCookie(event, GITHUB_STATE_COOKIE) || ''
  deleteCookie(event, GITHUB_STATE_COOKIE, { path: '/' })
  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Invalid OAuth state')}`, 302)
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

  // Link-intent cookie, planted by /v3/auth/github/start?link=1 when the
  // user clicked "Connect GitHub" from a signed-in settings page. We
  // always delete it (single-use), then branch on whether (a) it was
  // present and (b) the session still resolves.
  const linkIntent = getCookie(event, GITHUB_LINK_COOKIE) === '1'
  deleteCookie(event, GITHUB_LINK_COOKIE, { path: '/' })
  const linkSession = linkIntent ? await tryUser(event) : null

  // Post-login destination planted by /start?return_to=…. Single-use:
  // delete it now and re-validate before trusting it (defence in depth
  // against a tampered cookie). Only used on the sign-in path below;
  // link mode always returns to the settings page.
  const returnTo = safeReturnPath(getCookie(event, GITHUB_RETURN_COOKIE))
  deleteCookie(event, GITHUB_RETURN_COOKIE, { path: '/' })

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

    if (linkSession) {
      // Link mode — attach the GitHub identity to the current user
      // instead of provisioning a new row. Settings page reloads and
      // refetches /v3/users/self to surface the new connection state.
      const outcome = await linkProviderIdentity(linkSession.id, 'githubId', ghUser.id)
      const settingsUrl = `${fe}/dashboard/settings`
      // Mirror upsertGithubUser: persist the GitHub username alongside the
      // numeric id so the public profile can render a github.com link.
      if (outcome === 'linked' || outcome === 'already-yours') {
        await setGithubLogin(linkSession.id, ghUser.login)
      }
      switch (outcome) {
        case 'linked':
        case 'already-yours': {
          return sendRedirect(event, `${settingsUrl}?link=github&result=ok`, 302)
        }
        case 'taken-by-self': {
          return sendRedirect(event, `${settingsUrl}?link=github&result=replace`, 302)
        }
        case 'conflict': {
          return sendRedirect(event, `${settingsUrl}?link=github&result=conflict`, 302)
        }
      }
    }

    const { id, tokenV1 } = await upsertGithubUser(ghUser)
    setAuthCookies(event, id, tokenV1)
    return sendRedirect(event, `${fe}${returnTo ?? ''}`, 302)
  }
  catch (error) {
    console.error('[auth.github]', error)
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('Authentication failed. Please try again.')}`, 302)
  }
})
