<script setup lang="ts">
import UButton from '~/components/U/Button.vue'

withDefaults(defineProps<{
  color?: 'error' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  color: 'primary',
  size: 'md',
  type: 'button',
})
</script>

<template>
  <UButton
    :variant="color === 'error' ? 'danger' : 'primary'"
    :size="size"
    :block="block"
    :loading="loading"
    :disabled="disabled"
    :type="type"
  >
    <slot />
  </UButton>
</template>
