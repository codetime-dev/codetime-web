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

type Slot = 'project' | 'language' | 'editor' | 'none'

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

function parseSlot(raw: unknown, fallback: Slot): Slot {
  const v = String(raw ?? '').toLowerCase()
  if (v === 'project' || v === 'language' || v === 'editor' || v === 'none') {
    return v
  }
  return fallback
}

function slotValue(slot: Slot, data: StatusPayload): string | null {
  if (slot === 'project') {
    return data.project || null
  }
  if (slot === 'language') {
    return data.language || null
  }
  if (slot === 'editor') {
    return data.editor || null
  }
  return null
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const uid = Number(q.uid)
  if (!Number.isFinite(uid) || uid <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'uid is required' })
  }
  const theme = getTheme(typeof q.theme === 'string' ? q.theme : 'light')

  // Slot config — default keeps prior visual: project as primary, language as secondary.
  const primary = parseSlot(q.primary, 'project')
  let secondary = parseSlot(q.secondary, 'language')
  // Two slots cannot show the same field (other than `none`).
  if (primary !== 'none' && primary === secondary) {
    secondary = 'none'
  }
  const requested = new Set<string>()
  if (primary !== 'none') {
    requested.add(primary)
  }
  if (secondary !== 'none') {
    requested.add(secondary)
  }
  const showCsv = requested.size > 0 ? [...requested].join(',') : 'none'

  let data: StatusPayload | null = null
  try {
    data = await fetchWidgetJson<StatusPayload>(event, `/v3/users/${uid}/public/status?show=${encodeURIComponent(showCsv)}`)
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
  // Server-side gating may downgrade requested slots (e.g. free user asking
  // for project+language). Reflect that here so we don't paint empty rows.
  const primaryRaw = slotValue(primary, data)
  const secondaryRaw = slotValue(secondary, data)
  const primaryText = primaryRaw ? escapeXml(primaryRaw) : ''
  const secondaryText = secondaryRaw ? escapeXml(secondaryRaw) : ''
  const hasPrimary = primaryText.length > 0
  const hasSecondary = secondaryText.length > 0
  const todayText = formatMinutes(Number(todayMinutes || 0))
  const lastSeen = relativeTime(lastActiveAt)

  const ROW_Y = 20
  const pulseAnim = isActive
    ? `
      <circle cx="18" cy="${ROW_Y}" r="5" fill="${theme.pulse}" opacity="0.55">
        <animate attributeName="r" values="4;9;4" dur="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="18" cy="${ROW_Y}" r="3.2" fill="${theme.pulse}"/>`
    : `<circle cx="18" cy="${ROW_Y}" r="3.2" fill="${theme.fgSubtle}"/>`

  // Mid-section vertical layout: collapse missing rows so we never advertise
  // a "—" placeholder. The divider sits 14px above the bottom row.
  const HEADER_BOTTOM = 32
  const BOTTOM_Y = 98
  const DIVIDER_Y = 82
  const midTop = HEADER_BOTTOM
  const midBottom = DIVIDER_Y - 6
  const midSpan = midBottom - midTop
  let primaryY = midTop + midSpan / 2
  let secondaryY = primaryY
  if (hasPrimary && hasSecondary) {
    primaryY = midTop + midSpan * 0.38
    secondaryY = midTop + midSpan * 0.78
  }
  else if (hasPrimary) {
    primaryY = midTop + midSpan / 2
  }
  else if (hasSecondary) {
    secondaryY = midTop + midSpan / 2
  }

  const primaryNode = hasPrimary
    ? `<text x="14" y="${primaryY}" dominant-baseline="central" font-family="${FONT_SANS}" font-size="13.5" font-weight="600" fill="${theme.fg}">${primaryText}</text>`
    : ''
  const secondaryNode = hasSecondary
    ? `<text x="14" y="${secondaryY}" dominant-baseline="central" font-family="${FONT_MONO}" font-size="11" fill="${theme.fgMuted}">${secondaryText}</text>`
    : ''
  // When the entire mid-section is empty, drop the divider too — otherwise it
  // floats over a blank band and the card reads as broken.
  const dividerNode = (hasPrimary || hasSecondary)
    ? `<line x1="14" x2="${W - 14}" y1="${DIVIDER_Y}" y2="${DIVIDER_Y}" stroke="${theme.border}"/>`
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="CodeTime status for ${username}">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  ${pulseAnim}
  <text x="30" y="${ROW_Y}" dominant-baseline="central" font-family="${FONT_SANS}" font-size="10" letter-spacing="0.12em" font-weight="600" fill="${headlineColor}">${headline}</text>
  <text x="${W - 14}" y="${ROW_Y}" dominant-baseline="central" text-anchor="end" font-family="${FONT_MONO}" font-size="10" fill="${theme.fgSubtle}">@${username}</text>

  ${primaryNode}
  ${secondaryNode}

  ${dividerNode}

  <text x="14" y="${BOTTOM_Y}" dominant-baseline="central" font-family="${FONT_SANS}" font-size="10" fill="${theme.fgSubtle}">today</text>
  <text x="60" y="${BOTTOM_Y}" dominant-baseline="central" font-family="${FONT_MONO}" font-size="11.5" font-weight="600" fill="${theme.fg}">${todayText}</text>

  <text x="${W - 14}" y="${BOTTOM_Y}" dominant-baseline="central" text-anchor="end" font-family="${FONT_SANS}" font-size="10" fill="${theme.fgSubtle}">last seen ${lastSeen}</text>
</svg>`

  return sendSvg(event, svg, { cacheSeconds: isActive ? 30 : 120 })
})

function renderEmpty(theme: ReturnType<typeof getTheme>, msg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12" fill="${theme.fgSubtle}">${escapeXml(msg)}</text>
</svg>`
}
