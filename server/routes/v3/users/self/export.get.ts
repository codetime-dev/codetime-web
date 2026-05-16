import type { SQL } from 'drizzle-orm'
import { and, desc, eq, lt, or } from 'drizzle-orm'
import { defineEventHandler, setHeader } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/self/export. Streams a CSV of every recorded
// minute joined with its meta row, keyset-paginated on
// (recorded_at desc, meta_xxh3_64 desc) to keep memory bounded.

const CHUNK = 5000
const HEADER = 'Language,Workspace,Absolute File,Relative File,Editor,Platform,Git Origin,Git Branch,Recorded At\n'

type Row = {
  language: string | null
  workspace_name: string | null
  absolute_file: string | null
  relative_file: string | null
  editor: string | null
  platform: string | null
  git_origin: string | null
  git_branch: string | null
  recorded_at: Date
  meta_xxh3_64: number
}

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

function rowToCsv(r: Row): string {
  return `${[
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
}

function fetchChunk(uid: number, cursorAt: Date | null, cursorXxh: number | null): Promise<Row[]> {
  const cursorClause: SQL | undefined = cursorAt !== null && cursorXxh !== null
    ? or(
        lt(workspaceMinutesV2.recordedAt, cursorAt),
        and(eq(workspaceMinutesV2.recordedAt, cursorAt), lt(workspaceMinutesV2.metaXxh3_64, cursorXxh)),
      )
    : undefined
  return useDb()
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
      meta_xxh3_64: workspaceMinutesV2.metaXxh3_64,
    })
    .from(workspaceMetaV2)
    .innerJoin(
      workspaceMinutesV2,
      and(
        eq(workspaceMinutesV2.uid, workspaceMetaV2.uid),
        eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
      ),
    )
    .where(and(eq(workspaceMinutesV2.uid, uid), cursorClause))
    .orderBy(desc(workspaceMinutesV2.recordedAt), desc(workspaceMinutesV2.metaXxh3_64))
    .limit(CHUNK)
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const stamp = new Date().toISOString().replaceAll(/[-:]/g, '').replace(/\..*/, '').replace('T', '_')
  setHeader(event, 'Content-Disposition', `attachment; filename="codetime_export_${session.id}_${stamp}.csv"`)
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')

  const uid = session.id
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(HEADER))

      let cursorAt: Date | null = null
      let cursorXxh: number | null = null
      while (true) {
        const rows = await fetchChunk(uid, cursorAt, cursorXxh)
        if (rows.length === 0) {
          break
        }
        controller.enqueue(encoder.encode(rows.map(rowToCsv).join('')))
        const last = rows.at(-1)!
        cursorAt = last.recorded_at
        cursorXxh = last.meta_xxh3_64
        if (rows.length < CHUNK) {
          break
        }
      }
      controller.close()
    },
  })

  return stream
})
