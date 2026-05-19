<script setup lang="ts">
import * as d3 from 'd3'

const props = withDefaults(defineProps<{
  data: MaybeRef<{
    date: Date
    duration: number
  }[]>
  endDate?: Date
  // Optional active window. The grid still spans the full trailing
  // 365 days; cells outside [rangeStart, rangeEnd] render in a fainter
  // colour so the active window pops without losing the grid.
  rangeStart?: Date
  rangeEnd?: Date
}>(), {
  endDate: () => new Date(),
  rangeStart: undefined,
  rangeEnd: undefined,
})
const data = computed(() => {
  return unref(props.data)
})
// Grid strategy:
//   • no rangeStart → legacy trailing 365 days ending at endDate
//   • rangeStart given → natural calendar year containing rangeStart
//     (Jan 1 → Dec 31), so "YTD" reads as the full year with the
//     post-today portion drawn as future cells.
const gridStartDate = props.rangeStart
  ? new Date(props.rangeStart.getFullYear(), 0, 1)
  : d3.utcDay.offset(props.endDate, -365)
const gridEndDate = props.rangeStart
  // First-day-of-next-year — d3.utcDay.range is half-open, so this
  // includes Dec 31 of the target year and stops just short of Jan 1.
  ? new Date(props.rangeStart.getFullYear() + 1, 0, 1)
  : props.endDate
const years = d3.utcDay.range(gridStartDate, gridEndDate)
type CellState = 'in-range' | 'past-out' | 'future'
const todayMs = new Date().setHours(23, 59, 59, 999)
const rangeStartMs = props.rangeStart?.getTime()
const rangeEndMs = props.rangeEnd?.getTime()
function classifyDate(date: Date): CellState {
  const t = date.getTime()
  if (t > todayMs) {
    return 'future'
  }
  if (rangeStartMs !== undefined && t < rangeStartMs) {
    return 'past-out'
  }
  if (rangeEndMs !== undefined && t > rangeEndMs) {
    return 'past-out'
  }
  return 'in-range'
}
const yearData = computed(() => {
  const d = data.value.filter((d) => {
    return d.date.getTime() >= gridStartDate.getTime()
  })

  const da = years.map((date) => {
    const day = d.find((d) => {
      return d.date.getTime() === date.getTime()
    })
    return {
      date,
      duration: day?.duration ?? 0,
      state: classifyDate(date),
    }
  })
  return da
})

const latestWeekDate = computed(() => {
  return yearData.value.at(-1)?.date || new Date()
})

const hasData = computed(() => yearData.value.some(d => d.duration > 0))

const t = useI18N()

// Pre-compute the duration → colour mapping outside the fill function
// so each cell render doesn't rebuild a d3 scale. The 6-quantile palette
// matches the legacy implementation; the input domain is normalised to
// [0, 1] against the max in-range duration so a quiet day still reads.
const COLOR_RAMP = [0, 0.2, 0.4, 0.6, 0.8, 1].map(d3.interpolateRgb('#5AF2', '#2AF'))
const maxDuration = computed(() => {
  let max = 0
  for (const d of yearData.value) {
    if (d.state === 'in-range' && d.duration > max) {
      max = d.duration
    }
  }
  return max
})
function colourFor(d: { duration: number, state: CellState }): string {
  if (d.state === 'future') {
    return 'var(--ct-cal-future)'
  }
  if (d.state === 'past-out') {
    // Diagonal-stripe pattern defined in the hidden <defs> below.
    // Reads as a "muted, but still active in calendar terms" texture
    // so past cells outside the active window stand apart from the
    // solid-coloured future cells without competing with the in-range
    // duration ramp.
    return 'url(#ct-cal-stripe)'
  }
  if (d.duration <= 0 || maxDuration.value <= 0) {
    return 'var(--ct-cal-empty)'
  }
  const norm = Math.min(1, d.duration / maxDuration.value)
  const idx = Math.min(COLOR_RAMP.length - 1, Math.floor(norm * COLOR_RAMP.length))
  return COLOR_RAMP[idx]!
}

const options = computed(() => ({
  width: 800,
  height: 140,
  x: {
    axis: null,
    tickSize: 0,
  },
  y: {
    tickSize: 0,
    tickFormat: Plot.formatWeekday('en'),
  },
  marks: [
    Plot.cell(yearData.value, {
      fill: (d: { duration: number, state: CellState }) => colourFor(d),
      x: (d) => {
        return getWeekDifference(d.date, latestWeekDate.value)
      },
      y: d => d.date.getUTCDay(),
      tip: {
        channels: {
          date: {
            label: t.value.plot.label.date,
            value: d => d.date.toISOString().slice(0, 10),
          },
          duration: {
            label: t.value.plot.label.duration,
            value: d => getDurationString(d.duration * 60 * 1000),
          },
        },
        format: {
          fill: false,
          x: false,
          y: false,
        },
      },
      rx: 2,
      ry: 2,
      stroke: 'var(--ct-cal-stroke)',
      strokeOpacity: 1,
      inset: 1,
    }),
  ],
}))
</script>

<template>
  <div class="year-cal" :data-empty="!hasData">
    <!-- Hidden SVG hosting the <defs> for cells that need pattern fills.
         Kept outside <PoltCalendar> because Observable Plot generates
         the chart SVG on every render and doesn't expose a defs hook —
         a sibling SVG keeps the pattern referenceable by `url(#…)`
         from any other SVG in the same document. -->
    <svg class="cal-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <pattern
          id="ct-cal-stripe"
          patternUnits="userSpaceOnUse"
          :width="4"
          :height="4"
          patternTransform="rotate(-45)"
        >
          <rect width="4" height="4" fill="var(--ct-cal-out)" />
          <rect width="1.4" height="4" fill="var(--ct-cal-empty)" />
        </pattern>
      </defs>
    </svg>
    <PoltCalendar :options="options" />
    <div v-if="!hasData" class="year-cal__hint">
      <span>NO ACTIVITY · LAST 365 DAYS</span>
    </div>
  </div>
</template>

<style scoped>
.year-cal {
  position: relative;
}
.cal-defs {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
  overflow: hidden;
}
.year-cal[data-empty="true"] :deep(.plot) {
  opacity: 0.55;
}
.year-cal__hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-size: var(--ct-text-xs, 12px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ct-fg-subtle);
  font-family: var(--ct-font-mono);
}
</style>
