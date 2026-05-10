<script setup lang="ts">
// Renders its slot only after the placeholder scrolls into the viewport.
// Use to defer heavy below-the-fold widgets (charts, dashboards) so their JS
// chunks are not downloaded, parsed, or executed during the initial paint —
// critical for users on low-power devices or with JIT/Wasm disabled.
const props = withDefaults(defineProps<{
  /** Reserve this height for the placeholder so the swap does not cause CLS. */
  minHeight?: string
  /** IntersectionObserver rootMargin — start mounting before fully visible. */
  rootMargin?: string
}>(), {
  minHeight: '320px',
  rootMargin: '200px',
})

const visible = ref(false)
const root = ref<HTMLElement | null>(null)

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visible.value = true
        io.disconnect()
        break
      }
    }
  }, { rootMargin: props.rootMargin })
  if (root.value) {
 io.observe(root.value)
}
  onUnmounted(() => io.disconnect())
})
</script>

<template>
  <div ref="root" class="lazy-visible" :style="{ minHeight: visible ? undefined : minHeight }">
    <slot v-if="visible" />
  </div>
</template>
