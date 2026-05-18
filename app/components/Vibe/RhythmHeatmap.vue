<script setup lang="ts">
import type { VibeHeatmapCell } from './types'
import { computed } from 'vue'
import { compactParts, fmtUsd } from './types'

// Hour × weekday heatmap of estimated agent cost. Color intensity is
// log-scaled so a few high-spend cells don't flatten the rest of the
// grid to invisibility. Adapted from agent-time/RhythmHeatmap.vue with
// the same four summary tiles (peak hour, peak day, active slots,
// avg/slot) below the grid.

const props = defineProps<{ cells: VibeHeatmapCell[] }>()

const t = useI18N()
const L = computed(() => t.value.dashboard.agent?.labels?.rhythm)
const locale = useLocale()

const HOURS = 24
const DAYS = 7
// Data is indexed Mon=0..Sun=6 (see VibeHeatmapCell.weekday). DAY_LABELS
// shares that indexing; the visible column order is reordered below per
// the active locale's first-day-of-week convention.
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// Locales known to start the week on Sunday. Used as a fallback when
// the runtime lacks Intl.Locale week-info support (older Firefox, etc.).
const SUN_FIRST_LOCALES = new Set(['en', 'ja', 'pt-BR', 'zh-TW', 'ko', 'he'])

// Returns the weekday index (Mon=0..Sun=6) of the first column.
function firstDayIdx(loc: string): number {
  try {
    const intlLocale = new Intl.Locale(loc) as Intl.Locale & {
      weekInfo?: { firstDay?: number }
      getWeekInfo?: () => { firstDay?: number }
    }
    const info = intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo
    const iso = info?.firstDay // 1=Mon..7=Sun
    if (iso && iso >= 1 && iso <= 7) {
      return (iso - 1) % 7
    }
  }
  catch {
    // Intl.Locale unsupported — fall through to the static table.
  }
  return SUN_FIRST_LOCALES.has(loc) ? 6 : 0
}

const displayOrder = computed<number[]>(() => {
  const start = firstDayIdx(locale.value)
  return Array.from({ length: DAYS }, (_, i) => (start + i) % DAYS)
})

type Built = {
  grid: number[][]
  calls: number[][]
  max: number
  total: number
  hourTotals: number[]
  dayTotals: number[]
  hourCalls: number[]
  dayCalls: number[]
}

function makeRow(length: number): number[] {
  return Array.from({ length }).fill(0)
}

// Cell intensity is driven by `count` (model call volume) instead of
// `estimatedCostUsd` because `agent_time_buckets.estimated_cost_micros`
// is CLI-stamped and frequently zero — using it produced a heatmap
// with all-or-nothing cells. Cost still rides along for the tooltip
// and the peak-hour/peak-day summary tiles.
function build(cells: VibeHeatmapCell[]): Built {
  const grid: number[][] = Array.from({ length: DAYS }, () => makeRow(HOURS))
  const costs: number[][] = Array.from({ length: DAYS }, () => makeRow(HOURS))
  const hourTotals = makeRow(HOURS)
  const dayTotals = makeRow(DAYS)
  const hourCost = makeRow(HOURS)
  const dayCost = makeRow(DAYS)
  let total = 0
  for (const cell of cells) {
    if (cell.weekday < 0 || cell.weekday > 6 || cell.hour < 0 || cell.hour > 23) {
      continue
    }
    const calls = cell.count
    const cost = cell.estimatedCostUsd
    grid[cell.weekday]![cell.hour] = (grid[cell.weekday]![cell.hour] ?? 0) + calls
    costs[cell.weekday]![cell.hour] = (costs[cell.weekday]![cell.hour] ?? 0) + cost
    hourTotals[cell.hour] = (hourTotals[cell.hour] ?? 0) + calls
    dayTotals[cell.weekday] = (dayTotals[cell.weekday] ?? 0) + calls
    hourCost[cell.hour] = (hourCost[cell.hour] ?? 0) + cost
    dayCost[cell.weekday] = (dayCost[cell.weekday] ?? 0) + cost
    total += calls
  }
  let max = 0
  for (const row of grid) {
    for (const value of row) {
      if (value > max) {
        max = value
      }
    }
  }
  return {
    grid,
    calls: costs, // alias kept so the tooltip lookup below still resolves
    max: max || 1,
    total,
    hourTotals,
    dayTotals,
    hourCalls: hourCost,
    dayCalls: dayCost,
  }
}

const built = computed(() => build(props.cells))

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

type Peak = { label: string, value: number, calls: number }

const peakHour = computed<Peak>(() => {
  const totals = built.value.hourTotals
  let max = 0
  let idx = 0
  for (let i = 0; i < HOURS; i += 1) {
    const v = totals[i] ?? 0
    if (v > max) {
      max = v
      idx = i
    }
  }
  return { label: `${pad(idx)}:00`, value: max, calls: built.value.hourCalls[idx] ?? 0 }
})

const peakDay = computed<Peak>(() => {
  const totals = built.value.dayTotals
  let max = 0
  let idx = 0
  for (let i = 0; i < DAYS; i += 1) {
    const v = totals[i] ?? 0
    if (v > max) {
      max = v
      idx = i
    }
  }
  return { label: DAY_LABELS[idx] ?? '', value: max, calls: built.value.dayCalls[idx] ?? 0 }
})

const activeHours = computed(() => built.value.hourTotals.filter(v => v > 0).length)
const activeDays = computed(() => built.value.dayTotals.filter(v => v > 0).length)
const avgPerActiveSlot = computed(() => {
  let activeSlots = 0
  for (const row of built.value.grid) {
    for (const value of row) {
      if (value > 0) {
 activeSlots += 1
}
    }
  }
  return activeSlots === 0 ? 0 : built.value.total / activeSlots
})

function intensity(value: number): number {
  if (value === 0) {
 return 0
}
  const max = built.value.max
  if (max <= 1) {
 return value > 0 ? 1 : 0
}
  return Math.min(1, Math.log10(value + 1) / Math.log10(max + 1))
}

const HOUR_LABELS = Array.from({ length: HOURS }, (_, hour) => hour)
</script>

<template>
  <div class="heatmap">
    <div class="grid">
      <div class="corner" />
      <div
        v-for="hour in HOUR_LABELS"
        :key="`hcol-${hour}`"
        class="hour-label"
        :class="{ visible: hour % 3 === 0 }"
      >
        {{ hour % 3 === 0 ? pad(hour) : "" }}
      </div>

      <template
        v-for="dayIdx in displayOrder"
        :key="`d-${dayIdx}`"
      >
        <div class="day-label">
          {{ DAY_LABELS[dayIdx] }}
        </div>
        <div
          v-for="(value, hour) in (built.grid[dayIdx] ?? [])"
          :key="`c-${dayIdx}-${hour}`"
          class="cell"
          :style="{ '--i': intensity(value) }"
          :class="{ empty: value === 0 }"
          :title="`${DAY_LABELS[dayIdx]} ${pad(hour)}:00 · ${compactParts(value).value} calls · ${fmtUsd(built.calls[dayIdx]?.[hour] ?? 0)}`"
        />
      </template>
    </div>

    <ul class="summary">
      <li>
        <span class="lbl">{{ L?.peakHour ?? 'Peak hour' }}</span>
        <span class="val">{{ peakHour.label }}</span>
        <span class="sub">{{ compactParts(peakHour.value).value }} {{ L?.calls ?? 'calls' }} · {{ fmtUsd(peakHour.calls) }}</span>
      </li>
      <li>
        <span class="lbl">{{ L?.peakDay ?? 'Peak day' }}</span>
        <span class="val">{{ peakDay.label }}</span>
        <span class="sub">{{ compactParts(peakDay.value).value }} {{ L?.calls ?? 'calls' }} · {{ fmtUsd(peakDay.calls) }}</span>
      </li>
      <li>
        <span class="lbl">{{ L?.active ?? 'Active' }}</span>
        <span class="val">{{ activeHours }}h · {{ activeDays }}d</span>
        <span class="sub">{{ L?.ofWindow ?? 'of 24h × 7d' }}</span>
      </li>
      <li>
        <span class="lbl">{{ L?.avgSlot ?? 'Avg/slot' }}</span>
        <span class="val">{{ compactParts(avgPerActiveSlot).value }}</span>
        <span class="sub">{{ L?.perSlot ?? 'calls per active slot' }}</span>
      </li>
    </ul>

    <div class="scale">
      <span class="lbl">{{ L?.scaleLabel ?? 'cost' }}</span>
      <span class="scale-bar">
        <span
          v-for="step in 8"
          :key="step"
          class="scale-step"
          :style="{ '--i': step / 8 }"
        />
      </span>
      <span class="lbl">{{ L?.scaleLow ?? 'low → high' }}</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid {
  display: grid;
  grid-template-columns: 44px repeat(24, 1fr);
  gap: 2px;
  align-items: center;
}

.corner { height: 14px; }

.hour-label {
  font-size: 11px;
  color: var(--ct-fg-muted);
  text-align: center;
  letter-spacing: 0.08em;
  visibility: hidden;
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
}
.hour-label.visible { visibility: visible; }

.day-label {
  font-size: 12px;
  color: var(--ct-fg-muted);
  letter-spacing: 0.16em;
  text-align: right;
  padding-right: 10px;
  font-family: var(--ct-font-mono);
}

.cell {
  height: 22px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--ct-primary) calc(8% + var(--i, 0) * 80%), transparent);
  transition: transform 80ms ease;
}

.cell.empty {
  background: var(--ct-surface-1);
}

.cell:hover {
  outline: 1px solid var(--ct-primary);
  transform: scale(1.04);
}

.summary {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--ct-border);
  border-bottom: 1px solid var(--ct-border);
}

.summary li {
  padding: 12px 16px;
  border-right: 1px solid var(--ct-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary li:last-child { border-right: none; }

.lbl {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--ct-fg-muted);
  text-transform: uppercase;
}

.val {
  font-size: 17px;
  color: var(--ct-fg);
  letter-spacing: -0.01em;
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
}

.sub {
  font-size: 12px;
  color: var(--ct-fg-muted);
}

.scale {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  align-self: flex-end;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--ct-fg-muted);
  text-transform: uppercase;
}

.scale-bar {
  display: inline-flex;
  border: 1px solid var(--ct-border);
}

.scale-step {
  width: 18px;
  height: 10px;
  background: color-mix(in srgb, var(--ct-primary) calc(8% + var(--i, 0) * 80%), transparent);
}
</style>
