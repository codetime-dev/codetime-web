// "Currently coding" status card. Public — uid required.

import { createError, defineEventHandler, getQuery } from 'h3'
import { escapeXml, FONT_MONO, FONT_SANS, formatMinutes, getTheme } from '../../utils/svg-theme'
import { fetchWidgetJson, sendSvg } from '../../utils/widget-fetch'

// Upstream historically used camelCase (lastActiveAt/todayMinutes); newer
// builds emit snake_case. Accept both so the widget renders against either.
type StatusPayload = {
  username: string
  plan?: string
  project: string | null
  language: string | null
  editor: string | null
  last_active_at?: number | null
  today_minutes?: number
  lastActiveAt?: number | null
  todayMinutes?: number
}

const W = 380
const H = 116
const ACTIVE_WINDOW_SECONDS = 5 * 60

function relativeTime(ts: number | null): string {
  if (!ts) {
    return 'never'
  }
  const now = Math.floor(Date.now() / 1000)
  const v = ts > 1e12 ? Math.floor(ts / 1000) : ts
  const diff = Math.max(0, now - v)
  if (diff < 60) {
    return 'just now'
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`
  }
  if (diff < 86_400) {
    return `${Math.floor(diff / 3600)}h ago`
  }
  return `${Math.floor(diff / 86_400)}d ago`
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const uid = Number(q.uid)
  if (!Number.isFinite(uid) || uid <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'uid is required' })
  }
  const theme = getTheme(typeof q.theme === 'string' ? q.theme : 'light')

  let data: StatusPayload | null = null
  try {
    data = await fetchWidgetJson<StatusPayload>(event, `/v3/users/${uid}/public/status`)
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number }
    const msg = err?.statusCode === 403 ? 'Widget disabled' : err?.statusCode === 404 ? 'User not found' : 'No data'
    return sendSvg(event, renderEmpty(theme, msg), { cacheSeconds: 60 })
  }

  if (!data) {
    return sendSvg(event, renderEmpty(theme, 'No data'), { cacheSeconds: 60 })
  }

  const lastActiveAt = data.last_active_at ?? data.lastActiveAt ?? null
  const todayMinutes = data.today_minutes ?? data.todayMinutes ?? 0
  const lastTs = lastActiveAt ? (lastActiveAt > 1e12 ? Math.floor(lastActiveAt / 1000) : lastActiveAt) : 0
  const isActive = lastTs > 0 && Math.floor(Date.now() / 1000) - lastTs < ACTIVE_WINDOW_SECONDS

  const headlineColor = isActive ? theme.pulse : theme.fgSubtle
  const headline = isActive ? 'CURRENTLY CODING' : 'IDLE'
  const username = escapeXml(data.username || '')
  // Backend omits `project` for free users; render a neutral dash so the SVG
  // itself never advertises the gating — the upsell lives in the dashboard UI.
  const project = escapeXml(data.project || '—')
  const language = escapeXml(data.language || '—')
  const editor = escapeXml(data.editor || '—')
  const todayText = formatMinutes(Number(todayMinutes || 0))
  const lastSeen = relativeTime(lastActiveAt)
  const projectFill = theme.fg

  const ROW_Y = 20
  const pulseAnim = isActive
    ? `
      <circle cx="18" cy="${ROW_Y}" r="5" fill="${theme.pulse}" opacity="0.55">
        <animate attributeName="r" values="4;9;4" dur="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="18" cy="${ROW_Y}" r="3.2" fill="${theme.pulse}"/>`
    : `<circle cx="18" cy="${ROW_Y}" r="3.2" fill="${theme.fgSubtle}"/>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="CodeTime status for ${username}">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  ${pulseAnim}
  <text x="30" y="${ROW_Y}" dominant-baseline="central" font-family="${FONT_SANS}" font-size="10" letter-spacing="0.12em" font-weight="600" fill="${headlineColor}">${headline}</text>
  <text x="${W - 14}" y="${ROW_Y}" dominant-baseline="central" text-anchor="end" font-family="${FONT_MONO}" font-size="10" fill="${theme.fgSubtle}">@${username}</text>

  <text x="14" y="50" dominant-baseline="central" font-family="${FONT_SANS}" font-size="13.5" font-weight="600" fill="${projectFill}">${project}</text>
  <text x="14" y="68" dominant-baseline="central" font-family="${FONT_MONO}" font-size="11" fill="${theme.fgMuted}">${language} · ${editor}</text>

  <line x1="14" x2="${W - 14}" y1="82" y2="82" stroke="${theme.border}"/>

  <text x="14" y="98" dominant-baseline="central" font-family="${FONT_SANS}" font-size="10" fill="${theme.fgSubtle}">today</text>
  <text x="60" y="98" dominant-baseline="central" font-family="${FONT_MONO}" font-size="11.5" font-weight="600" fill="${theme.fg}">${todayText}</text>

  <text x="${W - 14}" y="98" dominant-baseline="central" text-anchor="end" font-family="${FONT_SANS}" font-size="10" fill="${theme.fgSubtle}">last seen ${lastSeen}</text>
</svg>`

  return sendSvg(event, svg, { cacheSeconds: isActive ? 30 : 120 })
})

function renderEmpty(theme: ReturnType<typeof getTheme>, msg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12" fill="${theme.fgSubtle}">${escapeXml(msg)}</text>
</svg>`
}
