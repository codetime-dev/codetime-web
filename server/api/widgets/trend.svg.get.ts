// Daily coding-time trend widget. Public — uid required.
// Mirrors ActivityTrend.vue: scatter of daily minutes plus a 7-day
// rolling-mean line, rendered with Plot SSR for <img>-style embedding.

import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'
import { createError, defineEventHandler, getQuery } from 'h3'
import { renderPlotSvg } from '../../utils/svg-plot'
import { escapeXml, FONT_SANS, getTheme } from '../../utils/svg-theme'
import { fetchWidgetJson, sendSvg } from '../../utils/widget-fetch'

type CodingHistoryRow = { time: string, duration: number }
type CodingHistoryResponse = {
  data?: CodingHistoryRow[]
  totalMinutes?: number
  username?: string
}

const W = 720
const H = 220
const HEADER = 28
const FOOTER = 12

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const uid = Number(q.uid)
  if (!Number.isFinite(uid) || uid <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'uid is required' })
  }
  const themeName = typeof q.theme === 'string' ? q.theme : 'light'
  const theme = getTheme(themeName)
  const days = Math.max(7, Math.min(365, Math.trunc(Number(q.days ?? 90)) || 90))

  let payload: CodingHistoryResponse
  try {
    payload = await fetchWidgetJson<CodingHistoryResponse>(
      event,
      `/v3/public/users/${uid}/coding-history?days=${days}`,
    )
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number }
    const msg = err?.statusCode === 403
      ? 'Widget disabled'
      : err?.statusCode === 404 ? 'User not found' : 'No data'
    return sendSvg(event, renderEmpty(theme, msg), { cacheSeconds: 60 })
  }

  const points = (payload.data ?? [])
    .map(r => ({ date: new Date(r.time), duration: Number(r.duration) || 0 }))
    .filter(r => !Number.isNaN(r.date.getTime()))

  if (points.every(p => p.duration === 0)) {
    return sendSvg(event, renderEmpty(theme, 'No coding activity'), { cacheSeconds: 120 })
  }

  const dotColor = themeName === 'dark' ? '#94a3b8' : '#9ca3af'
  const lineColor = theme.primary

  const inner = renderPlotSvg({
    width: W - 24,
    height: H - HEADER - FOOTER,
    marginTop: 12,
    marginRight: 36,
    marginBottom: 26,
    marginLeft: 8,
    x: { type: 'utc', label: null },
    y: {
      grid: true,
      nice: true,
      axis: 'right',
      label: 'hours',
      labelAnchor: 'top',
      tickFormat: (d: number) => d3.format(',d')(d / 60),
    },
    style: {
      background: 'transparent',
      color: theme.fgSubtle,
      fontFamily: FONT_SANS,
      fontSize: '10px',
    },
    marks: [
      Plot.dotY(points, {
        x: 'date',
        y: 'duration',
        fill: dotColor,
        fillOpacity: 0.35,
        r: 1.8,
      }),
      Plot.lineY(points, Plot.windowY({
        k: 7,
        x: 'date',
        y: 'duration',
        stroke: lineColor,
        strokeWidth: 1.8,
        curve: 'monotone-x',
      })),
    ],
  })

  const totalMinutes = points.reduce((a, b) => a + b.duration, 0)
  const activeDays = points.filter(p => p.duration > 0).length
  const username = typeof payload.username === 'string' ? escapeXml(payload.username) : ''
  const summary = `${activeDays}/${days} active · ${formatHours(totalMinutes)}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="CodeTime daily trend">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="14" y="18" font-family="${FONT_SANS}" font-size="11" font-weight="600" letter-spacing="0.1em" fill="${theme.fgSubtle}">TREND · ${days}D · 7D-AVG${username ? ` · @${username}` : ''}</text>
  <text x="${W - 14}" y="18" text-anchor="end" font-family="${FONT_SANS}" font-size="11" fill="${theme.fgSubtle}">${escapeXml(summary)}</text>
  <g transform="translate(12 ${HEADER})" style="color: ${theme.fgSubtle}">${inner}</g>
  <text x="${W - 14}" y="${H - 4}" text-anchor="end" font-family="${FONT_SANS}" font-size="9" fill="${theme.fgSubtle}">codetime.dev</text>
</svg>`

  return sendSvg(event, svg, { cacheSeconds: 600 })
})

function formatHours(minutes: number): string {
  if (minutes <= 0) {
 return '0h'
}
  const h = minutes / 60
  if (h >= 1000) {
 return `${(h / 1000).toFixed(1)}kh`
}
  if (h >= 100) {
 return `${Math.round(h)}h`
}
  if (h >= 10) {
 return `${h.toFixed(1)}h`
}
  return `${h.toFixed(2)}h`
}

function renderEmpty(theme: ReturnType<typeof getTheme>, msg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SANS}" font-size="12" fill="${theme.fgSubtle}">${escapeXml(msg)}</text>
</svg>`
}
