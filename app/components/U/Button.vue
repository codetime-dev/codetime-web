<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  iconLeft?: string
  iconRight?: string
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="u-btn"
    :class="[`u-btn-${variant}`, `u-btn-${size}`, { 'u-btn-block': block, 'u-btn-loading': loading }]"
  >
    <i v-if="iconLeft && !loading" :class="iconLeft" class="u-btn-icon" />
    <span v-if="loading" class="u-btn-spinner" />
    <span class="u-btn-label"><slot /></span>
    <i v-if="iconRight" :class="iconRight" class="u-btn-icon" />
  </button>
</template>

<style scoped>
.u-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--ct-font-sans);
  font-weight: var(--ct-weight-medium);
  border-radius: var(--ct-radius-lg);
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              border-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease),
              box-shadow var(--ct-duration-fast) var(--ct-ease),
              transform var(--ct-duration-fast) var(--ct-ease);
}
.u-btn:focus-visible {
  outline: 2px solid var(--ct-primary);
  outline-offset: 2px;
}
.u-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.u-btn:active:not(:disabled) {
  transform: translateY(1px);
}
.u-btn-block { width: 100%; }
.u-btn-icon { font-size: 1.05em; line-height: 1; }
.u-btn-label { line-height: 1; }

.u-btn-sm { height: 28px; padding: 0 10px; font-size: var(--ct-text-xs); }
.u-btn-md { height: 36px; padding: 0 14px; font-size: var(--ct-text-base); }
.u-btn-lg { height: 44px; padding: 0 18px; font-size: var(--ct-text-md); }

.u-btn-primary {
  background: var(--ct-primary);
  color: var(--ct-on-primary);
  border-color: var(--ct-primary);
}
.u-btn-primary:hover:not(:disabled) { background: var(--ct-primary-hover); border-color: var(--ct-primary-hover); }
.u-btn-primary:active:not(:disabled){ background: var(--ct-primary-active); border-color: var(--ct-primary-active); }

.u-btn-secondary {
  background: var(--ct-surface);
  color: var(--ct-fg);
  border-color: var(--ct-border);
}
.u-btn-secondary:hover:not(:disabled) { background: var(--ct-surface-1); border-color: var(--ct-border-strong); }

.u-btn-ghost {
  background: transparent;
  color: var(--ct-fg);
}
.u-btn-ghost:hover:not(:disabled) { background: var(--ct-surface-2); }

.u-btn-subtle {
  background: var(--ct-primary-soft);
  color: var(--ct-primary);
}
.u-btn-subtle:hover:not(:disabled) {
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
}

.u-btn-danger {
  background: var(--ct-danger);
  color: #fff;
  border-color: var(--ct-danger);
}
.u-btn-danger:hover:not(:disabled) { background: color-mix(in srgb, var(--ct-danger) 86%, black); }

.u-btn-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: u-btn-spin 700ms linear infinite;
}
@keyframes u-btn-spin { to { transform: rotate(360deg); } }
</style>
