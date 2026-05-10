<script setup lang="ts">
import { Modal, Paper } from '@roku-ui/vue'
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
  <Modal v-model="priceModal">
    <div class="flex flex-col gap-8 min-w-72">
      <Paper class="max-w-92">
        <div class="text-[14px] tracking-[0.12em] font-mono uppercase">
          {{ t.plan.modal.title }}
        </div>
        <div class="text-[12.5px] text-surface-dimmed font-mono mt-3 w-full space-y-1.5">
          <p>{{ t.plan.modal.p1 }}</p>
          <p>{{ t.plan.modal.p2 }}</p>
          <p>{{ t.plan.modal.p3 }}</p>
          <a href="mailto:admin@codetime.dev" class="text-primary">admin@codetime.dev</a>
        </div>
      </Paper>
      <div class="relative">
        <ProPricePaper variant="monthly" class="min-h-500px" />
      </div>
    </div>
  </Modal>

  <div class="bg-surface-variant-1/25 px-2.5 py-1.5 flex flex-wrap gap-2 items-center justify-between">
    <div class="flex gap-1.5 items-center">
      <button
        type="button"
        class="bg-surface-variant-1/40 hover:bg-surface-variant-1/70 text-[13px] text-surface-dimmed font-mono p-1 transition-colors hover:text-surface"
        @click="onPrev"
      >
        <i class="i-tabler-chevron-left text-sm" />
      </button>
      <div class="text-[13px] text-surface tracking-[0.06em] font-mono px-1.5 uppercase tabular-nums">
        <span v-if="days !== 36500">{{ t.dashboard.overview.dataRange.title(days) }}</span>
        <span v-else>{{ t.dashboard.overview.dataRange.allTime }}</span>
      </div>
      <button
        type="button"
        class="bg-surface-variant-1/40 hover:bg-surface-variant-1/70 text-[13px] text-surface-dimmed font-mono p-1 transition-colors hover:text-surface"
        @click="onNext"
      >
        <i class="i-tabler-chevron-right text-sm" />
      </button>
    </div>
    <div v-if="days !== 36500" class="text-surface-dimmed/80 text-[12px] tracking-[0.04em] font-mono tabular-nums">
      {{ d3.timeFormat('%Y-%m-%d')(new Date(Date.now() - days * 24 * 60 * 60 * 1000)) }}
      <span class="text-surface-dimmed/40 mx-1">~</span>
      {{ d3.timeFormat('%Y-%m-%d')(new Date()) }}
    </div>
  </div>
</template>
