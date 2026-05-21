<script setup lang="ts">
defineProps<{
  modelValue: number
  min?: number
  max?: number
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = Number(raw)
  emit('update:modelValue', Number.isFinite(n) ? n : 0)
}
</script>

<template>
  <input
    :value="modelValue"
    class="line-input"
    type="number"
    :min="min"
    :max="max"
    :placeholder="placeholder"
    @input="onInput"
  >
</template>

<style scoped>
.line-input {
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-family: var(--ct-font-sans);
  font-size: var(--ct-text-base);
  color: var(--ct-fg);
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  outline: 0;
  transition: border-color var(--ct-duration-fast) var(--ct-ease), box-shadow var(--ct-duration-fast) var(--ct-ease);
}
.line-input:hover { border-color: var(--ct-border-strong); }
.line-input:focus {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
.line-input::placeholder { color: var(--ct-fg-subtle); }
.line-input[type="number"]::-webkit-outer-spin-button,
.line-input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.line-input[type="number"] { -moz-appearance: textfield; }
</style>
