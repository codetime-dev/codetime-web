import { and, asc, eq, sql } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { tags, workspaceMetaV2, workspaceMinutesV2 } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors GET /v3/icalendar/info. Lists the available filter values the
// caller can pass to /icalendar/feed.ics — drawn from the user's own
// minute/meta rows so the UI only shows real options.

defineRouteMeta({
  openAPI: {
    tags: ['calendar', 'info'],
    summary: 'Available iCalendar feed options',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'Feed options + docs',
        content: { 'application/json': { schema: { type: 'object' } } },
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

  const db = useDb()
  const [languages, workspaces, editors, platforms, userTags] = await Promise.all([
    db.selectDistinct({ value: workspaceMinutesV2.language })
      .from(workspaceMinutesV2)
      .where(eq(workspaceMinutesV2.uid, session.id))
      .orderBy(asc(workspaceMinutesV2.language)),
    db.selectDistinct({ value: workspaceMetaV2.workspaceName })
      .from(workspaceMetaV2)
      .innerJoin(workspaceMinutesV2, and(
        eq(workspaceMinutesV2.uid, workspaceMetaV2.uid),
        eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
      ))
      .where(eq(workspaceMetaV2.uid, session.id))
      .orderBy(asc(workspaceMetaV2.workspaceName)),
    db.selectDistinct({ value: workspaceMetaV2.editor })
      .from(workspaceMetaV2)
      .innerJoin(workspaceMinutesV2, and(
        eq(workspaceMinutesV2.uid, workspaceMetaV2.uid),
        eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
      ))
      .where(eq(workspaceMetaV2.uid, session.id))
      .orderBy(asc(workspaceMetaV2.editor)),
    db.selectDistinct({ value: workspaceMetaV2.platform })
      .from(workspaceMetaV2)
      .innerJoin(workspaceMinutesV2, and(
        eq(workspaceMinutesV2.uid, workspaceMetaV2.uid),
        eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
      ))
      .where(eq(workspaceMetaV2.uid, session.id))
      .orderBy(asc(workspaceMetaV2.platform)),
    // Python's services/tags.py::get_user_tags orders by created_at asc;
    // mirror that so the `tags` list arrives in the same order.
    db.select({ name: tags.name }).from(tags).where(eq(tags.uid, session.id)).orderBy(asc(tags.createdAt)),
  ])

  // Wire keys are camelCase across the entire response — including the
  // `parameters` / `examples` doc blocks — to match the Python contract
  // updated in controllers/icalendar.py. Query-parameter *values* in the
  // example URLs stay snake_case because that is what the feed handler
  // reads off the URL.
  return {
    // Python returns every distinct value verbatim (including the empty
    // string that appears for legacy minute rows without a language) so
    // we don't filter falsy values here — that keeps the wire payload
    // byte-equivalent to controllers/icalendar.py.
    availableOptions: {
      languages: languages.map(r => r.value),
      workspaces: workspaces.map(r => r.value),
      editors: editors.map(r => r.value),
      platforms: platforms.map(r => r.value),
      tags: userTags.map(r => r.name),
    },
    feedUrl: '/v3/icalendar/feed.ics',
    parameters: {
      target: 'string - field to group by (language, workspace, editor, platform)',
      startDate: 'YYYY-MM-DD format',
      endDate: 'YYYY-MM-DD format',
      languages: 'comma-separated list',
      workspaces: 'comma-separated list',
      editors: 'comma-separated list',
      platforms: 'comma-separated list',
      tags: 'comma-separated list',
      calendarName: 'string (default: \'Coding Time\')',
      eventTitleTemplate: 'string (default: \'Coding Session\')',
      minimumDurationMinutes: 'integer >= 1 (default: 5)',
      timezone: 'timezone string (default: \'UTC\')',
    },
    examples: {
      languageCalendar: '/v3/icalendar/feed.ics?target=language',
      workspaceCalendar: '/v3/icalendar/feed.ics?target=workspace',
      pythonOnly: '/v3/icalendar/feed.ics?target=language&languages=Python',
      specificWorkspace: '/v3/icalendar/feed.ics?target=workspace&workspaces=my-project',
      dateRange: '/v3/icalendar/feed.ics?target=language&start_date=2024-01-01&end_date=2024-01-31',
      editorCalendar: '/v3/icalendar/feed.ics?target=editor',
    },
  }
})

// Silence unused import lint for sql — kept for future extension.
void sql
