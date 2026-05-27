// Token / cost usage card. Public — uid required.

import type { UsageRange } from '../../utils/usage-range'
import { createError, defineEventHandler, getQuery } from 'h3'
import { escapeXml, FONT_MONO, FONT_SANS, formatTokens, formatUsd, getTheme, sanitizeColor } from '../../utils/svg-theme'
import { parseUsageRange } from '../../utils/usage-range'
import { fetchWidgetJson, sendSvg } from '../../utils/widget-fetch'

type UsagePayload = {
  plan?: string
  range: UsageRange
  since: string | null
  until: string
  tokens: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  estimatedCostUsd: number
}

type WidgetStyle = 'minimal' | 'detailed'

const RANGE_LABELS: Record<UsageRange, string> = {
  'today': 'TODAY',
  'week': 'THIS WEEK',
  'month': 'THIS MONTH',
  'year': 'THIS YEAR',
  '24h': 'LAST 24H',
  '7d': 'LAST 7 DAYS',
  '30d': 'LAST 30 DAYS',
  '365d': 'LAST 365 DAYS',
  'all': 'ALL TIME',
}
const RANGE_LABELS_LOWER: Record<UsageRange, string> = {
  'today': 'today',
  'week': 'this week',
  'month': 'this month',
  'year': 'this year',
  '24h': 'last 24h',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '365d': 'last 365 days',
  'all': 'all time',
}

const MIN_H = 36

function parseStyle(raw: unknown): WidgetStyle {
  return String(raw ?? '').toLowerCase() === 'minimal' ? 'minimal' : 'detailed'
}

// "May 1 → today" / "May 1" / "all time".
function formatSpan(since: string | null, until: string, range: UsageRange): string {
  if (range === 'all' || !since) {
    return 'all time'
  }
  const s = new Date(since)
  const u = new Date(until)
  const monthShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  const startLabel = `${monthShort(s)} ${s.getUTCDate()}`
  const sameDay = s.getUTCFullYear() === u.getUTCFullYear()
    && s.getUTCMonth() === u.getUTCMonth()
    && s.getUTCDate() === u.getUTCDate()
  return sameDay ? startLabel : `${startLabel} → today`
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const uid = Number(q.uid)
  if (!Number.isFinite(uid) || uid <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'uid is required' })
  }
  const theme = getTheme(typeof q.theme === 'string' ? q.theme : 'light')
  const requestedStyle = parseStyle(q.style)
  const requestedAccent = sanitizeColor(q.color)
  const requestedBg = sanitizeColor(q.bg)
  const range = parseUsageRange(q.range)

  let payload: UsagePayload
  try {
    payload = await fetchWidgetJson<UsagePayload>(event, `/v3/users/${uid}/public/usage?range=${range}`)
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number }
    if (err?.statusCode === 403) {
      return sendSvg(event, renderEmpty(theme, 'Widget disabled'), { cacheSeconds: 60 })
    }
    if (err?.statusCode === 404) {
      return sendSvg(event, renderEmpty(theme, 'User not found'), { cacheSeconds: 60 })
    }
    return sendSvg(event, renderEmpty(theme, 'No data'), { cacheSeconds: 60 })
  }

  const isPro = String(payload.plan ?? 'free').toLowerCase() === 'pro'
  // Detailed style + custom colors are Pro-only, mirroring the status widget.
  const styleMode: WidgetStyle = isPro ? requestedStyle : 'minimal'
  const accent = isPro && requestedAccent ? requestedAccent : theme.primary
  const bg = isPro && requestedBg ? requestedBg : theme.bg

  const svg = styleMode === 'minimal'
    ? renderMinimal({ theme, bg, accent, payload })
    : renderDetailed({ theme, bg, accent, payload })
  return sendSvg(event, svg, { cacheSeconds: 300 })
})

type RenderArgs = {
  theme: ReturnType<typeof getTheme>
  bg: string
  accent: string
  payload: UsagePayload
}

function renderMinimal({ theme, bg, accent, payload }: RenderArgs): string {
  const W = 340
  const rangeLabel = RANGE_LABELS_LOWER[payload.range] ?? 'last 30 days'
  const text = `${formatTokens(payload.tokens)} tok  •  ${formatUsd(payload.estimatedCostUsd)}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${MIN_H}" viewBox="0 0 ${W} ${MIN_H}" role="img" aria-label="Token usage, ${escapeXml(rangeLabel)}">
  <rect width="${W}" height="${MIN_H}" rx="8" fill="${bg}" stroke="${theme.border}"/>
  <circle cx="14" cy="${MIN_H / 2}" r="3.5" fill="${accent}"/>
  <text x="26" y="${MIN_H / 2}" dominant-baseline="central" font-family="${FONT_MONO}" font-size="12" fill="${theme.fg}" font-weight="600">${escapeXml(text)}</text>
  <text x="${W - 10}" y="${MIN_H / 2}" text-anchor="end" dominant-baseline="central" font-family="${FONT_SANS}" font-size="9.5" fill="${theme.fgSubtle}" letter-spacing="0.06em">${escapeXml(rangeLabel.toUpperCase())}</text>
</svg>`
}

function renderDetailed({ theme, bg, accent, payload }: RenderArgs): string {
  const W = 380
  const H = 132
  const rangeLabel = RANGE_LABELS[payload.range] ?? 'LAST 30 DAYS'
  const span = formatSpan(payload.since, payload.until, payload.range)
  // Cache-read tokens are charged at a fraction of the prompt rate;
  // subtract them so the displayed "in" matches the cost calculation.
  const fresh = Math.max(0, payload.inputTokens - payload.cachedInputTokens)
  const output = payload.outputTokens + payload.reasoningOutputTokens
  const cx = W / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Token usage, ${escapeXml(rangeLabel)}">
  <rect width="${W}" height="${H}" rx="10" fill="${bg}" stroke="${theme.border}"/>
  <text x="16" y="20" dominant-baseline="central" font-family="${FONT_SANS}" font-size="10" fill="${theme.fgSubtle}" letter-spacing="0.14em">${escapeXml(rangeLabel)}</text>
  <text x="${W - 16}" y="20" text-anchor="end" dominant-baseline="central" font-family="${FONT_MONO}" font-size="10" fill="${theme.fgSubtle}">${escapeXml(span)}</text>

  <line x1="${cx}" y1="38" x2="${cx}" y2="${H - 36}" stroke="${theme.border}"/>

  <text x="${cx / 2}" y="62" text-anchor="middle" dominant-baseline="central" font-family="${FONT_MONO}" font-size="24" fill="${theme.fg}" font-weight="600">${escapeXml(formatTokens(payload.tokens))}</text>
  <text x="${cx / 2}" y="82" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SANS}" font-size="9.5" fill="${theme.fgSubtle}" letter-spacing="0.1em">TOKENS</text>

  <text x="${cx + cx / 2}" y="62" text-anchor="middle" dominant-baseline="central" font-family="${FONT_MONO}" font-size="24" fill="${accent}" font-weight="600">${escapeXml(formatUsd(payload.estimatedCostUsd))}</text>
  <text x="${cx + cx / 2}" y="82" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SANS}" font-size="9.5" fill="${theme.fgSubtle}" letter-spacing="0.1em">EST. COST</text>

  <text x="16" y="${H - 16}" dominant-baseline="central" font-family="${FONT_MONO}" font-size="10" fill="${theme.fgMuted}">
    <tspan fill="${theme.fgSubtle}">in </tspan>${escapeXml(formatTokens(fresh))}
    <tspan fill="${theme.fgSubtle}"> · cache </tspan>${escapeXml(formatTokens(payload.cachedInputTokens))}
    <tspan fill="${theme.fgSubtle}"> · out </tspan>${escapeXml(formatTokens(output))}
  </text>
  <text x="${W - 16}" y="${H - 16}" text-anchor="end" dominant-baseline="central" font-family="${FONT_MONO}" font-size="9" fill="${theme.fgSubtle}">codetime.dev</text>
</svg>`
}

function renderEmpty(theme: ReturnType<typeof getTheme>, msg: string): string {
  const W = 340
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${MIN_H}" viewBox="0 0 ${W} ${MIN_H}">
  <rect width="${W}" height="${MIN_H}" rx="8" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="${W / 2}" y="${MIN_H / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SANS}" font-size="12" fill="${theme.fgSubtle}">${escapeXml(msg)}</text>
</svg>`
}
