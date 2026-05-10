<script setup lang="ts">
defineProps<{
  link: string
}>()
const t = useI18N()
const loaded = ref(false)
</script>

<template>
  <PanelSection num="01" :title="t.dashboard.badge.preview.title" flush>
    <template #icon>
      <i class="i-tabler-eye text-surface-dimmed/70 text-[15px]" />
    </template>
    <div class="badge-preview-stage">
      <div class="badge-preview-grid" aria-hidden="true" />
      <div
        v-if="!loaded"
        class="bg-surface-variant-1/55 h-8 w-72 relative animate-pulse"
      />
      <NuxtImg
        v-if="link"
        :class="loaded ? '' : 'hidden'"
        placeholder
        :src="link"
        class="h-8 relative"
        alt="CodeTime Badge"
        @load="loaded = true"
      />
    </div>
  </PanelSection>
</template>

<style scoped>
.badge-preview-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 10rem;
  padding: 2rem 1.5rem;
  overflow: hidden;
}

.badge-preview-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--r-surface-border-color) 60%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--r-surface-border-color) 60%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.18;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  pointer-events: none;
}
</style>
