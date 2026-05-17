<script setup lang="ts">
import type { VibeModelRow } from './types'
import { computed } from 'vue'
import { compactParts, fmtDurationShort, fmtUsd } from './types'

// Per-model cost breakdown. Rows are sorted server-side by descending
// cost; the bar visualises share of total spend across models so the
// "which model is eating my budget" question is one glance away.

const props = defineProps<{ rows: VibeModelRow[] }>()

const totalCost = computed(() => props.rows.reduce((s, r) => s + r.estimatedCostUsd, 0))

const view = computed(() => {
  const max = Math.max(1, ...props.rows.map(r => r.estimatedCostUsd))
  return props.rows.map((row, index) => {
    const cacheHit = row.inputTokens > 0 ? row.cachedInputTokens / row.inputTokens : 0
    return {
      index: String(index + 1).padStart(2, '0'),
      model: row.model,
      cost: row.estimatedCostUsd,
      sharePct: totalCost.value > 0 ? (row.estimatedCostUsd / totalCost.value) * 100 : 0,
      widthPct: max > 0 ? (row.estimatedCostUsd / max) * 100 : 0,
      modelCalls: row.modelCalls,
      cacheHit,
      durationMs: row.durationMs,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
    }
  })
})
</script>

<template>
  <ul class="rows">
    <li class="row head">
      <span />
      <span class="hcell">MODEL</span>
      <span class="hcell" />
      <span class="hcell num">COST</span>
      <span class="hcell num">SHARE</span>
      <span class="hcell num">CALLS</span>
      <span class="hcell num">CACHE</span>
      <span class="hcell num">IN/OUT</span>
      <span class="hcell num">TIME</span>
    </li>
    <li
      v-for="row in view"
      :key="row.model"
      class="row"
    >
      <span class="idx">{{ row.index }}</span>
      <span class="name" :title="row.model">{{ row.model }}</span>
      <span class="bar-wrap">
        <span class="bar" :style="{ width: `${row.widthPct}%` }" />
      </span>
      <span class="num cost">{{ fmtUsd(row.cost) }}</span>
      <span class="num share">{{ row.sharePct.toFixed(1) }}%</span>
      <span class="num calls">
        {{ compactParts(row.modelCalls).value }}{{ compactParts(row.modelCalls).unit ?? '' }}
      </span>
      <span class="num hit">{{ (row.cacheHit * 100).toFixed(0) }}%</span>
      <span class="num io">
        {{ compactParts(row.inputTokens).value }}{{ compactParts(row.inputTokens).unit ?? '' }} /
        {{ compactParts(row.outputTokens).value }}{{ compactParts(row.outputTokens).unit ?? '' }}
      </span>
      <span class="num time">{{ fmtDurationShort(row.durationMs) }}</span>
    </li>
    <li v-if="view.length === 0" class="empty">
      — no model usage in window —
    </li>
  </ul>
</template>

<style scoped>
.rows { list-style: none; margin: 0; padding: 0; }

.row {
  display: grid;
  grid-template-columns: 28px 1.5fr 1.4fr 80px 56px 60px 50px 110px 70px;
  gap: 10px;
  align-items: center;
  padding: 8px 6px;
  margin: 0 -6px;
  border-bottom: 1px solid var(--ct-border-subtle);
  font-size: 13px;
}
.row:not(.head):hover { background: var(--ct-surface-1); }
.row:last-child { border-bottom: none; }
.row.head {
  border-bottom: 1px solid var(--ct-border);
  padding-bottom: 8px;
}

.hcell {
  font-size: 11px;
  color: var(--ct-fg-muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.hcell.num { text-align: right; }

.idx { color: var(--ct-fg-subtle); font-variant-numeric: tabular-nums; }
/* Model id (e.g. claude-opus-4-7) is an identifier — mono helps it
   line up next to its sibling rows and reads as code. */
.name {
  color: var(--ct-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--ct-font-mono);
  font-size: 12.5px;
}

.bar-wrap {
  position: relative;
  height: 10px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: 2px;
}
.bar {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: var(--ct-primary);
  border-radius: 1px;
}

.num { text-align: right; font-variant-numeric: tabular-nums; }
.cost { color: var(--ct-primary); }
.share, .hit, .calls, .time, .io { color: var(--ct-fg-muted); }

.empty {
  text-align: center;
  color: var(--ct-fg-muted);
  padding: 24px 0;
}

@media (max-width: 980px) {
  .row { grid-template-columns: 28px minmax(112px, 1fr) minmax(52px, 0.8fr) 70px 56px 50px 50px; }
  .row > :nth-child(8),
  .row > :nth-child(9) { display: none; }
}

@media (max-width: 700px) {
  .row { grid-template-columns: 28px minmax(96px, 1fr) minmax(44px, 0.7fr) 70px 56px; }
  .row > :nth-child(6),
  .row > :nth-child(7),
  .row > :nth-child(8),
  .row > :nth-child(9) { display: none; }
}
</style>
