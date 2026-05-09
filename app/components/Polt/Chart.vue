<script setup lang="ts">
import type { PlotOptions } from '@observablehq/plot'

const props = defineProps<{
  options: PlotOptions
}>()

const chartWrapper = ref<HTMLElement | null>(null)
const { width, height } = useElementBounding(chartWrapper)
const op = computed(() => {
  const w = width.value || 800
  const h = height.value || 300
  return {
    width: w,
    height: h,
    ...props.options,
  }
})
</script>

<template>
  <div
    ref="chartWrapper"
    data-allow-mismatch
    class="polt-chart-wrapper w-full"
  >
    <PoltRenderer
      :options="op"
    />
  </div>
</template>

<style scoped>
.polt-chart-wrapper {
  min-height: 300px;
}
</style>
