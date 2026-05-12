// Free-plan time-range guard. Mirrors the inline check in
// codetime-server-v3/src/controllers/users.py — UserController.
// validate_free_plan_time_range — free users may not query windows older
// than 90 days.

import type { H3Event } from 'h3'
import { sendPyError } from './py-error'

const FREE_PLAN_DAYS = 90
const FREE_PLAN_MS = FREE_PLAN_DAYS * 86_400_000

export function denyIfOutsideFreeWindow(
  event: H3Event,
  plan: string | null,
  startTime: Date | null,
  endTime: Date | null,
): ReturnType<typeof sendPyError> | null {
  if ((plan ?? 'free') === 'pro') {
 return null
}
  const now = Date.now()
  if (startTime && now - startTime.getTime() > FREE_PLAN_MS) {
    return sendPyError(event, 403, 'Free plan can only fetch logs for 90 days')
  }
  if (endTime && now - endTime.getTime() > FREE_PLAN_MS) {
    return sendPyError(event, 403, 'Free plan can only fetch logs for 90 days')
  }
  return null
}
