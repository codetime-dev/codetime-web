<script setup lang="ts">
import type { PresetId } from './DateRangePresetMenu.vue'
import * as d3 from 'd3'

// Internal state model. The component still exposes `days / startTime /
// endTime` v-models so callers don't have to migrate, but tracks the
// user's intent (this month, last 7 days, custom, …) so arrow keys can
// shift the *window* — not the *span* — and the label stays meaningful.
type RangeState
  = | { kind: 'rolling', days: number }
  | { kind: 'week', offset: number }
  | { kind: 'month', offset: number }
  | { kind: 'ytd' }
  | { kind: 'all' }
  | { kind: 'custom', start: Date, end: Date }

const days = defineModel<number>('days', { default: 28 })
const startTime = defineModel<Date | null>('startTime', { default: null })
const endTime = defineModel<Date | null>('endTime', { default: null })

const t = useI18N()
const user = useUser()
const priceModal = ref(false)
const calendarOpen = ref(false)
const menuOpen = ref(false)

const ROLLING_FREE_MAX = 90

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function diffDays(a: Date, b: Date): number {
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)))
}
// ISO-week Monday — matches `date_trunc('week', …)` on the server side.
function startOfIsoWeek(d: Date): Date {
  const x = startOfDay(d)
  const dow = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - dow)
  return x
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// Reconstruct the preset from the inbound v-models on mount so deep
// links / SSR-restored URLs still pick the right label.
function inferInitial(): RangeState {
  if (startTime.value && endTime.value) {
    return { kind: 'custom', start: startTime.value, end: endTime.value }
  }
  if (days.value === 36_500) {
    return { kind: 'all' }
  }
  return { kind: 'rolling', days: days.value }
}
const state = ref<RangeState>(inferInitial())

function isPro(): boolean {
  return user.value?.plan !== 'free'
}

function gated(s: RangeState): boolean {
  if (isPro()) {
    return false
  }
  if (s.kind === 'all' || s.kind === 'ytd' || s.kind === 'custom') {
    return true
  }
  if (s.kind === 'rolling' && s.days > ROLLING_FREE_MAX) {
    return true
  }
  return false
}

function applyState(s: RangeState) {
  if (gated(s)) {
    priceModal.value = true
    return
  }
  state.value = s
  pushModels(s)
}

function pushModels(s: RangeState) {
  const today = startOfDay(new Date())
  switch (s.kind) {
    case 'rolling': {
      startTime.value = null
      endTime.value = null
      days.value = s.days
      break
    }
    case 'week': {
      const monday = addDays(startOfIsoWeek(today), s.offset * 7)
      const sunday = addDays(monday, 6)
      // Current week caps to today so trailing empty days don't dilute
      // the chart.
      const last = s.offset === 0 && sunday > today ? today : sunday
      const end = endOfDay(last)
      startTime.value = monday
      endTime.value = end
      days.value = diffDays(monday, end)
      break
    }
    case 'month': {
      const anchor = addMonths(today, s.offset)
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      const lastDayOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
      // For the current month, cap to today so the chart doesn't show
      // a trailing run of empty days.
      const last = s.offset === 0 && lastDayOfMonth > today ? today : lastDayOfMonth
      const end = endOfDay(last)
      startTime.value = first
      endTime.value = end
      days.value = diffDays(first, end)
      break
    }
    case 'ytd': {
      const first = new Date(today.getFullYear(), 0, 1)
      const end = endOfDay(today)
      startTime.value = first
      endTime.value = end
      days.value = diffDays(first, end)
      break
    }
    case 'all': {
      startTime.value = null
      endTime.value = null
      days.value = 36_500
      break
    }
    case 'custom': {
      const start = startOfDay(s.start)
      const end = endOfDay(s.end)
      startTime.value = start
      endTime.value = end
      days.value = diffDays(start, end)
      break
    }
  }
}

// Arrow keys uniformly shift to the previous / next window of the same
// width. They never change span — span is set by the preset menu.
function shiftRolling(s: { kind: 'rolling', days: number }, dir: -1 | 1): RangeState {
  const now = endOfDay(new Date())
  if (dir < 0) {
    // Window of `days` length ending one day before today's window
    // started — i.e. the previous `days`-day stretch.
    const end = endOfDay(addDays(startOfDay(now), -s.days))
    const start = startOfDay(addDays(end, -(s.days - 1)))
    return { kind: 'custom', start, end }
  }
  // Forward from a fresh rolling window has nothing to shift into —
  // callers gate this via canNext.
  return s
}

function onPrev() {
  const s = state.value
  switch (s.kind) {
    case 'week': {
      return applyState({ kind: 'week', offset: s.offset - 1 })
    }
    case 'month': {
      return applyState({ kind: 'month', offset: s.offset - 1 })
    }
    case 'ytd': {
      // Previous year, same period (Jan 1 → today's date last year).
      const year = new Date().getFullYear() - 1
      const start = new Date(year, 0, 1)
      const lastYearToday = new Date(year, new Date().getMonth(), new Date().getDate())
      return applyState({ kind: 'custom', start, end: endOfDay(lastYearToday) })
    }
    case 'rolling': {
      return applyState(shiftRolling(s, -1))
    }
    case 'custom': {
      const len = s.end.getTime() - s.start.getTime()
      const newEnd = new Date(s.start.getTime() - 1)
      const newStart = new Date(newEnd.getTime() - len)
      return applyState({ kind: 'custom', start: newStart, end: newEnd })
    }
    case 'all':
  }
}

function onNext() {
  const s = state.value
  switch (s.kind) {
    case 'week': {
      if (s.offset >= 0) {
        return
      }
      return applyState({ kind: 'week', offset: s.offset + 1 })
    }
    case 'month': {
      if (s.offset >= 0) {
        return
      }
      return applyState({ kind: 'month', offset: s.offset + 1 })
    }
    case 'custom': {
      const now = endOfDay(new Date())
      if (s.end >= now) {
        return
      }
      const len = s.end.getTime() - s.start.getTime()
      const newStart = new Date(s.end.getTime() + 1)
      let newEnd = new Date(newStart.getTime() + len)
      if (newEnd > now) {
        newEnd = now
      }
      return applyState({ kind: 'custom', start: newStart, end: newEnd })
    }
    case 'rolling':
    case 'ytd':
    case 'all':
  }
}

const canPrev = computed(() => state.value.kind !== 'all')
const canNext = computed(() => {
  const s = state.value
  if (s.kind === 'all' || s.kind === 'ytd' || s.kind === 'rolling') {
    return false
  }
  if ((s.kind === 'week' || s.kind === 'month') && s.offset >= 0) {
    return false
  }
  if (s.kind === 'custom' && s.end >= endOfDay(new Date())) {
    return false
  }
  return true
})

// Display.
const fmtDay = d3.timeFormat('%Y-%m-%d')

const labelText = computed(() => {
  const dr = t.value.dashboard.overview.dataRange
  const s = state.value
  switch (s.kind) {
    case 'all': {
      return dr.allTime
    }
    case 'week': {
      if (s.offset === 0) {
        return dr.thisWeek ?? 'This week'
      }
      if (s.offset === -1) {
        return dr.lastWeek ?? 'Last week'
      }
      const monday = addDays(startOfIsoWeek(new Date()), s.offset * 7)
      const sunday = addDays(monday, 6)
      return `${fmtDay(monday)} ~ ${fmtDay(sunday)}`
    }
    case 'month': {
      if (s.offset === 0) {
        return dr.thisMonth ?? 'This month'
      }
      if (s.offset === -1) {
        return dr.lastMonth ?? 'Last month'
      }
      const anchor = addMonths(new Date(), s.offset)
      return `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`
    }
    case 'ytd': {
      return dr.yearToDate ?? 'Year to date'
    }
    case 'rolling': {
      return dr.title(s.days)
    }
    case 'custom': {
      return `${fmtDay(s.start)} ~ ${fmtDay(s.end)}`
    }
    default: {
      return ''
    }
  }
})

const metaText = computed(() => {
  const s = state.value
  if (s.kind === 'all') {
    return ''
  }
  if (s.kind === 'rolling') {
    const start = new Date(Date.now() - s.days * 24 * 60 * 60 * 1000)
    return `${fmtDay(start)} → ${fmtDay(new Date())}`
  }
  if (startTime.value && endTime.value) {
    return `${fmtDay(startTime.value)} → ${fmtDay(endTime.value)}`
  }
  return ''
})

const isAnchored = computed(() => {
  const k = state.value.kind
  return k === 'week' || k === 'month' || k === 'ytd' || k === 'custom'
})

// Menu items.
function isActive(id: PresetId): boolean {
  const s = state.value
  switch (id) {
    case 'thisWeek': { return s.kind === 'week' && s.offset === 0
    }
    case 'lastWeek': { return s.kind === 'week' && s.offset === -1
    }
    case 'thisMonth': { return s.kind === 'month' && s.offset === 0
    }
    case 'lastMonth': { return s.kind === 'month' && s.offset === -1
    }
    case 'last7': { return s.kind === 'rolling' && s.days === 7
    }
    case 'last30': { return s.kind === 'rolling' && s.days === 30
    }
    case 'last90': { return s.kind === 'rolling' && s.days === 90
    }
    case 'ytd': { return s.kind === 'ytd'
    }
    case 'all': { return s.kind === 'all'
    }
    case 'custom': { return s.kind === 'custom'
    }
  }
}

const menuItems = computed(() => {
  const dr = t.value.dashboard.overview.dataRange
  const pro = isPro()
  const items: Array<{ id: PresetId, label: string, proLocked: boolean, active: boolean }> = [
    { id: 'thisWeek', label: dr.thisWeek ?? 'This week', proLocked: false, active: isActive('thisWeek') },
    { id: 'lastWeek', label: dr.lastWeek ?? 'Last week', proLocked: false, active: isActive('lastWeek') },
    { id: 'thisMonth', label: dr.thisMonth ?? 'This month', proLocked: false, active: isActive('thisMonth') },
    { id: 'lastMonth', label: dr.lastMonth ?? 'Last month', proLocked: false, active: isActive('lastMonth') },
    { id: 'last7', label: dr.title(7), proLocked: false, active: isActive('last7') },
    { id: 'last30', label: dr.title(30), proLocked: false, active: isActive('last30') },
    { id: 'last90', label: dr.title(90), proLocked: false, active: isActive('last90') },
    { id: 'ytd', label: dr.yearToDate ?? 'Year to date', proLocked: !pro, active: isActive('ytd') },
    { id: 'all', label: dr.allTime, proLocked: !pro, active: isActive('all') },
    { id: 'custom', label: dr.custom ?? 'Custom…', proLocked: !pro, active: isActive('custom') },
  ]
  return items
})

function onPickMenu(id: PresetId) {
  menuOpen.value = false
  switch (id) {
    case 'thisWeek': {
      return applyState({ kind: 'week', offset: 0 })
    }
    case 'lastWeek': {
      return applyState({ kind: 'week', offset: -1 })
    }
    case 'thisMonth': {
      return applyState({ kind: 'month', offset: 0 })
    }
    case 'lastMonth': {
      return applyState({ kind: 'month', offset: -1 })
    }
    case 'last7': {
      return applyState({ kind: 'rolling', days: 7 })
    }
    case 'last30': {
      return applyState({ kind: 'rolling', days: 30 })
    }
    case 'last90': {
      return applyState({ kind: 'rolling', days: 90 })
    }
    case 'ytd': {
      return applyState({ kind: 'ytd' })
    }
    case 'all': {
      return applyState({ kind: 'all' })
    }
    case 'custom': {
      if (!isPro()) {
        priceModal.value = true
        return
      }
      calendarOpen.value = true
    }
  }
}

function toggleMenu() {
  if (calendarOpen.value) {
    calendarOpen.value = false
  }
  menuOpen.value = !menuOpen.value
}

function applyCustom(payload: { start: Date, end: Date }) {
  calendarOpen.value = false
  applyState({ kind: 'custom', start: payload.start, end: payload.end })
}

function cancelCustom() {
  calendarOpen.value = false
}

// Popover anchoring (preserved from the original implementation —
// narrow viewports need a manual fixed position so the popover can
// span the viewport instead of being clipped by the trigger box).
const trigger = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const narrowPos = ref<{ top: number, left: number, width: number } | null>(null)
const VIEWPORT_GUTTER = 12

function recomputeNarrowPos() {
  if ((!menuOpen.value && !calendarOpen.value) || !trigger.value) {
    narrowPos.value = null
    return
  }
  if (window.innerWidth > 640) {
    narrowPos.value = null
    return
  }
  const rect = trigger.value.getBoundingClientRect()
  narrowPos.value = {
    top: rect.bottom + 6,
    left: VIEWPORT_GUTTER,
    width: window.innerWidth - VIEWPORT_GUTTER * 2,
  }
}

watch([menuOpen, calendarOpen], async ([m, c]) => {
  if (m || c) {
    await nextTick()
    recomputeNarrowPos()
  }
  else {
    narrowPos.value = null
  }
})

function onDocClick(event: MouseEvent) {
  if (!menuOpen.value && !calendarOpen.value) {
    return
  }
  const target = event.target as Node
  if (popover.value?.contains(target) || trigger.value?.contains(target)) {
    return
  }
  menuOpen.value = false
  calendarOpen.value = false
}

function onWinChange() {
  recomputeNarrowPos()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  window.addEventListener('resize', onWinChange)
  window.addEventListener('scroll', onWinChange, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  window.removeEventListener('resize', onWinChange)
  window.removeEventListener('scroll', onWinChange, true)
})

const popoverOpen = computed(() => menuOpen.value || calendarOpen.value)
</script>

<template>
  <ProUpgradeModal v-model:open="priceModal" />

  <div ref="trigger" class="dr-bar" :class="{ open: popoverOpen, custom: isAnchored }">
    <div class="dr-shell">
      <button
        type="button"
        class="dr-step"
        :disabled="!canPrev"
        :aria-label="t.dashboard.overview.dataRange.cancel ?? 'Previous'"
        @click="onPrev"
      >
        <i class="i-tabler-chevron-left" />
      </button>

      <button
        type="button"
        class="dr-label"
        :aria-expanded="popoverOpen"
        :title="t.dashboard.overview.dataRange.pickRange ?? 'Pick date range'"
        @click="toggleMenu"
      >
        <i class="dr-icon i-tabler-calendar-event" />
        <span class="dr-text tabular-nums">{{ labelText }}</span>
        <i class="dr-caret i-tabler-chevron-down" />
      </button>

      <button
        type="button"
        class="dr-step"
        :disabled="!canNext"
        :aria-label="t.dashboard.overview.dataRange.apply ?? 'Next'"
        @click="onNext"
      >
        <i class="i-tabler-chevron-right" />
      </button>
    </div>

    <div v-if="metaText" class="dr-meta tabular-nums">
      {{ metaText }}
    </div>

    <Transition name="dr-fade">
      <div
        v-if="popoverOpen"
        ref="popover"
        class="dr-popover"
        :class="{ 'dr-popover-narrow': !!narrowPos, 'dr-popover-calendar': calendarOpen }"
        :style="narrowPos
          ? { top: `${narrowPos.top}px`, left: `${narrowPos.left}px`, width: `${narrowPos.width}px` }
          : undefined"
      >
        <DashboardDateRangePresetMenu
          v-if="menuOpen"
          :items="menuItems"
          @pick="onPickMenu"
        />
        <DashboardDateRangeCalendar
          v-else-if="calendarOpen"
          :start="startTime"
          :end="endTime"
          @apply="applyCustom"
          @cancel="cancelCustom"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dr-bar {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.dr-meta {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  letter-spacing: 0.02em;
}

.dr-shell {
  display: inline-flex;
  align-items: center;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-md);
  padding: 2px;
  transition: border-color var(--ct-duration-fast) var(--ct-ease),
              box-shadow var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.dr-bar.open .dr-shell {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 14%, transparent);
}

.dr-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: var(--ct-fg-muted);
  border-radius: calc(var(--ct-radius-md) - 2px);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.dr-step:hover:not(:disabled) { background: var(--ct-surface-2); color: var(--ct-fg); }
.dr-step:disabled { opacity: 0.35; cursor: not-allowed; }

.dr-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: 0;
  color: var(--ct-fg);
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  border-radius: calc(var(--ct-radius-md) - 2px);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.dr-label:hover { background: var(--ct-surface-2); }

.dr-icon {
  display: block;
  width: 14px;
  height: 14px;
  font-size: 14px;
  line-height: 1;
  color: var(--ct-fg-subtle);
  transition: color var(--ct-duration-fast) var(--ct-ease);
}
.dr-bar.custom .dr-icon { color: var(--ct-primary); }

.dr-text {
  min-width: 9ch;
  text-align: center;
  line-height: 1;
}

.dr-caret {
  display: block;
  width: 13px;
  height: 13px;
  font-size: 13px;
  line-height: 1;
  color: var(--ct-fg-subtle);
  transition: transform var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.dr-bar.open .dr-caret { transform: rotate(180deg); color: var(--ct-fg); }

.dr-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
}
.dr-popover.dr-popover-narrow {
  position: fixed;
  right: auto;
}

.dr-fade-enter-active,
.dr-fade-leave-active {
  transition: opacity 120ms var(--ct-ease), transform 120ms var(--ct-ease);
  transform-origin: top left;
}
.dr-fade-enter-from,
.dr-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
