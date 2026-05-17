import { desc, eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { machines } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// List machines that have submitted activity for the current user. The
// `source` column tags how the machine was registered: 'editor' (VSCode
// plugin host, eventually upserted from event_logs), 'agent' (CLI), or
// 'both' once we see overlapping activity from the same hostname.

defineRouteMeta({
  openAPI: {
    tags: ['machines'],
    summary: 'List machines belonging to the authenticated user',
    responses: {
      200: {
        description: 'Machine list',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                machines: {
                  type: 'array',
                  items: { type: 'object' },
                },
              },
            },
          },
        },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const user = await tryUser(event)
  if (!user) {
    return sendPyError(event, 401, 'Not authenticated')
  }
  const db = useDb()
  const rows = await db
    .select()
    .from(machines)
    .where(eq(machines.userId, user.id))
    .orderBy(desc(machines.lastSeenAt))

  return {
    machines: rows.map(m => ({
      id: m.id,
      hostname: m.hostname,
      displayName: m.displayName,
      platform: m.platform,
      source: m.source,
      lastSeenAt: m.lastSeenAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  }
})
