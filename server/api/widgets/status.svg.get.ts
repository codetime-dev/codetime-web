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
type WidgetStyle = 'minimal' | 'detailed'

const W = 380
const H = 116
const MIN_W = 200
const MIN_H = 36
const ACTIVE_WINDOW_SECONDS = 5 * 60

// Hex color guard: accepts #rgb / #rrggbb / #rrggbbaa (with or without leading #).
function sanitizeColor(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null
  }
  const v = raw.trim().replace(/^#/, '')
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) {
    return null
  }
  return `#${v.toLowerCase()}`
}

function parseStyle(raw: unknown): WidgetStyle {
  return String(raw ?? '').toLowerCase() === 'minimal' ? 'minimal' : 'detailed'
}

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
  const requestedStyle = parseStyle(q.style)
  const requestedColor = sanitizeColor(q.color)
  const requestedBg = sanitizeColor(q.bg)

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
    return sendSvg(event, renderEmpty(theme, msg, requestedStyle), { cacheSeconds: 60 })
  }

  if (!data) {
    return sendSvg(event, renderEmpty(theme, 'No data', requestedStyle), { cacheSeconds: 60 })
  }

  // Plan gating: only Pro unlocks the detailed style + custom accent / background.
  const isPro = String(data.plan ?? 'free').toLowerCase() === 'pro'
  const style: WidgetStyle = isPro ? requestedStyle : 'minimal'
  const accentColor = isPro && requestedColor ? requestedColor : null
  const bgFill = isPro && requestedBg ? requestedBg : theme.bg

  const lastActiveAt = data.last_active_at ?? data.lastActiveAt ?? null
  const todayMinutes = data.today_minutes ?? data.todayMinutes ?? 0
  const lastTs = lastActiveAt ? (lastActiveAt > 1e12 ? Math.floor(lastActiveAt / 1000) : lastActiveAt) : 0
  const isActive = lastTs > 0 && Math.floor(Date.now() / 1000) - lastTs < ACTIVE_WINDOW_SECONDS

  if (style === 'minimal') {
    const svg = renderMinimal({
      theme,
      isActive,
      todayMinutes: Number(todayMinutes || 0),
      lastActiveAt,
      accent: accentColor,
      bg: bgFill,
    })
    return sendSvg(event, svg, { cacheSeconds: isActive ? 30 : 120 })
  }

  const activeColor = accentColor ?? theme.pulse
  const headlineColor = isActive ? activeColor : theme.fgSubtle
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
      <circle cx="18" cy="${ROW_Y}" r="5" fill="${activeColor}" opacity="0.55">
        <animate attributeName="r" values="4;9;4" dur="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="18" cy="${ROW_Y}" r="3.2" fill="${activeColor}"/>`
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
  <rect width="${W}" height="${H}" rx="10" fill="${bgFill}" stroke="${theme.border}"/>
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

function renderEmpty(theme: ReturnType<typeof getTheme>, msg: string, style: WidgetStyle = 'detailed'): string {
  if (style === 'minimal') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${MIN_W}" height="${MIN_H}" viewBox="0 0 ${MIN_W} ${MIN_H}">
  <rect width="${MIN_W}" height="${MIN_H}" rx="6" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="${MIN_W / 2}" y="${MIN_H / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SANS}" font-size="11" fill="${theme.fgSubtle}">${escapeXml(msg)}</text>
</svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12" fill="${theme.fgSubtle}">${escapeXml(msg)}</text>
</svg>`
}

type MinimalArgs = {
  theme: ReturnType<typeof getTheme>
  isActive: boolean
  todayMinutes: number
  lastActiveAt: number | null | undefined
  accent: string | null
  bg: string
}

function renderMinimal({ theme, isActive, todayMinutes, lastActiveAt, accent, bg }: MinimalArgs): string {
  const cy = MIN_H / 2
  const dotX = 14
  const labelX = dotX + 14
  const activeColor = accent ?? theme.pulse
  const dotFill = isActive ? activeColor : theme.fgSubtle
  const labelText = isActive ? 'CODING' : 'IDLE'
  const labelColor = isActive ? activeColor : theme.fgSubtle

  // Right-side meta: prefer today's minutes when nonzero; fall back to "Nm ago"
  // last-seen so the card always carries one piece of context. When neither
  // signal is available, suppress the meta entirely.
  let metaText = ''
  if (todayMinutes > 0) {
    metaText = formatMinutes(todayMinutes)
  }
  else if (lastActiveAt) {
    const lastTs = lastActiveAt > 1e12 ? Math.floor(lastActiveAt / 1000) : lastActiveAt
    const diff = Math.max(0, Math.floor(Date.now() / 1000) - lastTs)
    if (diff < 60) {
      metaText = 'just now'
    }
    else if (diff < 3600) {
      metaText = `${Math.floor(diff / 60)}m ago`
    }
    else if (diff < 86_400) {
      metaText = `${Math.floor(diff / 3600)}h ago`
    }
    else {
      metaText = `${Math.floor(diff / 86_400)}d ago`
    }
  }

  const pulseNode = isActive
    ? `
      <circle cx="${dotX}" cy="${cy}" r="4.5" fill="${activeColor}" opacity="0.5">
        <animate attributeName="r" values="3.5;7.5;3.5" dur="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.55;0;0.55" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${dotX}" cy="${cy}" r="3" fill="${dotFill}"/>`
    : `<circle cx="${dotX}" cy="${cy}" r="3" fill="${dotFill}"/>`

  const metaNode = metaText
    ? `<text x="${MIN_W - 12}" y="${cy}" text-anchor="end" dominant-baseline="central" font-family="${FONT_MONO}" font-size="10.5" fill="${theme.fgSubtle}">${escapeXml(metaText)}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MIN_W}" height="${MIN_H}" viewBox="0 0 ${MIN_W} ${MIN_H}" role="img" aria-label="CodeTime ${labelText.toLowerCase()}">
  <rect width="${MIN_W}" height="${MIN_H}" rx="6" fill="${bg}" stroke="${theme.border}"/>
  ${pulseNode}
  <text x="${labelX}" y="${cy}" dominant-baseline="central" font-family="${FONT_SANS}" font-size="10.5" letter-spacing="0.14em" font-weight="700" fill="${labelColor}">${labelText}</text>
  ${metaNode}
</svg>`
}
