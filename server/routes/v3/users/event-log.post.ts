import { defineEventHandler, readBody, send, setHeader, setResponseStatus } from 'h3'
import { eventLogs } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors POST /v3/users/event-log. Inserts a single editor event for
// the authenticated user. Python normalises language "tex" → "latex" —
// we do the same to keep downstream stats consistent across backends.

type EventLogBody = {
  eventTime?: number
  language?: string
  project?: string
  relativeFile?: string
  editor?: string
  platform?: string
  absoluteFile?: string | null
  gitOrigin?: string | null
  gitBranch?: string | null
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
            required: ['eventTime', 'language', 'project', 'relativeFile', 'editor', 'platform'],
            properties: {
              eventTime: { type: 'integer' },
              language: { type: 'string' },
              project: { type: 'string' },
              relativeFile: { type: 'string' },
              editor: { type: 'string' },
              platform: { type: 'string' },
              absoluteFile: { type: 'string', nullable: true },
              gitOrigin: { type: 'string', nullable: true },
              gitBranch: { type: 'string', nullable: true },
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
  // Empty strings are valid — editors may legitimately upload
  // relative_file="" for new buffers; only null/undefined is "missing".
  const required = ['eventTime', 'language', 'project', 'relativeFile', 'editor', 'platform'] as const
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) {
      return sendPyError(event, 400, `${key} is required`)
    }
  }

  const language = String(data.language).toLowerCase() === 'tex' ? 'latex' : String(data.language)
  const editor = String(data.editor).trim()

  const db = useDb()
  try {
    await db.insert(eventLogs).values({
      uid: session.id,
      eventTime: Number(data.eventTime),
      language,
      project: String(data.project),
      relativeFile: String(data.relativeFile),
      editor,
      platform: String(data.platform),
      absoluteFile: data.absoluteFile ?? null,
      gitOrigin: data.gitOrigin ?? null,
      gitBranch: data.gitBranch ?? null,
      createdAt: new Date(),
    } as any)
    // Python's handler returns None which Litestar serialises as the
    // JSON literal "null" with Content-Type application/json. h3
    // collapses returned null/undefined to an empty body, so emit the
    // bytes explicitly to keep wire output byte-equivalent.
    setResponseStatus(event, 201)
    setHeader(event, 'Content-Type', 'application/json')
    return send(event, 'null')
  }
  catch (error) {
    return sendPyError(event, 500, `Failed to log event: ${(error as Error).message}`)
  }
})
