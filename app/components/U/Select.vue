<script setup lang="ts" generic="T extends string | number">
type Size = 'sm' | 'md' | 'lg'

defineProps<{
  modelValue?: T
  options: { label: string, value: T, disabled?: boolean }[]
  size?: Size
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: T): void
}>()

function onChange(ev: Event) {
  const v = (ev.target as HTMLSelectElement).value as T
  emit('update:modelValue', v)
}
</script>

<template>
  <label
    class="u-select"
    :class="[`u-select-${size ?? 'md'}`, { 'u-select-disabled': disabled }]"
  >
    <select
      :value="modelValue"
      :disabled="disabled"
      @change="onChange"
    >
      <option v-if="placeholder" value="" disabled>
        {{ placeholder }}
      </option>
      <option
        v-for="o in options"
        :key="String(o.value)"
        :value="o.value"
        :disabled="o.disabled"
      >
        {{ o.label }}
      </option>
    </select>
    <i class="u-select-caret i-tabler-chevron-down" />
  </label>
</template>

<style scoped>
.u-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  color: var(--ct-fg);
  transition: border-color var(--ct-duration-fast) var(--ct-ease),
              box-shadow var(--ct-duration-fast) var(--ct-ease);
}
.u-select:hover:not(.u-select-disabled) { border-color: var(--ct-border-strong); }
.u-select:focus-within {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
.u-select-disabled { opacity: 0.6; cursor: not-allowed; }

.u-select select {
  appearance: none;
  flex: 1;
  min-width: 0;
  width: 100%;
  background: transparent;
  border: 0;
  outline: 0;
  color: inherit;
  font: inherit;
  padding-right: 28px;
  cursor: pointer;
}
.u-select-caret {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: var(--ct-fg-subtle);
}

.u-select-sm { padding: 0 10px; height: 30px; font-size: var(--ct-text-sm); }
.u-select-md { padding: 0 12px; height: 36px; font-size: var(--ct-text-base); }
.u-select-lg { padding: 0 14px; height: 44px; font-size: var(--ct-text-md); }
</style>
