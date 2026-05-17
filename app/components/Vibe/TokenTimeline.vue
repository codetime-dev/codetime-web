<script setup lang="ts">
import type { PlotOptions } from '@observablehq/plot'
import type { VibeTokenBucket } from './types'
import * as Plot from '@observablehq/plot'
import { computed } from 'vue'
import { compactParts, fmtUsd } from './types'

// Cost-per-bucket bar timeline. We plot estimated USD rather than raw
// token counts — output tokens dominate the spend and the chart needs
// to reflect "where did the money go", not "where were tokens used".
// Header strip shows the three numbers a Vibe user actually cares
// about: total cost, model calls, cache hit rate.

const props = defineProps<{
  buckets: VibeTokenBucket[]
  // Matches the dashboard payload's `bucket` field — used to size the
  // rectY interval so bars meet end-to-end on a continuous time axis.
  bucket?: 'hour' | 'day' | 'week'
}>()

const totals = computed(() => {
  let cost = 0
  let modelCalls = 0
  let cached = 0
  let fresh = 0
  let tokens = 0
  for (const b of props.buckets) {
    cost += b.estimatedCostUsd
    modelCalls += b.modelCalls
    cached += b.cachedInputTokens
    fresh += Math.max(0, b.inputTokens - b.cachedInputTokens)
    tokens += b.inputTokens + b.outputTokens
  }
  const totalInput = cached + fresh
  return {
    cost,
    modelCalls,
    cacheHitRate: totalInput === 0 ? 0 : cached / totalInput,
    tokens,
  }
})

const rows = computed(() => props.buckets.map(b => ({
  ts: new Date(b.ts),
  cost: b.estimatedCostUsd,
})))

// rectY draws closed rectangles; on a continuous time axis it needs an
// `interval` so each bar gets a width (otherwise Plot falls back to a
// band scale and throws "utc !== band"). The interval also lets Plot
// fill gaps with zero-height bars so the timeline reads as a series.
const intervalFor = computed(() => {
  switch (props.bucket) {
    case 'hour': return 'hour'
    case 'week': return 'week'
    case 'day':
    default: return 'day'
  }
})

const options = computed<PlotOptions>(() => ({
  height: 240,
  marginLeft: 56,
  marginBottom: 28,
  marginTop: 12,
  marginRight: 12,
  x: { type: 'utc', label: null, ticks: 6 },
  y: {
    label: 'USD',
    grid: true,
    tickFormat: (d: number) => (d >= 1 ? `$${d.toFixed(0)}` : `$${d.toFixed(2)}`),
  },
  marks: [
    Plot.rectY(rows.value, {
      x: 'ts',
      y: 'cost',
      interval: intervalFor.value,
      fill: 'var(--ct-primary)',
      fillOpacity: 0.85,
      tip: true,
      title: (d: { ts: Date, cost: number }) =>
        `${d.ts.toISOString()}\n${fmtUsd(d.cost)}`,
    }),
    Plot.ruleY([0], { stroke: 'var(--ct-border-strong)' }),
  ],
}))
</script>

<template>
  <div class="timeline">
    <div class="timeline-meta">
      <div class="meta-cell">
        <span class="meta-label">cost</span>
        <span class="meta-value">{{ fmtUsd(totals.cost) }}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">model calls</span>
        <span class="meta-value">
          {{ compactParts(totals.modelCalls).value }}{{ compactParts(totals.modelCalls).unit ?? '' }}
        </span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">cache hit</span>
        <span class="meta-value">{{ (totals.cacheHitRate * 100).toFixed(0) }}%</span>
      </div>
    </div>
    <div class="timeline-chart">
      <PoltChart v-if="rows.length > 0" :options="options" />
      <div v-else class="empty">
        no model usage in this window
      </div>
    </div>
    <div v-if="rows.length > 0" class="timeline-foot">
      {{ rows.length }} buckets · {{ compactParts(totals.tokens).value }}{{ compactParts(totals.tokens).unit ?? '' }} tokens
    </div>
  </div>
</template>

<style scoped>
.timeline { display: flex; flex-direction: column; gap: 14px; }
.timeline-meta {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}
.meta-cell { display: flex; flex-direction: column; gap: 2px; }
.meta-label {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ct-fg-muted);
}
.meta-value {
  font-size: 18px;
  color: var(--ct-fg);
  font-variant-numeric: tabular-nums;
}
.timeline-chart { width: 100%; }
.empty {
  padding: 48px 0;
  text-align: center;
  color: var(--ct-fg-muted);
  font-size: 13px;
}
.timeline-foot {
  font-size: 11px;
  color: var(--ct-fg-muted);
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}
</style>
