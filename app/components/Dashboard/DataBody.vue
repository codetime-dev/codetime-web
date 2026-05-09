<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
}>()
</script>

<template>
  <div class="bg-surface-variant-1/20 px-3 py-2.5">
    <div class="text-[10.5px] text-primary tracking-[0.16em] font-mono uppercase">
      {{ title }}
    </div>
    <div
      v-if="value !== ''"
      class="text-[15px] text-surface tracking-[0.02em] font-mono mt-1 text-nowrap tabular-nums"
    >
      {{ value }}
    </div>
    <div
      v-else
      class="text-[15px] text-surface-dimmed font-mono mt-1"
    >
      —
    </div>
  </div>
</template>
