<script setup lang="ts">
const props = defineProps<{
  history: { duration: number, time: string, by?: string }[]
  pending?: boolean
}>()

const history = computed(() => props.history)
const processed = useProcessedData(history)
</script>

<template>
  <div>
    <div class="mb-2.5 flex gap-2 items-baseline justify-between">
      <span class="text-[12px] text-ct-fg-muted tracking-[0.12em] font-mono uppercase">365D · CALENDAR</span>
      <div class="text-[12px] text-ct-fg-muted tracking-[0.08em] font-mono flex gap-1.5 uppercase items-center">
        <span>less</span>
        <span class="bg-ct-surface-1 h-2.5 w-2.5 inline-block" />
        <span class="bg-ct-primary-soft h-2.5 w-2.5 inline-block" />
        <span class="bg-primary/55 h-2.5 w-2.5 inline-block" />
        <span class="bg-primary/80 h-2.5 w-2.5 inline-block" />
        <span class="bg-primary h-2.5 w-2.5 inline-block" />
        <span>more</span>
      </div>
    </div>
    <div class="px-2 py-3 flex justify-center overflow-x-auto">
      <YearCalendarChart :data="processed" />
    </div>
    <div v-if="pending" class="mt-3 bg-ct-surface-2 h-32 w-full animate-pulse" />
  </div>
</template>
