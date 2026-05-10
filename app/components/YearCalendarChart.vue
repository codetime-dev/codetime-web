<script setup lang="ts">
import * as d3 from 'd3'

const props = withDefaults(defineProps<{
  data: MaybeRef<{
    date: Date
    duration: number
  }[]>
  endDate?: Date
}>(), {
  endDate: () => new Date(),
})
const data = computed(() => {
  return unref(props.data)
})
const yearStartDate = d3.utcDay.offset(props.endDate, -365)
const years = d3.utcDay.range(yearStartDate, props.endDate)
const yearData = computed(() => {
  const d = data.value.filter((d) => {
    return d.date.getTime() >= yearStartDate.getTime()
  })

  const da = years.map((date) => {
    const day = d.find((d) => {
      return d.date.getTime() === date.getTime()
    })
    return {
      date,
      duration: day?.duration ?? 0,
    }
  })
  return da
})

const latestWeekDate = computed(() => {
  return yearData.value.at(-1)?.date || new Date()
})

const hasData = computed(() => yearData.value.some(d => d.duration > 0))

const t = useI18N()
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
  color: {
    interpolate: (d: number) => {
      if (d === 0) {
        return 'var(--ct-cal-empty)'
      }
      return d3.scaleQuantile([0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.2, 0.4, 0.6, 0.8, 1].map(d3.interpolateRgb('#5AF2', '#2AF')))(d)
    },
  },
  marks: [
    Plot.cell(yearData.value, {
      fill: 'duration',
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
