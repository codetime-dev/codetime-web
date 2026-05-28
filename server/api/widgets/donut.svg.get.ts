// Donut chart of top languages by minutes.
// Public — uid required, optional days/limit/theme.

import { createError, defineEventHandler, getQuery } from 'h3'
import { CATEGORICAL_PALETTE, escapeXml, FONT_MONO, FONT_SANS, formatMinutes, getTheme } from '../../utils/svg-theme'
import { fetchWidgetJson, sendSvg } from '../../utils/widget-fetch'

type TopRow = { field: string, minutes: number }
type DonutPayload = {
  plan?: string
  days?: number
  limit?: number
  capped?: boolean
  items?: TopRow[]
}
// Upstream may return either the wrapped object (newer API) or a bare array
// (legacy prod). Accept both so the widget works during the rollout window.
type DonutResponse = DonutPayload | TopRow[]

const W = 360
const H = 180
const R_OUT = 70
const R_IN = 44
const CX = 90
const CY = 90

function arcPath(cx: number, cy: number, rOut: number, rIn: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const x0 = cx + Math.cos(a0) * rOut
  const y0 = cy + Math.sin(a0) * rOut
  const x1 = cx + Math.cos(a1) * rOut
  const y1 = cy + Math.sin(a1) * rOut
  const x2 = cx + Math.cos(a1) * rIn
  const y2 = cy + Math.sin(a1) * rIn
  const x3 = cx + Math.cos(a0) * rIn
  const y3 = cy + Math.sin(a0) * rIn
  return [
    `M ${x0.toFixed(2)} ${y0.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    'Z',
  ].join(' ')
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const uid = Number(q.uid)
  if (!Number.isFinite(uid) || uid <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'uid is required' })
  }
  const days = Math.max(1, Math.min(365, Number(q.days ?? 30) || 30))
  const limit = Math.max(2, Math.min(12, Number(q.limit ?? 6) || 6))
  const theme = getTheme(typeof q.theme === 'string' ? q.theme : 'light')
  // Two donut flavors share the same chart layout: top languages and top
  // projects. The mode picks the upstream endpoint (each gated by its own
  // privacy facet) and the legend header.
  const mode = q.mode === 'projects' ? 'projects' : 'languages'
  const upstream = mode === 'projects'
    ? `/v3/users/${uid}/public/top-projects?days=${days}&limit=${limit}&widget=1`
    : `/v3/users/${uid}/public/top-languages?days=${days}&limit=${limit}&widget=1`
  const legendHeader = mode === 'projects' ? 'PROJECTS' : 'LANGUAGES'
  const ariaLabel = mode === 'projects' ? 'Top projects' : 'Top languages'

  let payload: DonutPayload
  try {
    const raw = await fetchWidgetJson<DonutResponse>(event, upstream)
    payload = Array.isArray(raw) ? { items: raw } : raw
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

  const rows = (payload.items ?? []).filter(r => r.minutes > 0)
  const effectiveDays = payload.days ?? days
  if (rows.length === 0) {
    return sendSvg(event, renderEmpty(theme, 'No coding activity'), { cacheSeconds: 120 })
  }

  const total = rows.reduce((s, r) => s + r.minutes, 0)
  let acc = -Math.PI / 2
  const slices = rows.map((r, i) => {
    const a0 = acc
    const a1 = acc + (r.minutes / total) * Math.PI * 2
    acc = a1
    const color = CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]!
    return { ...r, a0, a1, color, pct: (r.minutes / total) * 100 }
  })

  const slicePaths = slices
    .map(s => `<path d="${arcPath(CX, CY, R_OUT, R_IN, s.a0, s.a1)}" fill="${s.color}"/>`)
    .join('')

  // Legend layout — every text uses dominant-baseline="central" so the swatch,
  // label and percentage sit on the same horizontal centerline.
  const legendX = 190
  const legendW = W - legendX - 10
  const legendHeaderY = 18
  const legendStartY = 38
  const rowH = 18
  const swatch = 10
  const legend = slices
    .slice(0, 6)
    .map((s, i) => {
      const cy = legendStartY + i * rowH
      const label = escapeXml(s.field || 'unknown')
      const pct = s.pct.toFixed(1)
      return `
        <g>
          <rect x="${legendX}" y="${cy - swatch / 2}" width="${swatch}" height="${swatch}" rx="1.5" fill="${s.color}"/>
          <text x="${legendX + swatch + 6}" y="${cy}" dominant-baseline="central" font-family="${FONT_SANS}" font-size="11" fill="${theme.fg}">${label}</text>
          <text x="${legendX + legendW}" y="${cy}" dominant-baseline="central" text-anchor="end" font-family="${FONT_MONO}" font-size="10.5" fill="${theme.fgSubtle}">${pct}%</text>
        </g>`
    })
    .join('')

  const totalText = formatMinutes(total)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ariaLabel}, last ${effectiveDays} days">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  <g>${slicePaths}</g>
  <text x="${CX}" y="${CY - 8}" text-anchor="middle" dominant-baseline="central" font-family="${FONT_MONO}" font-size="14" fill="${theme.fg}" font-weight="600">${totalText}</text>
  <text x="${CX}" y="${CY + 9}" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SANS}" font-size="9.5" fill="${theme.fgSubtle}">last ${effectiveDays}d</text>
  <text x="${legendX}" y="${legendHeaderY}" dominant-baseline="central" font-family="${FONT_SANS}" font-size="10" fill="${theme.fgSubtle}" letter-spacing="0.08em">${legendHeader}</text>
  ${legend}
  <text x="${W - 10}" y="${H - 12}" text-anchor="end" dominant-baseline="central" font-family="${FONT_MONO}" font-size="9" fill="${theme.fgSubtle}">codetime.dev</text>
</svg>`

  return sendSvg(event, svg, { cacheSeconds: 600 })
})

function renderEmpty(theme: ReturnType<typeof getTheme>, msg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-family="${FONT_SANS}" font-size="12" fill="${theme.fgSubtle}">${escapeXml(msg)}</text>
</svg>`
}
