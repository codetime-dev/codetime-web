<script setup lang="ts">
type Variant = 'default' | 'primary' | 'ghost'
type Size = 'sm' | 'md'

const props = withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  active?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}>(), {
  variant: 'default',
  size: 'sm',
  active: false,
  disabled: false,
  type: 'button',
})

const sizeClass = computed(() => {
  return props.size === 'md'
    ? 'text-[12.5px] px-4 py-2'
    : 'text-[12px] px-3 py-1.5'
})

const variantClass = computed(() => {
  if (props.variant === 'primary') {
    return props.active
      ? 'bg-ct-primary-soft text-primary'
      : 'bg-ct-primary-soft text-primary hover:bg-ct-primary-soft'
  }
  if (props.variant === 'ghost') {
    return props.active
      ? 'bg-ct-surface-2 text-ct-fg'
      : 'text-ct-fg-muted hover:bg-ct-surface-2 hover:text-ct-fg'
  }
  return props.active
    ? 'bg-ct-surface-2 text-ct-fg'
    : 'bg-ct-surface-2 text-ct-fg-muted hover:bg-ct-surface-2 hover:text-ct-fg'
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="tracking-[0.12em] font-mono inline-flex gap-1.5 uppercase transition-colors items-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ct-surface-2"
    :class="[sizeClass, variantClass]"
  >
    <slot />
  </button>
</template>
