<script setup lang="ts">
defineProps<{
  status: string
}>()
</script>

<template>
  <UTag tone="neutral" variant="outline" size="sm">
    {{ status }}
  </UTag>
</template>
