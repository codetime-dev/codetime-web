<script setup lang="ts">
import * as d3 from 'd3'

const days = defineModel<number>('days', { default: 28 })
const startTime = defineModel<Date | null>('startTime', { default: null })
const endTime = defineModel<Date | null>('endTime', { default: null })

const { state, index, next, prev } = useCycleList([
  1,
  3,
  7,
  14,
  28,
  90,
  365,
  365 * 2,
  365 * 100,
], {
  initialValue: days.value,
})

const customMode = computed(() => !!startTime.value && !!endTime.value)

watchEffect(() => {
  if (!customMode.value) {
    days.value = state.value
  }
})

const t = useI18N()
const user = useUser()
const priceModal = ref(false)
const calendarOpen = ref(false)

function exitCustom() {
  startTime.value = null
  endTime.value = null
  days.value = state.value
}

function onPrev() {
  if (customMode.value) {
    exitCustom()
    return
  }
  if (index.value === 0 && user.value?.plan === 'free') {
    priceModal.value = true
    return
  }
  prev()
}
function onNext() {
  if (customMode.value) {
    exitCustom()
    return
  }
  if (index.value === 5 && user.value?.plan === 'free') {
    priceModal.value = true
    return
  }
  next()
}

function toggleCalendar() {
  if (calendarOpen.value) {
    calendarOpen.value = false
    return
  }
  if (user.value?.plan === 'free') {
    priceModal.value = true
    return
  }
  calendarOpen.value = true
}

function applyCustom(payload: { start: Date, end: Date }) {
  startTime.value = payload.start
  endTime.value = payload.end
  const ms = payload.end.getTime() - payload.start.getTime()
  days.value = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)))
  calendarOpen.value = false
}

function cancelCustom() {
  calendarOpen.value = false
}

const fmtDay = d3.timeFormat('%Y-%m-%d')
const labelText = computed(() => {
  if (customMode.value) {
    return `${fmtDay(startTime.value!)} ~ ${fmtDay(endTime.value!)}`
  }
  if (days.value === 36_500) {
    return t.value.dashboard.overview.dataRange.allTime
  }
  return t.value.dashboard.overview.dataRange.title(days.value)
})

const trigger = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)

// On narrow viewports we anchor the popover beneath the trigger but let it
// span the full viewport width. Compute the offsets manually since CSS
// can't push an absolutely-positioned child past its parent's box edges.
const narrowPos = ref<{ top: number, left: number, width: number } | null>(null)
const VIEWPORT_GUTTER = 12

function recomputeNarrowPos() {
  if (!calendarOpen.value || !trigger.value) {
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

watch(calendarOpen, async (open) => {
  if (open) {
    await nextTick()
    recomputeNarrowPos()
  }
  else {
    narrowPos.value = null
  }
})

function onDocClick(event: MouseEvent) {
  if (!calendarOpen.value) {
    return
  }
  const target = event.target as Node
  if (popover.value?.contains(target) || trigger.value?.contains(target)) {
    return
  }
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
</script>

<template>
  <ProUpgradeModal v-model:open="priceModal" />

  <div ref="trigger" class="dr-bar" :class="{ open: calendarOpen, custom: customMode }">
    <div class="dr-shell">
      <button type="button" class="dr-step" @click="onPrev">
        <i class="i-tabler-chevron-left" />
      </button>

      <button
        type="button"
        class="dr-label"
        :aria-expanded="calendarOpen"
        :title="t.dashboard.overview.dataRange.custom ?? 'Pick date range'"
        @click="toggleCalendar"
      >
        <i class="dr-icon i-tabler-calendar-event" />
        <span class="dr-text tabular-nums">{{ labelText }}</span>
        <i class="dr-caret i-tabler-chevron-down" />
      </button>

      <button type="button" class="dr-step" @click="onNext">
        <i class="i-tabler-chevron-right" />
      </button>
    </div>

    <div v-if="!customMode && days !== 36500" class="dr-meta tabular-nums">
      {{ fmtDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000)) }}
      <span class="dr-meta-sep">→</span>
      {{ fmtDay(new Date()) }}
    </div>

    <Transition name="dr-fade">
      <div
        v-if="calendarOpen"
        ref="popover"
        class="dr-popover"
        :class="{ 'dr-popover-narrow': !!narrowPos }"
        :style="narrowPos
          ? { top: `${narrowPos.top}px`, left: `${narrowPos.left}px`, width: `${narrowPos.width}px` }
          : undefined"
      >
        <DashboardDateRangeCalendar
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
.dr-meta-sep { margin: 0 6px; opacity: 0.5; }

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
.dr-step:hover { background: var(--ct-surface-2); color: var(--ct-fg); }

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
