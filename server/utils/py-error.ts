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
export type PyValidationItem = { key: string, message: string, source: 'query' | 'path' | 'body' | 'header' | 'cookie' }
export type PyValidationErrorBody = PyErrorBody & { extra: PyValidationItem[] }

export function sendPyError(event: H3Event, statusCode: number, detail: string): PyErrorBody {
  setResponseStatus(event, statusCode)
  return { status_code: statusCode, detail }
}

// Mirrors Litestar's ValidationException body shape:
//   { status_code: 400, detail: "Validation failed for <METHOD> <path>", extra: [{key, message, source}, ...] }
// Use this only for parameter-validation failures so the SDK sees the
// same envelope it gets from the Python service.
export function sendPyValidationError(
  event: H3Event,
  method: string,
  path: string,
  extra: PyValidationItem[],
): PyValidationErrorBody {
  setResponseStatus(event, 400)
  return {
    status_code: 400,
    detail: `Validation failed for ${method} ${path}`,
    extra,
  }
}
