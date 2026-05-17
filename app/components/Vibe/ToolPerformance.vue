<script setup lang="ts">
import type { VibeToolRow } from './types'
import { computed } from 'vue'
import { compactParts, fmtDurationShort } from './types'

const props = defineProps<{ rows: VibeToolRow[] }>()

const view = computed(() => {
  const max = Math.max(1, ...props.rows.map(r => r.calls))
  return props.rows.map((row, index) => {
    const failureRate = row.calls > 0 ? row.failures / row.calls : 0
    return {
      index: String(index + 1).padStart(2, '0'),
      tool: row.tool,
      calls: row.calls,
      failures: row.failures,
      failureRate,
      avgMs: row.avgDurationMs,
      totalMs: row.totalDurationMs,
      widthPct: max > 0 ? (row.calls / max) * 100 : 0,
    }
  })
})
</script>

<template>
  <ul class="rows">
    <li class="row head">
      <span />
      <span class="hcell">TOOL</span>
      <span class="hcell" />
      <span class="hcell num">CALLS</span>
      <span class="hcell num">FAIL%</span>
      <span class="hcell num">AVG</span>
      <span class="hcell num">TOTAL</span>
    </li>
    <li
      v-for="row in view"
      :key="row.tool"
      class="row"
    >
      <span class="idx">{{ row.index }}</span>
      <span class="name" :title="row.tool">{{ row.tool }}</span>
      <span class="bar-wrap">
        <span class="bar" :style="{ width: `${row.widthPct}%` }" />
      </span>
      <span class="num calls">
        {{ compactParts(row.calls).value }}{{ compactParts(row.calls).unit ?? '' }}
      </span>
      <span class="num" :class="{ bad: row.failureRate > 0.05 }">
        {{ (row.failureRate * 100).toFixed(1) }}%
      </span>
      <span class="num">{{ fmtDurationShort(row.avgMs) }}</span>
      <span class="num">{{ fmtDurationShort(row.totalMs) }}</span>
    </li>
    <li v-if="view.length === 0" class="empty">
      — no tool calls in window —
    </li>
  </ul>
</template>

<style scoped>
.rows { list-style: none; margin: 0; padding: 0; }

.row {
  display: grid;
  grid-template-columns: 28px 1.5fr 2fr 70px 60px 70px 70px;
  gap: 10px;
  align-items: center;
  padding: 8px 6px;
  margin: 0 -6px;
  border-bottom: 1px solid var(--ct-border-subtle);
  font-size: 13px;
}
.row:not(.head):hover { background: var(--ct-surface-1); }
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
/* Tool name (Bash/Read/Edit/...) is an identifier — keep mono. */
.name {
  color: var(--ct-fg);
  font-family: var(--ct-font-mono);
  font-size: 12.5px;
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
  border-radius: 1px;
}

.num { text-align: right; font-variant-numeric: tabular-nums; color: var(--ct-fg-muted); }
.calls { color: var(--ct-fg); }
.bad { color: var(--ct-danger); }

.empty {
  text-align: center;
  color: var(--ct-fg-muted);
  padding: 24px 0;
}

@media (max-width: 700px) {
  .row { grid-template-columns: 28px minmax(96px, 1fr) minmax(44px, 0.7fr) 60px 50px; }
  .row > :nth-child(6),
  .row > :nth-child(7) { display: none; }
}
</style>
