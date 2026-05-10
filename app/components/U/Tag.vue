<script setup lang="ts">
type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
type Variant = 'soft' | 'solid' | 'outline'
type Size = 'sm' | 'md'

withDefaults(defineProps<{
  tone?: Tone
  variant?: Variant
  size?: Size
}>(), {
  tone: 'neutral',
  variant: 'soft',
  size: 'sm',
})
</script>

<template>
  <span
    class="u-tag"
    :class="[`u-tag-${tone}`, `u-tag-${variant}`, `u-tag-${size}`]"
  >
    <slot />
  </span>
</template>

<style scoped>
.u-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--ct-radius-full);
  font-weight: var(--ct-weight-medium);
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
}
.u-tag-sm { padding: 3px 8px; font-size: 11px; }
.u-tag-md { padding: 4px 10px; font-size: var(--ct-text-xs); }

/* soft */
.u-tag-soft.u-tag-neutral { background: var(--ct-surface-2); color: var(--ct-fg-muted); }
.u-tag-soft.u-tag-primary { background: var(--ct-primary-soft); color: var(--ct-primary); }
.u-tag-soft.u-tag-success { background: var(--ct-success-soft); color: var(--ct-success); }
.u-tag-soft.u-tag-warning { background: var(--ct-warning-soft); color: var(--ct-warning); }
.u-tag-soft.u-tag-danger  { background: var(--ct-danger-soft);  color: var(--ct-danger); }

/* outline */
.u-tag-outline.u-tag-neutral { color: var(--ct-fg-muted); border-color: var(--ct-border); }
.u-tag-outline.u-tag-primary { color: var(--ct-primary); border-color: color-mix(in srgb, var(--ct-primary) 40%, transparent); }
.u-tag-outline.u-tag-success { color: var(--ct-success); border-color: color-mix(in srgb, var(--ct-success) 40%, transparent); }
.u-tag-outline.u-tag-warning { color: var(--ct-warning); border-color: color-mix(in srgb, var(--ct-warning) 40%, transparent); }
.u-tag-outline.u-tag-danger  { color: var(--ct-danger);  border-color: color-mix(in srgb, var(--ct-danger) 40%, transparent); }

/* solid */
.u-tag-solid.u-tag-neutral { background: var(--ct-fg-muted); color: var(--ct-bg); }
.u-tag-solid.u-tag-primary { background: var(--ct-primary); color: var(--ct-on-primary); }
.u-tag-solid.u-tag-success { background: var(--ct-success); color: #fff; }
.u-tag-solid.u-tag-warning { background: var(--ct-warning); color: #fff; }
.u-tag-solid.u-tag-danger  { background: var(--ct-danger);  color: #fff; }
</style>
