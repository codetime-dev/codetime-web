<script setup lang="ts">
import * as Plot from '@observablehq/plot'

type DataPoint = {
  time: number
  ratio: number
}

type SegmentData = {
  period: string
  data: DataPoint[]
  opacity: number
}

const props = withDefaults(defineProps<{
  segmentedData?: SegmentData[]
  summaryData?: DataPoint[]
  fallbackData?: DataPoint[]
  interval?: number
  loading?: boolean
}>(), {
  segmentedData: () => [],
  summaryData: () => [],
  fallbackData: () => [],
  interval: 10,
  loading: false,
})

const t = useI18N()

const currentTime = computed(() => {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
})

const currentTimeLabel = computed(() => {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

const chart = ref()
const { width, height } = useElementBounding(chart)

const options = computed<Plot.PlotOptions>(() => {
  return {
    w: width.value,
    h: height.value,
    className: 'y-dot-plot',
    color: {
      scheme: 'Warm',
    },
    marginRight: 24,
    y: {
      grid: true,
      axis: 'right',
      domain: [0, 1],
    },
    x: {
      tickFormat: (d: number) => {
        const hour = Math.floor(d / 60)
        const minute = d % 60
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      },
      label: t.value.plot.label.date,
    },
    marks: [
      // Segmented data lines (lower opacity)
      ...(props.segmentedData.length > 0
        ? props.segmentedData.flatMap(segment => [
            Plot.lineY(segment.data, Plot.windowY(60 / props.interval, {
              x: 'time',
              y: 'ratio',
              stroke: 'var(--color-primary-1)',
              opacity: segment.opacity,
              strokeWidth: 1.5,
            })),
          ])
        : []
      ),
      // Summary data line (success color, more prominent)
      ...(props.summaryData.length > 0
        ? [
            Plot.lineY(props.summaryData, Plot.windowY(60 / props.interval, {
              x: 'time',
              y: 'ratio',
              stroke: 'var(--color-success-1)',
              strokeWidth: 4,
              opacity: 1,
            })),
          ]
        : []
      ),
      // Fallback to original display (if no segmented data)
      ...(props.segmentedData.length === 0 && props.summaryData.length === 0
        ? [
            Plot.dot(props.fallbackData, {
              x: 'time',
              y: 'ratio',
              opacity: 0.1,
            }),
            Plot.lineY(props.fallbackData, Plot.windowY(60 / props.interval, { x: 'time', y: 'ratio', stroke: 'var(--color-primary-1)' })),
          ]
        : []
      ),
      // Current time marker
      Plot.ruleX([currentTime.value], {
        stroke: 'var(--color-error-1)',
        strokeWidth: 2,
        opacity: 0.8,
      }),
      Plot.text([{ x: currentTime.value, y: 0.95, label: `${t.value.plot.label.currentTime} (${currentTimeLabel.value})` }], {
        x: 'x',
        y: 'y',
        text: 'label',
        fill: 'var(--color-error-1)',
        stroke: 'var(--r-surface-background-color)',
        fontSize: 12,
        dx: currentTime.value < 600 ? 5 : -5,
        textAnchor: currentTime.value < 600 ? 'start' : 'end',
      }),
    ],
  }
})
</script>

<template>
  <div class="px-3 py-3 relative">
    <PoltChart
      ref="chart"
      :options="options"
    />
    <div
      v-if="loading"
      class="bg-ct-surface-2 inset-0 absolute animate-pulse"
    />
  </div>
</template>
