<script setup lang="ts">
type Size = 'sm' | 'md' | 'lg'

withDefaults(defineProps<{
  modelValue?: string | number
  size?: Size
  placeholder?: string
  type?: string
  disabled?: boolean
  invalid?: boolean
  iconLeft?: string
  iconRight?: string
}>(), {
  size: 'md',
  type: 'text',
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

function onInput(ev: Event) {
  emit('update:modelValue', (ev.target as HTMLInputElement).value)
}
</script>

<template>
  <label
    class="u-input"
    :class="[`u-input-${size}`, { 'u-input-invalid': invalid, 'u-input-disabled': disabled }]"
  >
    <i v-if="iconLeft" :class="iconLeft" class="u-input-icon" />
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    >
    <i v-if="iconRight" :class="iconRight" class="u-input-icon" />
  </label>
</template>

<style scoped>
.u-input {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  color: var(--ct-fg);
  transition: border-color var(--ct-duration-fast) var(--ct-ease),
              box-shadow var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.u-input:hover:not(.u-input-disabled) { border-color: var(--ct-border-strong); }
.u-input:focus-within {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
.u-input-invalid {
  border-color: var(--ct-danger);
}
.u-input-invalid:focus-within {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-danger) 18%, transparent);
}
.u-input-disabled { opacity: 0.6; cursor: not-allowed; }

.u-input input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  color: inherit;
  font: inherit;
}
.u-input input::placeholder { color: var(--ct-fg-subtle); }

.u-input-icon { color: var(--ct-fg-subtle); font-size: 1.05em; line-height: 1; }

.u-input-sm { padding: 0 10px; height: 30px; font-size: var(--ct-text-sm); }
.u-input-md { padding: 0 12px; height: 36px; font-size: var(--ct-text-base); }
.u-input-lg { padding: 0 14px; height: 44px; font-size: var(--ct-text-md); }
</style>
