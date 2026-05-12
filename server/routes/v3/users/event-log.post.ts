import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { eventLogs } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors POST /v3/users/event-log. Inserts a single editor event for
// the authenticated user. Python normalises language "tex" → "latex" —
// we do the same to keep downstream stats consistent across backends.

type EventLogBody = {
  event_time?: number
  language?: string
  project?: string
  relative_file?: string
  editor?: string
  platform?: string
  absolute_file?: string | null
  git_origin?: string | null
  git_branch?: string | null
}

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Submit a single editor event',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/EventLogRequest' } } },
    },
    responses: {
      201: { description: 'Logged' },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          EventLogRequest: {
            type: 'object',
            required: ['event_time', 'language', 'project', 'relative_file', 'editor', 'platform'],
            properties: {
              event_time: { type: 'integer' },
              language: { type: 'string' },
              project: { type: 'string' },
              relative_file: { type: 'string' },
              editor: { type: 'string' },
              platform: { type: 'string' },
              absolute_file: { type: 'string', nullable: true },
              git_origin: { type: 'string', nullable: true },
              git_branch: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const data = await readBody<EventLogBody>(event).catch(() => null)
  if (!data) {
 return sendPyError(event, 400, 'Invalid body')
}
  const required = ['event_time', 'language', 'project', 'relative_file', 'editor', 'platform'] as const
  for (const key of required) {
    if (data[key] === undefined || data[key] === null || data[key] === '') {
      return sendPyError(event, 400, `${key} is required`)
    }
  }

  const language = String(data.language).toLowerCase() === 'tex' ? 'latex' : String(data.language)
  const editor = String(data.editor).trim()

  const db = useDb()
  try {
    await db.insert(eventLogs).values({
      uid: session.id,
      eventTime: Number(data.event_time),
      language,
      project: String(data.project),
      relativeFile: String(data.relative_file),
      editor,
      platform: String(data.platform),
      absoluteFile: data.absolute_file ?? null,
      gitOrigin: data.git_origin ?? null,
      gitBranch: data.git_branch ?? null,
      createdAt: new Date(),
    } as any)
    setResponseStatus(event, 201)
    return null
  }
  catch (error) {
    return sendPyError(event, 500, `Failed to log event: ${(error as Error).message}`)
  }
})
