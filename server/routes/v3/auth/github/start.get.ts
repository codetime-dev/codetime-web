import { randomBytes } from 'node:crypto'
import process from 'node:process'
import { defineEventHandler, getQuery, sendRedirect, setCookie } from 'h3'
import { isProduction } from '../../../../utils/env'
import { frontendUrl, GITHUB_LINK_COOKIE, GITHUB_RETURN_COOKIE, GITHUB_STATE_COOKIE, GITHUB_STATE_TTL_SECONDS, safeReturnPath } from '../../../../utils/oauth'

// Server-initiated GitHub OAuth handshake. The browser hits this route
// instead of building the /authorize URL client-side; we mint a random
// `state`, pin it into an HttpOnly cookie, then redirect to GitHub with
// the same value in the query string. The callback at /v3/auth/github
// rejects any code whose `state` doesn't match the cookie, defeating the
// OAuth Login-CSRF where an attacker pre-fetches a code and tricks a
// victim into hitting the callback to silently bind their browser to
// the attacker's GitHub identity.
//
// `?link=1` puts the same handshake in *link mode*: we set an additional
// `gh_link_intent` cookie that the callback notices. When that cookie is
// present and `tryUser(event)` returns an existing session, the callback
// attaches the GitHub identity to the current user instead of upserting
// a fresh row. The state cookie still gates the flow either way.

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Begin GitHub OAuth (sets state cookie, redirects)',
    parameters: [
      {
        name: 'link',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['1'] },
        description: 'When `1`, the callback will link the GitHub identity to the currently signed-in user instead of provisioning a new account.',
      },
    ],
    responses: {
      302: { description: 'Redirect to GitHub /authorize' },
    },
  },
})

export default defineEventHandler((event) => {
  const fe = frontendUrl()
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return sendRedirect(event, `${fe}/auth/error?message=${encodeURIComponent('GitHub OAuth is not configured')}`, 302)
  }

  const state = randomBytes(24).toString('hex')
  const isProd = isProduction()
  // SameSite=Lax is required: the cookie must be sent back when GitHub
  // does the top-level redirect to our callback. Strict would drop it.
  setCookie(event, GITHUB_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: GITHUB_STATE_TTL_SECONDS,
    path: '/',
  })

  // Optional link-mode marker. Same TTL as the state cookie so the two
  // expire together; callback unconditionally deletes it.
  if (getQuery(event).link === '1') {
    setCookie(event, GITHUB_LINK_COOKIE, '1', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: GITHUB_STATE_TTL_SECONDS,
      path: '/',
    })
  }

  // Optional post-login destination (e.g. /cli/auth?port=&state=). Pinned
  // into an HttpOnly cookie so the callback can return the freshly
  // authenticated user there. Validated to a root-relative path to avoid
  // an open redirect; ignored otherwise.
  const returnTo = safeReturnPath(getQuery(event).return_to)
  if (returnTo) {
    setCookie(event, GITHUB_RETURN_COOKIE, returnTo, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: GITHUB_STATE_TTL_SECONDS,
      path: '/',
    })
  }

  // redirect_uri must match byte-for-byte with the value the callback
  // sends to /access_token (see github.get.ts).
  const redirectUri = `${fe}/v3/auth/github`
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'user:email',
    state,
    redirect_uri: redirectUri,
  })
  return sendRedirect(event, `https://github.com/login/oauth/authorize?${params.toString()}`, 302)
})
