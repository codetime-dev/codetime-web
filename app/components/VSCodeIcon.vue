<script setup lang="ts">
const props = defineProps<{
  language: string
}>()

const iconClassName = computed(() => {
  return iconMap.get(props.language) ?? 'vscode-icons-file-type-text'
})
</script>

<template>
  <img
    :src="`/vscode-icons/vscode-icons_${iconClassName.split('vscode-icons-')[1]}.svg`"
    :alt="iconClassName.split('vscode-icons-file-type-')[1]"
    loading="lazy"
    decoding="async"
  >
</template>
