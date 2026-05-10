<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  width?: string
  closeOnBackdrop?: boolean
}>(), {
  width: '480px',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

function close() {
  emit('update:modelValue', false)
}

function onBackdrop() {
  if (props.closeOnBackdrop) {
 close()
}
}

function onKey(ev: KeyboardEvent) {
  if (ev.key === 'Escape') {
 close()
}
}

watch(() => props.modelValue, (open) => {
  if (globalThis.window === undefined) {
 return
}
  if (open) {
 globalThis.addEventListener('keydown', onKey)
}
  else {
 globalThis.removeEventListener('keydown', onKey)
}
})

onBeforeUnmount(() => {
  if (globalThis.window !== undefined) {
 globalThis.removeEventListener('keydown', onKey)
}
})
</script>

<template>
  <Teleport to="body">
    <Transition name="u-modal">
      <div v-if="modelValue" class="u-modal-root">
        <div class="u-modal-backdrop" @click="onBackdrop" />
        <div class="u-modal-panel" :style="{ width }">
          <header v-if="title || $slots.header" class="u-modal-head">
            <slot name="header">
              <h3 class="u-modal-title">
                {{ title }}
              </h3>
            </slot>
            <button class="u-modal-close" aria-label="Close" @click="close">
              <i class="i-tabler-x" />
            </button>
          </header>
          <div class="u-modal-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="u-modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.u-modal-root {
  position: fixed;
  inset: 0;
  z-index: var(--ct-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.u-modal-backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, #000 55%, transparent);
  backdrop-filter: blur(2px);
}
.u-modal-panel {
  position: relative;
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--ct-surface);
  color: var(--ct-fg);
  border: 1px solid var(--ct-border);
  border-radius: 0;
  box-shadow: var(--ct-shadow-lg);
  overflow: hidden;
}
.u-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ct-border-subtle);
}
.u-modal-title {
  margin: 0;
  font-size: var(--ct-text-lg);
  font-weight: var(--ct-weight-semibold);
}
.u-modal-close {
  background: transparent;
  border: 0;
  color: var(--ct-fg-subtle);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--ct-radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.u-modal-close:hover { background: var(--ct-surface-2); color: var(--ct-fg); }
.u-modal-body { padding: 20px; overflow: auto; }
.u-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--ct-border-subtle);
  background: var(--ct-surface-1);
}

.u-modal-enter-active, .u-modal-leave-active {
  transition: opacity var(--ct-duration-base) var(--ct-ease);
}
.u-modal-enter-active .u-modal-panel,
.u-modal-leave-active .u-modal-panel {
  transition: transform var(--ct-duration-base) var(--ct-ease),
              opacity var(--ct-duration-base) var(--ct-ease);
}
.u-modal-enter-from, .u-modal-leave-to { opacity: 0; }
.u-modal-enter-from .u-modal-panel,
.u-modal-leave-to .u-modal-panel {
  transform: translateY(8px) scale(0.98);
  opacity: 0;
}
</style>
