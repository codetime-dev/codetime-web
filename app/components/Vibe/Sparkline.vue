<script setup lang="ts">
// Tiny bar sparkline. Lifted from agent-time/Sparkline.vue — kept
// dependency-free (inline SVG) so KPI rendering doesn't pull in
// Observable Plot for what is essentially a 28px-tall pictogram.

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    values: number[]
    color?: string
    height?: number
    width?: number
    fill?: boolean
  }>(),
  {
    color: 'var(--ct-primary)',
    height: 28,
    width: 220,
    fill: false,
  },
)

const bars = computed(() => {
  const values = props.values.length > 0 ? props.values : [0]
  const padding = 1
  const usableHeight = props.height - padding * 2
  const slot = props.width / values.length
  const gap = Math.min(2, slot * 0.18)
  const barWidth = Math.max(1, slot - gap)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const span = max - min || 1
  const zeroY = padding + ((max - 0) / span) * usableHeight

  return values.map((value, index) => {
    const yValue = padding + ((max - value) / span) * usableHeight
    const top = Math.min(zeroY, yValue)
    const height = Math.abs(zeroY - yValue)
    return {
      x: index * slot + (slot - barWidth) / 2,
      y: top,
      width: barWidth,
      height: Math.max(value === 0 ? 0 : 1, height),
    }
  })
})
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    aria-hidden="true"
    preserveAspectRatio="none"
    style="display: block; overflow: visible"
  >
    <rect
      v-for="(bar, index) in bars"
      :key="index"
      :x="bar.x"
      :y="bar.y"
      :width="bar.width"
      :height="bar.height"
      :fill="color"
      :fill-opacity="fill ? 0.85 : 1"
    />
  </svg>
</template>
