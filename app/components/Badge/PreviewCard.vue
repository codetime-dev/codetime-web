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
      <i class="i-tabler-eye text-[15px] text-ct-fg-muted" />
    </template>
    <div class="badge-preview-stage">
      <div class="badge-preview-grid" aria-hidden="true" />
      <div
        v-if="!loaded"
        class="badge-preview-skeleton"
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
    linear-gradient(to right, var(--ct-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--ct-border) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.4;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  pointer-events: none;
}
.badge-preview-skeleton {
  position: relative;
  height: 32px;
  width: 18rem;
  background: var(--ct-surface-2);
  border-radius: var(--ct-radius-md);
  animation: badge-pulse 1.4s ease-in-out infinite;
}
@keyframes badge-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}
</style>
