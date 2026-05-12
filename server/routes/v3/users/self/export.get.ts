import { desc, eq } from 'drizzle-orm'
import { defineEventHandler, setHeader } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/self/export. Streams a CSV of every recorded
// minute joined with its meta row. Python streams via SQLAlchemy
// partitions; here we yield drizzle rows through a ReadableStream so
// memory stays bounded for large accounts.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Stream a CSV export of all coding-minute records',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'CSV stream',
        content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

function csvField(v: unknown): string {
  if (v === null || v === undefined) {
 return ''
}
  const s = v instanceof Date ? v.toISOString() : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const stamp = new Date().toISOString().replaceAll(/[-:]/g, '').replace(/\..*/, '').replace('T', '_')
  setHeader(event, 'Content-Disposition', `attachment; filename="codetime_export_${session.id}_${stamp}.csv"`)
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')

  const db = useDb()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode('Language,Workspace,Absolute File,Relative File,Editor,Platform,Git Origin,Git Branch,Recorded At\n'))
      const rows = await db
        .select({
          language: workspaceMetaV2.language,
          workspace_name: workspaceMetaV2.workspaceName,
          absolute_file: workspaceMetaV2.absoluteFile,
          relative_file: workspaceMetaV2.relativeFile,
          editor: workspaceMetaV2.editor,
          platform: workspaceMetaV2.platform,
          git_origin: workspaceMetaV2.gitOrigin,
          git_branch: workspaceMetaV2.gitBranch,
          recorded_at: workspaceMinutesV2.recordedAt,
        })
        .from(workspaceMetaV2)
        .innerJoin(workspaceMinutesV2, eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64))
        .where(eq(workspaceMinutesV2.uid, session.id))
        .orderBy(desc(workspaceMinutesV2.recordedAt))
      for (const r of rows) {
        const line = `${[
          r.language,
r.workspace_name,
r.absolute_file,
r.relative_file,
          r.editor,
r.platform,
r.git_origin,
r.git_branch,
r.recorded_at,
        ].map(csvField).join(',')}\n`
        controller.enqueue(encoder.encode(line))
      }
      controller.close()
    },
  })

  return stream
})
