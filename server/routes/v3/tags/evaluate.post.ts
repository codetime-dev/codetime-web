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
            required: ['workspaceName', 'language', 'platform', 'editor', 'relativeFile'],
            properties: {
              workspaceName: { type: 'string' },
              language: { type: 'string' },
              gitOrigin: { type: 'string', nullable: true },
              gitBranch: { type: 'string', nullable: true },
              platform: { type: 'string' },
              editor: { type: 'string' },
              absoluteFile: { type: 'string', nullable: true },
              relativeFile: { type: 'string' },
            },
          },
          WorkspaceEvaluationResponse: {
            type: 'object',
            required: ['matchingTags'],
            properties: {
              matchingTags: {
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

  // SDK posts camelCase keys (matching Python's pydantic
  // alias_generator=to_camel). tag-rules' FIELD_ALIAS normalises
  // condition.field but reads ws[snake_case], so we translate the
  // incoming body into the snake_case-keyed WorkspaceData shape here.
  const body = await readBody<Record<string, unknown>>(event).catch(() => null)
  if (!body) {
    return sendPyError(event, 400, 'Invalid body')
  }
  const ws: WorkspaceData = {
    workspace_name: (body.workspaceName ?? body.workspace_name) as string | null | undefined ?? null,
    language: (body.language ?? null) as string | null,
    git_origin: (body.gitOrigin ?? body.git_origin) as string | null | undefined ?? null,
    git_branch: (body.gitBranch ?? body.git_branch) as string | null | undefined ?? null,
    platform: (body.platform ?? null) as string | null,
    editor: (body.editor ?? null) as string | null,
    absolute_file: (body.absoluteFile ?? body.absolute_file) as string | null | undefined ?? null,
    relative_file: (body.relativeFile ?? body.relative_file) as string | null | undefined ?? null,
  }

  const db = useDb()
  const rows = await db
    .select()
    .from(tags)
    .where(and(eq(tags.uid, session.id), isNotNull(tags.rulesJson)))

  const matching = rows.filter(r => r.rulesJson && evaluateRule(r.rulesJson, ws))
  return { matchingTags: matching.map(toTagResponse) }
})
