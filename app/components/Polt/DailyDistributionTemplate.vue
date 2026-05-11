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

const smoothing = computed(() => Math.max(1, Math.round(60 / props.interval)))

const options = computed<Plot.PlotOptions>(() => {
  return {
    w: width.value,
    h: height.value,
    className: 'y-dot-plot',
    marginTop: 16,
    marginRight: 12,
    marginLeft: 12,
    marginBottom: 28,
    style: {
      background: 'transparent',
    },
    y: {
      grid: true,
      axis: null,
      domain: [0, 1.05],
      label: null,
    },
    x: {
      tickFormat: (d: number) => {
        const hour = Math.floor(d / 60)
        return `${hour.toString().padStart(2, '0')}:00`
      },
      ticks: 6,
      label: null,
      domain: [0, 1440],
    },
    marks: [
      // Historical periods: thin monochrome ladder, fading into background.
      ...(props.segmentedData.length > 0
        ? props.segmentedData.flatMap(segment => [
            Plot.lineY(segment.data, Plot.windowY(smoothing.value, {
              x: 'time',
              y: 'ratio',
              stroke: 'var(--ct-fg-subtle)',
              opacity: segment.opacity * 0.45,
              strokeWidth: 1,
              curve: 'monotone-x',
            })),
          ])
        : []
      ),
      // Summary: soft tinted area + crisp primary line.
      ...(props.summaryData.length > 0
        ? [
            Plot.areaY(props.summaryData, Plot.windowY(smoothing.value, {
              x: 'time',
              y: 'ratio',
              fill: 'var(--ct-primary)',
              fillOpacity: 0.08,
              curve: 'monotone-x',
            })),
            Plot.lineY(props.summaryData, Plot.windowY(smoothing.value, {
              x: 'time',
              y: 'ratio',
              stroke: 'var(--ct-primary)',
              strokeWidth: 2,
              strokeLinecap: 'round',
              curve: 'monotone-x',
            })),
          ]
        : []
      ),
      // Fallback display when no aggregated data is available.
      ...(props.segmentedData.length === 0 && props.summaryData.length === 0
        ? [
            Plot.areaY(props.fallbackData, Plot.windowY(smoothing.value, {
              x: 'time',
              y: 'ratio',
              fill: 'var(--ct-primary)',
              fillOpacity: 0.06,
              curve: 'monotone-x',
            })),
            Plot.lineY(props.fallbackData, Plot.windowY(smoothing.value, {
              x: 'time',
              y: 'ratio',
              stroke: 'var(--ct-primary)',
              strokeWidth: 1.75,
              curve: 'monotone-x',
            })),
          ]
        : []
      ),
      // Current-time marker — dashed hairline with quiet label.
      Plot.ruleX([currentTime.value], {
        stroke: 'var(--ct-fg-muted)',
        strokeWidth: 1,
        strokeDasharray: '3 3',
        opacity: 0.7,
      }),
      Plot.text([{ x: currentTime.value, y: 1.02, label: currentTimeLabel.value }], {
        x: 'x',
        y: 'y',
        text: 'label',
        fill: 'var(--ct-fg-muted)',
        stroke: 'var(--ct-surface)',
        strokeWidth: 4,
        fontSize: 11,
        fontVariant: 'tabular-nums',
        dx: currentTime.value < 720 ? 6 : -6,
        textAnchor: currentTime.value < 720 ? 'start' : 'end',
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
