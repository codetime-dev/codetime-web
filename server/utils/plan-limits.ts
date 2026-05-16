// Free-plan time-range guard: free users may only query windows that
// (a) lie within the last 90 days and (b) span at most 90 days.

import type { H3Event } from 'h3'
import { sendPyError } from './py-error'

const FREE_PLAN_DAYS = 90
const DAY_MS = 86_400_000
const FREE_PLAN_MS = FREE_PLAN_DAYS * DAY_MS
// 1-hour buffer tolerates tz / rounding skew when comparing to "now".
const BUFFER_MS = 3_600_000

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

  if (startTime && endTime) {
    const spanDays = Math.floor((endTime.getTime() - startTime.getTime()) / DAY_MS)
    if (spanDays > FREE_PLAN_DAYS) {
      return sendPyError(event, 403, 'Free plan can only fetch logs for 90 days')
    }
  }
  if (startTime && now - startTime.getTime() > FREE_PLAN_MS + BUFFER_MS) {
    return sendPyError(event, 403, 'Free plan can only access data from the last 90 days')
  }
  if (endTime && now - endTime.getTime() > FREE_PLAN_MS + BUFFER_MS) {
    return sendPyError(event, 403, 'Free plan can only access data from the last 90 days')
  }
  return null
}
