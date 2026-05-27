import { eq } from 'drizzle-orm'
import { defineEventHandler, readBody } from 'h3'
import { users } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { mergePrivacy, resolveUserPrivacy } from '../../../../utils/privacy'
import { sendPyError } from '../../../../utils/py-error'

// POST /v3/users/self/privacy — update privacy settings. Accepts either the
// full object (settings page) or a partial patch (in-context consent, e.g.
// { status: { project: 'public' } }); both deep-merge onto the current
// settings and re-validate. `leaderboardListed` is the one field stored as a
// column, not in the JSONB blob.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Update the authenticated user\'s privacy settings',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/PrivacySettings' },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated privacy settings',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PrivacySettings' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const body = await readBody<Record<string, unknown>>(event).catch(() => null)
  const current = resolveUserPrivacy(session.privacy)
  const next = mergePrivacy(current, body)
  const leaderboardListed = typeof body?.leaderboardListed === 'boolean'
    ? body.leaderboardListed
    : session.leaderboardListed

  // Mirror the identity facets into the legacy show_github / show_email
  // columns so the leaderboard + language-ranking queries (which still read
  // the columns) stay consistent with the JSONB source of truth. The
  // columns are now derived caches; drop them once those queries move to the
  // JSON facet directly.
  const db = useDb()
  const [row] = await db
    .update(users)
    .set({
      privacy: next,
      leaderboardListed,
      showGithub: next.identity.github === 'public',
      showEmail: next.identity.email === 'public',
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.id))
    .returning({ privacy: users.privacy, leaderboardListed: users.leaderboardListed })
  if (!row) {
    return sendPyError(event, 401, 'Not authenticated')
  }
  return { ...resolveUserPrivacy(row.privacy), leaderboardListed: row.leaderboardListed }
})
