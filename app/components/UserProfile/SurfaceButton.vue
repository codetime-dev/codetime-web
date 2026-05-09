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
      ? 'bg-primary/25 text-primary'
      : 'bg-primary/12 text-primary hover:bg-primary/22'
  }
  if (props.variant === 'ghost') {
    return props.active
      ? 'bg-surface-variant-1/40 text-surface'
      : 'text-surface-dimmed hover:bg-surface-variant-1/30 hover:text-surface'
  }
  return props.active
    ? 'bg-surface-variant-1/55 text-surface'
    : 'bg-surface-variant-1/30 text-surface-dimmed hover:bg-surface-variant-1/55 hover:text-surface'
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="disabled:hover:bg-surface-variant-1/30 tracking-[0.12em] font-mono inline-flex gap-1.5 uppercase transition-colors items-center disabled:opacity-40 disabled:cursor-not-allowed"
    :class="[sizeClass, variantClass]"
  >
    <slot />
  </button>
</template>
