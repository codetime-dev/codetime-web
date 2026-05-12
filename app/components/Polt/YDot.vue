<script setup lang="ts">
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'

const props = defineProps<{
  data: {
    date: Date
    duration: number
    by?: string
  }[]
  yLabel: string
}>()
const t = useI18N()
const differentLabel = computed(() => {
  const differentLanguages = new Set<string | undefined>()
  const differentDates = new Set<string>()
  for (const d of props.data) {
    differentLanguages.add(d.by)
    differentDates.add(d.date.toISOString().slice(0, 10))
  }
  return { differentDates, differentLanguages }
})

const chart = ref()
const { width } = useElementBounding(chart)

// Target minimum drawn cell width. Once a day's cell falls below this we
// roll buckets up to weeks (and then to months) so each column stays
// readable instead of collapsing into a sub-pixel sliver.
const MIN_VISIBLE_CELL = 6

const bucket = computed<{
  unit: 'day' | 'week' | 'month'
  // d3 interval used for grouping cell timestamps to the bucket start
  interval: d3.CountableTimeInterval
  // Plot `x.interval` value — keeps the band scale aligned with the bucket
  plotInterval: 'day' | 'week' | 'month'
  // Tooltip label suffix — e.g. "Apr 14 → Apr 20" for week buckets
  formatRange: (start: Date) => string
}>(() => {
  const days = differentLabel.value.differentDates.size || 1
  const plotWidth = Math.max(0, (width.value || 800) - 32)
  const cellWidth = plotWidth / days
  if (cellWidth >= MIN_VISIBLE_CELL) {
    return {
      unit: 'day',
      interval: d3.utcDay,
      plotInterval: 'day',
      formatRange: start => start.toISOString().slice(0, 10),
    }
  }
  const weekCount = Math.max(1, Math.ceil(days / 7))
  if (plotWidth / weekCount >= MIN_VISIBLE_CELL) {
    return {
      unit: 'week',
      interval: d3.utcMonday,
      plotInterval: 'week',
      formatRange: (start) => {
        const end = d3.utcDay.offset(d3.utcMonday.offset(start, 1), -1)
        return `${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)}`
      },
    }
  }
  return {
    unit: 'month',
    interval: d3.utcMonth,
    plotInterval: 'month',
    formatRange: (start) => {
      const end = d3.utcDay.offset(d3.utcMonth.offset(start, 1), -1)
      return `${start.toISOString().slice(0, 7)} (${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)})`
    },
  }
})

// Aggregate raw daily entries into the current bucket. We sum durations
// rather than averaging so the opacity scale still reads "how much coding
// happened in that bucket" — a week with one full day vs. five active
// days should look different.
const bucketedData = computed(() => {
  const interval = bucket.value.interval
  const bucketStarts = new Set<string>()
  const byKeys = new Set<string>()
  const totals = new Map<string, number>()
  for (const d of props.data) {
    const bucketStart = interval.floor(d.date)
    const bucketKey = bucketStart.toISOString()
    bucketStarts.add(bucketKey)
    const byKey = d.by ?? ''
    byKeys.add(byKey)
    const k = `${bucketKey}__${byKey}`
    totals.set(k, (totals.get(k) ?? 0) + d.duration)
  }
  const result: { date: Date, duration: number, by?: string }[] = []
  for (const bucketKey of bucketStarts) {
    for (const byKey of byKeys) {
      const k = `${bucketKey}__${byKey}`
      const duration = totals.get(k) ?? 0
      result.push({
        date: new Date(bucketKey),
        duration,
        by: byKey || undefined,
      })
    }
  }
  return result
})

// `inset` shrinks each cell by N pixels per side; once buckets are wide
// enough we restore the 1.5 px gap, but at a year-wide *daily* window —
// before bucketing kicks in — the cell can still be ~2 px wide, so we
// scale the inset down to keep something visible.
const cellInset = computed(() => {
  const buckets = new Set(bucketedData.value.map(d => d.date.getTime())).size || 1
  const plotWidth = Math.max(0, (width.value || 800) - 32)
  const cellWidth = plotWidth / buckets
  if (cellWidth >= 12) {
    return 1.5
  }
  if (cellWidth >= 6) {
    return 0.75
  }
  return 0.25
})

const options = computed<Plot.PlotOptions>(() => {
  const o: Plot.PlotOptions = {
    className: 'y-dot-plot',
    opacity: {
      type: 'sqrt',
      range: [0.08, 1],
    },
    marginTop: 12,
    marginRight: 24,
    marginLeft: 8,
    marginBottom: 28,
    y: {
      ariaLabel: props.yLabel,
      label: null,
      axis: false,
      padding: 0.18,
    },
    x: {
      tickSize: 4,
      label: null,
      ticks: Math.max(3, Math.min(10, Math.floor(width.value / 120))),
      interval: bucket.value.plotInterval,
    },
    marks: [
      // Heatmap cells — equal-sized rectangles, color encodes duration.
      // Empty cells — flat surface tint so missing days remain visible.
      Plot.cell(bucketedData.value, {
        x: 'date',
        y: 'by',
        fill: 'var(--ct-surface-2)',
        inset: cellInset.value,
      }),
      Plot.cell(bucketedData.value.filter(d => d.duration > 0), {
        x: 'date',
        y: 'by',
        fill: 'var(--ct-primary)',
        fillOpacity: 'duration',
        inset: cellInset.value,
        tip: {
          fontSize: 12,
          channels: {
            by: {
              label: props.yLabel,
              value: d => getLanguageName(d.by),
            },
            duration: {
              label: t.value.plot.label.duration,
              value: d => getDurationString(d.duration * 60 * 1000),
            },
            date: {
              label: t.value.plot.label.date,
              value: d => bucket.value.formatRange(d.date),
            },
          },
          format: { fill: false, x: false, y: false },
        },
      }),
      // Right-anchored labels with surface-colored halo so they read
      // cleanly when overlapping cells.
      Plot.axisY({
        anchor: 'right',
        textAnchor: 'end',
        fill: 'var(--ct-fg)',
        textStroke: 'var(--ct-surface)',
        textStrokeWidth: 4,
        ariaLabel: props.yLabel,
        tickFormat: (d: string) => getLanguageName(d),
        tickPadding: -8,
        tickSize: 0,
      }),
    ],
  }
  return o
})
</script>

<template>
  <PoltChart
    ref="chart"
    :options="options"
  />
</template>

<style lang="css">
.y-dot-plot {
  font-size: 14px;
}
</style>
