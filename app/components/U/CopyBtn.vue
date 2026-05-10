<script setup lang="ts">
const props = defineProps<{
  value: string
  size?: 'sm' | 'md' | 'lg'
}>()
defineEmits(['click'])
const value = computed(() => props.value)
const t = useI18N()
const c = useClipboard({ source: value })
const ok = autoResetRef(false, 1000)
function onClick() {
  c.copy(value.value)
  ok.value = true
}
</script>

<template>
  <button
    type="button"
    class="copy-btn"
    :class="ok ? 'copy-btn-ok' : ''"
    @click="onClick"
  >
    <i :class="ok ? 'i-tabler-check' : 'i-tabler-copy'" class="text-sm" />
    <span>{{ t.button.copy }}</span>
  </button>
</template>

<style scoped>
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  font-family: var(--ct-font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 12%, transparent);
  border: 0;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease;
  white-space: nowrap;
}

.copy-btn:hover {
  background-color: color-mix(in srgb, var(--color-primary-1) 22%, transparent);
}

.copy-btn-ok {
  color: var(--r-color-secondary-1, #10b981);
  background-color: color-mix(in srgb, var(--r-color-secondary-1, #10b981) 18%, transparent);
}
</style>
