// Year-long activity calendar widget. Public — uid required.
// Mirrors the dashboard's YearCalendarChart but rendered server-side via
// Plot SSR so it can be embedded as <img src=".../calendar.svg?uid=..." />.

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

// Geometry is tuned so each weekday cell ends up roughly square. With
// 53 weeks across the W-padded plot area and 7 rows down, cell pitch is
// (W-24-28-4)/53 ≈ 13.28px wide, so the chart band needs 7×13.28 ≈ 93px
// inner height. Total H = CHART_TOP + 8px plot margins + 93 + CHART_BOTTOM.
const W = 760
const H = 138
const CHART_TOP = 22
const CHART_BOTTOM = 14

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const uid = Number(q.uid)
  if (!Number.isFinite(uid) || uid <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'uid is required' })
  }
  const themeName = typeof q.theme === 'string' ? q.theme : 'light'
  const theme = getTheme(themeName)
  const isDark = themeName === 'dark'

  // Free plan is server-capped at 90 days of coding history; pro extends
  // to 365. Try the full year first, fall back to 90 on the plan-gate
  // 403 so the calendar still renders (just with fewer filled weeks).
  let payload: CodingHistoryResponse
  try {
    payload = await fetchWidgetJson<CodingHistoryResponse>(
      event,
      `/v3/public/users/${uid}/coding-history?days=365`,
    )
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    if (err?.statusCode === 403 && /\b90\b/.test(String(err.statusMessage ?? ''))) {
      try {
        payload = await fetchWidgetJson<CodingHistoryResponse>(
          event,
          `/v3/public/users/${uid}/coding-history?days=90`,
        )
      }
      catch (retryError: unknown) {
        const re = retryError as { statusCode?: number }
        const msg = re?.statusCode === 404 ? 'User not found' : 'No data'
        return sendSvg(event, renderEmpty(theme, msg), { cacheSeconds: 60 })
      }
    }
    else {
      const msg = err?.statusCode === 404 ? 'User not found' : 'No data'
      return sendSvg(event, renderEmpty(theme, msg), { cacheSeconds: 60 })
    }
  }

  const raw = (payload.data ?? [])
    .map(r => ({ date: new Date(r.time), duration: Number(r.duration) || 0 }))
    .filter(r => !Number.isNaN(r.date.getTime()))

  // Fill in missing days so the calendar always shows a full 365-day grid,
  // anchored on today (UTC). This matches YearCalendarChart.vue.
  const today = d3.utcDay.floor(new Date())
  const start = d3.utcDay.offset(today, -364)
  const range = d3.utcDay.range(start, d3.utcDay.offset(today, 1))
  const lookup = new Map<number, number>()
  for (const r of raw) lookup.set(d3.utcDay.floor(r.date).getTime(), r.duration)
  const cells = range.map(date => ({ date, duration: lookup.get(date.getTime()) ?? 0 }))

  const totalMinutes = cells.reduce((a, b) => a + b.duration, 0)
  const activeDays = cells.filter(c => c.duration > 0).length

  // Sample chart styling: empty days get a muted surface; active days
  // ramp toward the theme accent on a sqrt scale (close to GitHub's).
  const empty = isDark ? '#1f2937' : '#eef0f3'
  const accent = isDark ? '#38bdf8' : '#0284c7'
  const maxDuration = d3.max(cells, c => c.duration) || 1

  const inner = renderPlotSvg({
    width: W - 24,
    height: H - CHART_TOP - CHART_BOTTOM,
    marginTop: 4,
    marginRight: 4,
    marginBottom: 4,
    marginLeft: 28,
    padding: 0,
    x: { axis: null },
    y: {
      tickSize: 0,
      tickFormat: Plot.formatWeekday('en'),
      label: null,
    },
    color: {
      type: 'sqrt',
      domain: [0, maxDuration],
      range: [empty, accent],
    },
    style: {
      background: 'transparent',
      color: theme.fgSubtle,
      fontFamily: FONT_SANS,
      fontSize: '10px',
    },
    marks: [
      Plot.cell(cells, {
        x: d => weekIndex(d.date as Date, today),
        y: d => (d.date as Date).getUTCDay(),
        fill: 'duration',
        inset: 1.2,
        rx: 2,
      }),
    ],
  })

  const username = typeof payload.username === 'string' ? escapeXml(payload.username) : ''
  const summary = `${activeDays}/365 active · ${formatHours(totalMinutes)}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="CodeTime activity calendar">
  <rect width="${W}" height="${H}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  <text x="14" y="18" font-family="${FONT_SANS}" font-size="11" font-weight="600" letter-spacing="0.1em" fill="${theme.fgSubtle}">ACTIVITY · 365D${username ? ` · @${username}` : ''}</text>
  <text x="${W - 14}" y="18" text-anchor="end" font-family="${FONT_SANS}" font-size="11" fill="${theme.fgSubtle}">${escapeXml(summary)}</text>
  <g transform="translate(12 ${CHART_TOP})" style="color: ${theme.fgSubtle}">${inner}</g>
  <text x="${W - 14}" y="${H - 6}" text-anchor="end" font-family="${FONT_SANS}" font-size="9" fill="${theme.fgSubtle}">codetime.dev</text>
</svg>`

  return sendSvg(event, svg, { cacheSeconds: 600 })
})

function weekIndex(date: Date, end: Date): number {
  const diffDays = Math.round((+date - +end) / 86_400_000)
  return Math.floor(diffDays / 7)
}

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
