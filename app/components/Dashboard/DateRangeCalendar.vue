<script setup lang="ts">
// Two-month range calendar with hover preview & quick shortcuts.
type Props = {
  start: Date | null
  end: Date | null
  // Latest selectable day (inclusive). Defaults to today.
  maxDate?: Date
  // Earliest selectable day (inclusive). Defaults to 10 years ago.
  minDate?: Date
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:start', v: Date | null): void
  (e: 'update:end', v: Date | null): void
  (e: 'apply', payload: { start: Date, end: Date }): void
  (e: 'cancel'): void
}>()

const t = useI18N()

const today = new Date()
today.setHours(0, 0, 0, 0)

const maxDate = computed(() => {
  const d = props.maxDate ? new Date(props.maxDate) : new Date(today)
  d.setHours(0, 0, 0, 0)
  return d
})
const minDate = computed(() => {
  if (props.minDate) {
    const d = new Date(props.minDate)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const d = new Date(today)
  d.setFullYear(d.getFullYear() - 10)
  return d
})

function toStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) {
    return false
  }
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

// Working draft start / end. Confirmed on apply.
const draftStart = ref<Date | null>(props.start ? toStartOfDay(props.start) : null)
const draftEnd = ref<Date | null>(props.end ? toStartOfDay(props.end) : null)
const hover = ref<Date | null>(null)

watch(() => props.start, (v) => {
 draftStart.value = v ? toStartOfDay(v) : null
})
watch(() => props.end, (v) => {
 draftEnd.value = v ? toStartOfDay(v) : null
})

const leftMonth = ref<Date>(startOfMonth(draftEnd.value ?? draftStart.value ?? today))
const rightMonth = computed(() => addMonths(leftMonth.value, 1))

function shiftMonth(n: number) {
  leftMonth.value = addMonths(leftMonth.value, n)
}

function inRange(d: Date): boolean {
  if (!draftStart.value) {
    return false
  }
  const end = draftEnd.value ?? hover.value
  if (!end) {
    return false
  }
  const a = draftStart.value.getTime()
  const b = end.getTime()
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const t = d.getTime()
  return t >= lo && t <= hi
}

function isDisabled(d: Date): boolean {
  return d < minDate.value || d > maxDate.value
}

function pickDay(d: Date) {
  if (isDisabled(d)) {
    return
  }
  if (!draftStart.value || (draftStart.value && draftEnd.value)) {
    draftStart.value = d
    draftEnd.value = null
    hover.value = null
    return
  }
  // Have start, no end. Set end (swap if needed).
  if (d < draftStart.value) {
    draftEnd.value = draftStart.value
    draftStart.value = d
  }
  else {
    draftEnd.value = d
  }
  hover.value = null
}

function hoverDay(d: Date) {
  if (draftStart.value && !draftEnd.value && !isDisabled(d)) {
    hover.value = d
  }
}

function clearHover() {
  hover.value = null
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildGrid(monthStart: Date) {
  // 6 rows × 7 cols, leading days padded from prev month.
  const firstWeekday = monthStart.getDay()
  const cells: Array<{ date: Date, currentMonth: boolean }> = []
  const gridStart = new Date(monthStart)
  gridStart.setDate(1 - firstWeekday)
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push({ date: d, currentMonth: d.getMonth() === monthStart.getMonth() })
  }
  return cells
}

const leftGrid = computed(() => buildGrid(leftMonth.value))
const rightGrid = computed(() => buildGrid(rightMonth.value))

const isNarrow = useMediaQuery('(max-width: 640px)')

function fmt(d: Date | null) {
  return d
  ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  : '—'
}

const canApply = computed(() => !!draftStart.value && !!draftEnd.value)

function applyRange() {
  if (!draftStart.value || !draftEnd.value) {
    return
  }
  emit('update:start', draftStart.value)
  // Push end to end-of-day so range queries include that day's events.
  const endOfDay = new Date(draftEnd.value)
  endOfDay.setHours(23, 59, 59, 999)
  emit('update:end', endOfDay)
  emit('apply', { start: draftStart.value, end: endOfDay })
}

function cancel() {
  emit('cancel')
}
</script>

<template>
  <div class="cal-root" @mouseleave="clearHover">
    <div class="cal-months">
      <div class="cal-month">
        <div class="cal-head">
          <button type="button" class="cal-nav" @click="shiftMonth(-1)">
            <i class="i-tabler-chevron-left" />
          </button>
          <div class="cal-title">
            {{ MONTHS[leftMonth.getMonth()] }} {{ leftMonth.getFullYear() }}
          </div>
          <button v-if="isNarrow" type="button" class="cal-nav" @click="shiftMonth(1)">
            <i class="i-tabler-chevron-right" />
          </button>
          <span v-else />
        </div>
        <div class="cal-wd">
          <span v-for="(w, i) in WEEKDAYS" :key="i">{{ w }}</span>
        </div>
        <div class="cal-grid">
          <button
            v-for="(c, i) in leftGrid"
            :key="i"
            type="button"
            class="cal-cell"
            :class="{
              dim: !c.currentMonth,
              today: isSameDay(c.date, today),
              start: isSameDay(c.date, draftStart),
              end: isSameDay(c.date, draftEnd),
              range: inRange(c.date),
              disabled: isDisabled(c.date),
            }"
            :disabled="isDisabled(c.date)"
            @click="pickDay(c.date)"
            @mouseenter="hoverDay(c.date)"
          >
            {{ c.date.getDate() }}
          </button>
        </div>
      </div>

      <div v-if="!isNarrow" class="cal-month">
        <div class="cal-head">
          <span />
          <div class="cal-title">
            {{ MONTHS[rightMonth.getMonth()] }} {{ rightMonth.getFullYear() }}
          </div>
          <button type="button" class="cal-nav" @click="shiftMonth(1)">
            <i class="i-tabler-chevron-right" />
          </button>
        </div>
        <div class="cal-wd">
          <span v-for="(w, i) in WEEKDAYS" :key="i">{{ w }}</span>
        </div>
        <div class="cal-grid">
          <button
            v-for="(c, i) in rightGrid"
            :key="i"
            type="button"
            class="cal-cell"
            :class="{
              dim: !c.currentMonth,
              today: isSameDay(c.date, today),
              start: isSameDay(c.date, draftStart),
              end: isSameDay(c.date, draftEnd),
              range: inRange(c.date),
              disabled: isDisabled(c.date),
            }"
            :disabled="isDisabled(c.date)"
            @click="pickDay(c.date)"
            @mouseenter="hoverDay(c.date)"
          >
            {{ c.date.getDate() }}
          </button>
        </div>
      </div>
    </div>

    <div class="cal-footer">
      <div class="cal-readout tabular-nums">
        <span>{{ fmt(draftStart) }}</span>
        <span class="sep">~</span>
        <span>{{ fmt(draftEnd) }}</span>
      </div>
      <div class="cal-actions">
        <button type="button" class="cal-btn ghost" @click="cancel">
          {{ t.dashboard.overview.dataRange.cancel ?? 'Cancel' }}
        </button>
        <button
          type="button"
          class="cal-btn primary"
          :disabled="!canApply"
          @click="applyRange"
        >
          {{ t.dashboard.overview.dataRange.apply ?? 'Apply' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cal-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  min-width: 560px;
  box-shadow: 0 12px 32px -12px rgba(0, 0, 0, 0.25);
}

.cal-months {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) {
  .cal-root { min-width: 0; width: 100%; box-sizing: border-box; }
  .cal-months { grid-template-columns: 1fr; }
  .cal-cell { height: 36px; font-size: 13px; }
}

.cal-month {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cal-head {
  display: grid;
  grid-template-columns: 28px 1fr 28px;
  align-items: center;
}
.cal-title {
  text-align: center;
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg);
}
.cal-nav {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  color: var(--ct-fg-muted);
  border-radius: var(--ct-radius-sm);
  cursor: pointer;
}
.cal-nav:hover { background: var(--ct-surface-2); color: var(--ct-fg); }

.cal-wd {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  font-size: 10px;
  color: var(--ct-fg-subtle);
  text-align: center;
  padding: 2px 0;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.cal-cell {
  height: 30px;
  font-family: var(--ct-font-mono);
  font-size: 12px;
  color: var(--ct-fg);
  background: transparent;
  border: 0;
  border-radius: var(--ct-radius-sm);
  cursor: pointer;
  transition: background-color 120ms var(--ct-ease), color 120ms var(--ct-ease);
}
.cal-cell:hover:not(.disabled) {
  background: var(--ct-surface-2);
}
.cal-cell.dim { color: var(--ct-fg-subtle); opacity: 0.55; }
.cal-cell.today { box-shadow: inset 0 0 0 1px var(--ct-border-strong, var(--ct-border)); }
.cal-cell.range {
  background: var(--ct-primary-soft, rgba(99, 102, 241, 0.18));
  color: var(--ct-fg);
}
.cal-cell.start,
.cal-cell.end {
  background: var(--ct-primary);
  color: var(--ct-on-primary, #fff);
  font-weight: var(--ct-weight-medium);
}
.cal-cell.disabled { color: var(--ct-fg-subtle); opacity: 0.3; cursor: not-allowed; }

.cal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--ct-border-subtle, var(--ct-border));
  padding-top: 10px;
}
.cal-readout {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-muted);
}
.cal-readout .sep { margin: 0 6px; opacity: 0.5; }
.cal-actions { display: inline-flex; gap: 6px; }
.cal-btn {
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
  padding: 6px 12px;
  border-radius: var(--ct-radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 120ms var(--ct-ease), color 120ms var(--ct-ease);
}
.cal-btn.ghost {
  background: transparent;
  color: var(--ct-fg-muted);
  border-color: var(--ct-border);
}
.cal-btn.ghost:hover { background: var(--ct-surface-2); color: var(--ct-fg); }
.cal-btn.primary {
  background: var(--ct-primary);
  color: var(--ct-on-primary, #fff);
}
.cal-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
