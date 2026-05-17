import type { IngestRequestBody, IngestResponseBody, SessionRollup } from '../../../utils/agent-types'
import { defineEventHandler, readBody } from 'h3'
import { resolveAgentMachine } from '../../../utils/agent-machine'
import { ingestRollups } from '../../../utils/agent-write'
import { tryUser } from '../../../utils/auth'
import { sendPyError } from '../../../utils/py-error'

// Ingest a batch of agent session rollups. Authenticated with the
// user's standard upload_token (same one VSCode uses). The CLI also
// sends `X-Machine-Id` so the server knows which host the rollups came
// from; the machines row is upserted on first sight.
//
// The CLI computes rollups locally and ships them here; the server does
// not persist raw events. Re-submitting the same payload is a no-op;
// divergent payloads conflict unless `replace=true`.

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'Submit agent session rollups',
    parameters: [
      {
        name: 'X-Machine-Id',
        in: 'header',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Stable per-host UUID. The CLI generates this on first run.',
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['rollups'],
            properties: {
              rollups: {
                type: 'array',
                items: { type: 'object' },
              },
              replace: { type: 'boolean', default: false },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Ingest result',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['inserted', 'skipped', 'conflicts', 'conflictIds'],
              properties: {
                inserted: { type: 'integer' },
                skipped: { type: 'integer' },
                conflicts: { type: 'integer' },
                conflictIds: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

const MAX_BATCH = 200

function isRollupShape(value: unknown): value is SessionRollup {
  if (!value || typeof value !== 'object') {
    return false
  }
  const r = value as Record<string, unknown>
  return typeof r.rollupKey === 'string'
    && typeof r.payloadHash === 'string'
    && typeof r.source === 'string'
    && typeof r.sessionId === 'string'
    && typeof r.startedAt === 'string'
    && typeof r.lastEventAt === 'string'
    && Array.isArray(r.timeBuckets)
    && Array.isArray(r.modelRollups)
    && Array.isArray(r.toolRollups)
    && Array.isArray(r.fileRollups)
}

export default defineEventHandler(async (event): Promise<IngestResponseBody | ReturnType<typeof sendPyError>> => {
  const user = await tryUser(event)
  if (!user) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const machine = await resolveAgentMachine(event, user.id)
  if (!machine.ok) {
    return sendPyError(event, machine.status, machine.detail)
  }

  let body: IngestRequestBody
  try {
    body = (await readBody(event)) as IngestRequestBody
  }
  catch {
    return sendPyError(event, 400, 'Invalid JSON body')
  }

  if (!body || !Array.isArray(body.rollups)) {
    return sendPyError(event, 400, 'rollups must be an array')
  }
  if (body.rollups.length > MAX_BATCH) {
    return sendPyError(event, 400, `Batch too large; max ${MAX_BATCH} rollups per request`)
  }
  for (const [i, r] of body.rollups.entries()) {
    if (!isRollupShape(r)) {
      return sendPyError(event, 400, `rollups[${i}] is malformed`)
    }
  }

  const result = await ingestRollups(body.rollups, {
    userId: user.id,
    machineId: machine.machineId,
  }, { replace: body.replace === true })

  return result
})
