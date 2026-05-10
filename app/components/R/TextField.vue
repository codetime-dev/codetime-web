<script setup lang="ts">
import UInput from '~/components/U/Input.vue'

defineProps<{
  modelValue?: string | number
  placeholder?: string
  type?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  invalid?: boolean
}>()

defineEmits(['update:modelValue'])
</script>

<template>
  <UInput
    :model-value="modelValue"
    :placeholder="placeholder"
    :type="type"
    :size="size"
    :disabled="disabled"
    :invalid="invalid"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
