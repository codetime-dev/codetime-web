<script setup lang="ts">
// Hex color picker with text input + preset swatches + reset button.
// v-model binds to the raw hex string (no leading "#", to match how
// the SVG endpoint accepts ?color=... params).

import type { ColorPreset } from './presets'
import { isValidHex, stripHash } from './presets'

const props = defineProps<{
  modelValue: string
  presets: ColorPreset[]
  // Defaults to enabled; pass `false` to lock the control behind Pro.
  enabled?: boolean
  placeholder?: string
  resetTitle?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function withHash(v: string) {
  const trimmed = v.trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

const disabled = computed(() => props.enabled === false)
const preview = computed(() => isValidHex(props.modelValue) ? withHash(props.modelValue) : '')

function onInput(e: Event) {
  if (disabled.value) {
    return
  }
  const raw = (e.target as HTMLInputElement).value
  emit('update:modelValue', stripHash(raw))
}

function pick(hex: string) {
  if (disabled.value) {
    return
  }
  // Toggle off when clicking the currently-selected swatch.
  const next = withHash(props.modelValue).toLowerCase() === hex.toLowerCase() ? '' : stripHash(hex)
  emit('update:modelValue', next)
}

function reset() {
  if (disabled.value) {
    return
  }
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="color-control" :class="disabled ? 'color-control-disabled' : ''">
    <div class="color-input-wrap">
      <span class="color-swatch-preview" :style="{ background: preview || 'var(--ct-surface-2)' }" />
      <span class="color-hash">#</span>
      <input
        :value="modelValue"
        class="line-input color-textfield"
        type="text"
        :placeholder="placeholder ?? '10b981'"
        autocomplete="off"
        spellcheck="false"
        :disabled="disabled"
        @input="onInput"
      >
    </div>
    <div class="color-presets">
      <button
        v-for="p in presets"
        :key="p.hex"
        type="button"
        class="color-swatch"
        :class="withHash(modelValue).toLowerCase() === p.hex.toLowerCase() ? 'color-swatch-active' : ''"
        :style="{ background: p.hex }"
        :aria-label="p.label"
        :title="p.label"
        :disabled="disabled"
        @click="pick(p.hex)"
      />
      <button
        type="button"
        class="color-swatch color-swatch-reset"
        :class="!modelValue ? 'color-swatch-active' : ''"
        :title="resetTitle ?? 'Default'"
        :disabled="disabled"
        @click="reset"
      >
        <i class="i-tabler-circle-off" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.color-control {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.25rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.color-control-disabled { opacity: 0.5; }
.color-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex: 1 1 auto;
  min-width: 0;
}
.color-swatch-preview {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px var(--ct-border-strong);
  border-radius: var(--ct-radius-sm);
}
.color-hash {
  font-family: var(--ct-font-mono);
  font-size: 13px;
  color: var(--ct-fg-subtle);
  flex-shrink: 0;
}
.color-textfield {
  width: 11rem;
  min-width: 6rem;
  flex: 1 1 11rem;
  letter-spacing: 0.05em;
  font-family: var(--ct-font-mono);
}

.color-presets {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin-left: auto;
}
.color-swatch {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--ct-border);
  transition: transform 160ms ease, box-shadow 160ms ease;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.color-swatch:hover:not(:disabled) { transform: translateY(-1px); }
.color-swatch:disabled { cursor: not-allowed; transform: none; }
.color-swatch-active {
  box-shadow: inset 0 0 0 2px var(--ct-bg), 0 0 0 1.5px var(--color-primary-1);
}
.color-swatch-reset { background: transparent; color: var(--ct-fg-subtle); font-size: 14px; }

.line-input {
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: var(--ct-text-base);
  color: var(--ct-fg);
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  outline: 0;
  transition: border-color var(--ct-duration-fast) var(--ct-ease), box-shadow var(--ct-duration-fast) var(--ct-ease);
}
.line-input:hover:not(:disabled) { border-color: var(--ct-border-strong); }
.line-input:focus {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
.line-input::placeholder { color: var(--ct-fg-subtle); }
.line-input:disabled { cursor: not-allowed; background: var(--ct-surface-2); }
</style>
