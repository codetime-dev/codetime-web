<script setup lang="ts">
defineProps<{
  plan: string
}>()
</script>

<template>
  <UTag
    :tone="plan === 'pro' ? 'primary' : 'neutral'"
    variant="soft"
    size="sm"
  >
    {{ String(plan).toUpperCase() }}
  </UTag>
</template>
