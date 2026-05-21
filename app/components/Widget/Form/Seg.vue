<script setup lang="ts" generic="T extends string | number">
type Option = {
  id: T
  label: string
  // Renders + disables + tags "PRO" when surrounding `isPro` is false.
  proOnly?: boolean
  // Plain disabled — no PRO tag (e.g. an option already taken by a sibling slot).
  disabled?: boolean
}

const props = defineProps<{
  modelValue: T
  options: Option[]
  isPro?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

function isLocked(opt: Option): boolean {
  if (opt.disabled) {
    return true
  }
  return Boolean(opt.proOnly && props.isPro === false)
}

function pick(opt: Option) {
  if (isLocked(opt)) {
    return
  }
  emit('update:modelValue', opt.id)
}
</script>

<template>
  <div class="seg" :data-count="options.length">
    <button
      v-for="opt in options"
      :key="String(opt.id)"
      type="button"
      class="seg-btn"
      :class="modelValue === opt.id ? 'seg-btn-active' : ''"
      :disabled="isLocked(opt)"
      @click="pick(opt)"
    >
      {{ opt.label }}
      <span v-if="opt.proOnly && isPro === false" class="seg-pro">PRO</span>
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: inline-flex;
  flex-wrap: wrap;
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  background: var(--ct-surface);
}
.seg-btn {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  padding: 8px 14px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  background: transparent;
  border: 0;
  border-left: 1px solid var(--ct-border-subtle);
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  white-space: nowrap;
}
.seg-btn:first-child { border-left: 0; }
.seg-btn:hover:not(:disabled) { color: var(--ct-fg); background-color: var(--ct-surface-2); }
.seg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.seg-btn-active {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}
.seg-pro {
  font-size: 9px;
  letter-spacing: 0.08em;
  padding: 1px 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ct-primary) 22%, transparent);
  color: var(--ct-primary);
  font-weight: var(--ct-weight-semibold);
}
</style>
