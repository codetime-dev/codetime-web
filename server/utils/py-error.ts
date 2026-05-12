import type { H3Event } from 'h3'
import { setResponseStatus } from 'h3'

// Litestar serialises HTTPException as { status_code, detail }. The default
// h3 createError() body adds url/statusMessage/message/stack which would
// break clients reading `.detail`. To preserve byte-equivalent error bodies
// during the migration, set the status + return the Python-shaped object
// from your handler instead of throwing.
//
//   const session = await tryUser(event)
//   if (!session) return sendPyError(event, 401, 'Not authenticated')

export type PyErrorBody = { status_code: number, detail: string }

export function sendPyError(event: H3Event, statusCode: number, detail: string): PyErrorBody {
  setResponseStatus(event, statusCode)
  return { status_code: statusCode, detail }
}
