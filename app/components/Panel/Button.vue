<script setup lang="ts">
type Variant = 'default' | 'primary' | 'ghost'
type Size = 'sm' | 'md'

withDefaults(defineProps<{
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
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="up-btn"
    :class="[`up-btn-${size}`, `up-btn-${variant}`, { 'up-btn-active': active }]"
  >
    <slot />
  </button>
</template>

<style scoped>
.up-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: var(--ct-radius-md);
  font-weight: var(--ct-weight-medium);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease),
              border-color var(--ct-duration-fast) var(--ct-ease);
}
.up-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.up-btn-sm { padding: 5px 10px; font-size: var(--ct-text-xs); }
.up-btn-md { padding: 7px 14px; font-size: var(--ct-text-sm); }

.up-btn-default {
  background: var(--ct-surface-1);
  color: var(--ct-fg-muted);
}
.up-btn-default:hover:not(:disabled) { background: var(--ct-surface-2); color: var(--ct-fg); }
.up-btn-default.up-btn-active { background: var(--ct-surface-2); color: var(--ct-fg); }

.up-btn-primary {
  background: var(--ct-primary-soft);
  color: var(--ct-primary);
}
.up-btn-primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--ct-primary) 20%, transparent);
}
.up-btn-primary.up-btn-active {
  background: color-mix(in srgb, var(--ct-primary) 25%, transparent);
}

.up-btn-ghost { background: transparent; color: var(--ct-fg-muted); }
.up-btn-ghost:hover:not(:disabled) { background: var(--ct-surface-1); color: var(--ct-fg); }
.up-btn-ghost.up-btn-active { background: var(--ct-surface-2); color: var(--ct-fg); }
</style>
