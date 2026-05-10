<script setup lang="ts">
import * as d3 from 'd3'

const days = defineModel<number>('days', { default: 28 })

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

watchEffect(() => {
  days.value = state.value
})
const t = useI18N()

const user = useUser()
const priceModal = ref(false)
function onPrev() {
  if (index.value === 0 && user.value?.plan === 'free') {
    priceModal.value = true
    return
  }
  prev()
}
function onNext() {
  if (index.value === 5 && user.value?.plan === 'free') {
    priceModal.value = true
    return
  }
  next()
}
</script>

<template>
  <UModal v-model="priceModal" :title="t.plan.modal.title" width="640px">
    <div class="dr-modal">
      <div class="dr-modal-text">
        <p>{{ t.plan.modal.p1 }}</p>
        <p>{{ t.plan.modal.p2 }}</p>
        <p>{{ t.plan.modal.p3 }}</p>
        <a href="mailto:admin@codetime.dev">admin@codetime.dev</a>
      </div>
      <ProPricePaper variant="monthly" class="dr-modal-price" />
    </div>
  </UModal>

  <div class="dr-bar">
    <div class="dr-controls">
      <button type="button" class="dr-step" @click="onPrev">
        <i class="i-tabler-chevron-left" />
      </button>
      <div class="dr-label tabular-nums">
        <span v-if="days !== 36500">{{ t.dashboard.overview.dataRange.title(days) }}</span>
        <span v-else>{{ t.dashboard.overview.dataRange.allTime }}</span>
      </div>
      <button type="button" class="dr-step" @click="onNext">
        <i class="i-tabler-chevron-right" />
      </button>
    </div>
    <div v-if="days !== 36500" class="dr-meta tabular-nums">
      {{ d3.timeFormat('%Y-%m-%d')(new Date(Date.now() - days * 24 * 60 * 60 * 1000)) }}
      <span class="dr-meta-sep">~</span>
      {{ d3.timeFormat('%Y-%m-%d')(new Date()) }}
    </div>
  </div>
</template>

<style scoped>
.dr-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  background: transparent;
}
.dr-controls {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.dr-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  background: transparent;
  color: var(--ct-fg-muted);
  border-radius: var(--ct-radius-md);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.dr-step:hover { background: var(--ct-surface-2); color: var(--ct-fg); }
.dr-label {
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg);
  padding: 0 8px;
}
.dr-meta {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}
.dr-meta-sep { margin: 0 6px; opacity: 0.5; }

.dr-modal {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.dr-modal-text { display: flex; flex-direction: column; gap: 6px; font-size: var(--ct-text-sm); color: var(--ct-fg-muted); }
.dr-modal-text a { color: var(--ct-primary); }
.dr-modal-price { min-height: 480px; }
</style>
