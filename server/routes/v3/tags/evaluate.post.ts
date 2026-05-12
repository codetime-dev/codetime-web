import type { WorkspaceData } from '../../../utils/tag-rules'
import { and, eq, isNotNull } from 'drizzle-orm'
import { defineEventHandler, readBody } from 'h3'
import { tags } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { toTagResponse } from '../../../utils/tag-dto'
import { evaluateRule } from '../../../utils/tag-rules'

// Mirrors POST /v3/tags/evaluate. Receives the editor's current
// workspace metadata and returns the tags whose JSON rules match.

defineRouteMeta({
  openAPI: {
    tags: ['tags'],
    summary: 'Evaluate matching tags for a workspace context',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkspaceEvaluationRequest' } } },
    },
    responses: {
      200: {
        description: 'Matching tags',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkspaceEvaluationResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          WorkspaceEvaluationRequest: {
            type: 'object',
            required: ['workspace_name', 'language', 'platform', 'editor', 'relative_file'],
            properties: {
              workspace_name: { type: 'string' },
              language: { type: 'string' },
              git_origin: { type: 'string', nullable: true },
              git_branch: { type: 'string', nullable: true },
              platform: { type: 'string' },
              editor: { type: 'string' },
              absolute_file: { type: 'string', nullable: true },
              relative_file: { type: 'string' },
            },
          },
          WorkspaceEvaluationResponse: {
            type: 'object',
            required: ['matching_tags'],
            properties: {
              matching_tags: {
                type: 'array',
                items: { $ref: '#/components/schemas/TagResponse' },
              },
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

  const ws = await readBody<WorkspaceData>(event).catch(() => null)
  if (!ws) {
 return sendPyError(event, 400, 'Invalid body')
}

  const db = useDb()
  const rows = await db
    .select()
    .from(tags)
    .where(and(eq(tags.uid, session.id), isNotNull(tags.rulesJson)))

  const matching = rows.filter(r => r.rulesJson && evaluateRule(r.rulesJson, ws))
  return { matching_tags: matching.map(toTagResponse) }
})
