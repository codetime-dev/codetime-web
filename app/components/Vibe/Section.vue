<script setup lang="ts">
// Vibe page section frame. Thin pass-through around the global
// `PanelSection` component so the Agent page reads with the same
// chrome — diagonal divider, mono num, title, optional right-aligned
// meta — as Settings / Profile / other dashboard pages.

defineProps<{
  num: string
  title: string
  meta?: string
  flush?: boolean
}>()
</script>

<template>
  <PanelSection :num="num" :title="title" :meta="meta" :flush="flush">
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
    <slot />
  </PanelSection>
</template>
