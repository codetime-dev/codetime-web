<script setup lang="ts">
import * as Plot from '@observablehq/plot'

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

const completeData = computed(() => {
  const dataMap = new Map<string, number>()

  // Fill existing data
  for (const d of props.data) {
    const key = `${d.date.toISOString().slice(0, 10)}_${d.by}`
    dataMap.set(key, d.duration)
  }

  // Generate complete data with 0 values for missing combinations
  const result: { date: Date, duration: number, by?: string }[] = []
  for (const dateStr of differentLabel.value.differentDates) {
    for (const by of differentLabel.value.differentLanguages) {
      const key = `${dateStr}_${by}`
      const duration = dataMap.get(key) || 0
      result.push({
        date: new Date(dateStr),
        duration,
        by,
      })
    }
  }

  return result
})
const chart = ref()
const { width, height } = useElementBounding(chart)
const maxR = computed(() => {
  const dateCount = differentLabel.value.differentDates.size
  const languageCount = differentLabel.value.differentLanguages.size
  const widthFactor = (width.value - 100) / dateCount * 1.25
  const heightFactor = height.value / languageCount
  const calculatedValue = Math.min(widthFactor, heightFactor) * 0.5
  return calculatedValue > 0 ? calculatedValue : 20
})

const options = computed<Plot.PlotOptions>(() => {
  const o: Plot.PlotOptions = {
    className: 'y-dot-plot',
    color: {
      range: ['#5AF2', '#2AF'],
      interpolate: 'hcl',
    },
    marginRight: 24,
    y: {
      grid: true,
      ariaLabel: props.yLabel,
      label: props.yLabel,
      axis: false,
    },
    x: {
      tickSize: 4,
      insetRight: maxR.value,
      insetLeft: maxR.value,
      label: t.value.plot.label.date,
      ticks: Math.max(3, Math.min(10, Math.floor(width.value / 120))),
      interval: 'day',
    },
    r: { range: [0, maxR.value] },
    marks: [
      Plot.rect(
        completeData.value,
        {
          x: 'date',
          y: 'by',
          fill: 'duration',
          r: 999,
          tip: {
            stroke: '#404040',
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
                value: d => d.date.toISOString().slice(0, 10),
              },
            },
            format: {
              fill: false,
              r: false,
              x: false,
              y: false,
            },
          },
          pointerEvents: 'auto',
        },

      ),
      Plot.axisY({
        anchor: 'right',
        textAnchor: 'end',
        textStroke: 'var(--r-surface-background-color)',
        textStrokeWidth: 4,
        ariaLabel: t.value.plot.label.language,
        tickFormat: (d: string) => getLanguageName(d),
        tickPadding: -8,
        tickSize: 4,
      }),
      Plot.axisY({
        anchor: 'left',
        tickSize: 0,
        tickFormat: () => '',
        label: null,
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
