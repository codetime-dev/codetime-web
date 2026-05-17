<script setup lang="ts">
import type { VibeProjectRow } from './types'
import { computed } from 'vue'
import { compactParts, fmtDurationShort, fmtUsd } from './types'

// Top-N project leaderboard ranked by estimated cost. Each row gets a
// horizontal bar whose width is relative to the top project — same
// visual idiom as agent-time, just minus the per-source colour
// segments (our dashboard endpoint doesn't break down by source).

const props = defineProps<{ rows: VibeProjectRow[] }>()

const TOP = 12

const totalCost = computed(() => props.rows.reduce((s, r) => s + r.estimatedCostUsd, 0))

const view = computed(() => {
  const rows = props.rows.slice(0, TOP)
  const max = Math.max(1, ...rows.map(r => r.estimatedCostUsd))
  return rows.map((row, index) => ({
    index: String(index + 1).padStart(2, '0'),
    project: row.project,
    total: row.totalTokens,
    cacheHit: row.inputTokens > 0 ? row.cachedInputTokens / row.inputTokens : 0,
    sharePct: totalCost.value > 0 ? (row.estimatedCostUsd / totalCost.value) * 100 : 0,
    widthPct: max > 0 ? (row.estimatedCostUsd / max) * 100 : 0,
    modelCalls: row.modelCalls,
    sessions: row.sessions,
    cost: row.estimatedCostUsd,
    agentDurationMs: row.agentDurationMs,
  }))
})
</script>

<template>
  <ul class="rows">
    <li class="row head">
      <span />
      <span class="hcell">PROJECT</span>
      <span class="hcell" />
      <span class="hcell num">COST</span>
      <span class="hcell num">SHARE</span>
      <span class="hcell num">TOKENS</span>
      <span class="hcell num">CACHE</span>
      <span class="hcell num">CALLS</span>
      <span class="hcell num">TIME</span>
    </li>
    <li
      v-for="row in view"
      :key="row.project"
      class="row"
    >
      <span class="idx">{{ row.index }}</span>
      <span class="name" :title="row.project">{{ row.project }}</span>
      <span class="bar-wrap">
        <span class="bar" :style="{ width: `${row.widthPct}%` }" />
      </span>
      <span class="num cost">{{ fmtUsd(row.cost) }}</span>
      <span class="num share">{{ row.sharePct.toFixed(1) }}%</span>
      <span class="num tokens">
        {{ compactParts(row.total).value }}{{ compactParts(row.total).unit ?? '' }}
      </span>
      <span class="num hit">{{ (row.cacheHit * 100).toFixed(0) }}%</span>
      <span class="num calls">
        {{ compactParts(row.modelCalls).value }}{{ compactParts(row.modelCalls).unit ?? '' }}
      </span>
      <span class="num time">{{ fmtDurationShort(row.agentDurationMs) }}</span>
    </li>
    <li v-if="view.length === 0" class="empty">
      — no project token data in window —
    </li>
  </ul>
</template>

<style scoped>
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 28px 1.25fr 1.6fr 80px 56px 64px 50px 60px 66px;
  gap: 10px;
  align-items: center;
  padding: 8px 6px;
  margin: 0 -6px;
  border-bottom: 1px solid var(--ct-border-subtle);
  font-size: 13px;
  transition: background 120ms ease;
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
.name {
  color: var(--ct-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  transition: width 400ms ease;
  border-radius: 1px;
}

.num { text-align: right; font-variant-numeric: tabular-nums; }
.tokens { color: var(--ct-fg); }
.cost   { color: var(--ct-primary); }
.share  { color: var(--ct-fg-muted); }
.hit    { color: var(--ct-fg-muted); }
.calls  { color: var(--ct-fg-muted); }
.time   { color: var(--ct-fg-muted); }

.empty {
  text-align: center;
  color: var(--ct-fg-muted);
  padding: 24px 0;
}

@media (max-width: 980px) {
  .row {
    grid-template-columns: 28px minmax(112px, 1fr) minmax(52px, 0.8fr) 70px 52px 60px 50px;
  }
  .row > :nth-child(8),
  .row > :nth-child(9) { display: none; }
}

@media (max-width: 700px) {
  .row {
    grid-template-columns: 28px minmax(96px, 1fr) minmax(44px, 0.7fr) 70px 62px;
  }
  .row > :nth-child(5),
  .row > :nth-child(7),
  .row > :nth-child(9) { display: none; }
}
</style>
