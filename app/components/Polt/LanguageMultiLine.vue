<script setup lang="ts">
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'

const props = defineProps<{
  data: {
    date: Date
    duration: number
    by: string
  }[]
}>()
const t = useI18N()

// Restrained categorical palette — Observable10 with reduced saturation.
const palette = [
  '#4269d0',
'#efb118',
'#ff725c',
'#6cc5b0',
'#3ca951',
  '#ff8ab7',
'#a463f2',
'#97bbf5',
'#9c6b4e',
'#9498a0',
]

const options = computed<Plot.PlotOptions>(() => ({
  marginTop: 16,
  marginRight: 32,
  marginLeft: 16,
  marginBottom: 28,
  color: {
    range: palette,
    legend: false,
  },
  y: {
    grid: true,
    nice: true,
    axis: 'right',
    label: null,
    ticks: 5,
    tickFormat: (d: number) => d3.format(',d')(d / 60 / 60 / 1000),
  },
  x: {
    label: null,
    ticks: 6,
  },
  marks: [
    Plot.ruleY([0], { stroke: 'var(--ct-border)', strokeWidth: 1 }),
    Plot.line(props.data, {
      x: 'date',
      y: 'duration',
      stroke: 'by',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      curve: 'monotone-x',
    }),
    Plot.dot(props.data, Plot.pointer({
      x: 'date',
      y: 'duration',
      fill: 'by',
      stroke: 'var(--ct-surface)',
      strokeWidth: 1.5,
      r: 4,
      tip: {
        fontSize: 12,
        channels: {
          by: {
            label: t.value.plot.label.language,
            value: d => getLanguageName(d.by),
          },
          duration: {
            label: t.value.plot.label.duration,
            value: d => getDurationString(d.duration),
          },
          date: {
            label: t.value.plot.label.date,
            value: d => d.date.toISOString().slice(0, 10),
          },
        },
        format: { fill: false, x: false, y: false },
      },
    })),
  ],
}))
</script>

<template>
  <PoltChart :options="options" />
</template>
