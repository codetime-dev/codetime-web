<script setup lang="ts">
defineProps<{
  link: string
  title?: string
  height?: number | string
}>()
const t = useI18N()
const loaded = ref(false)
</script>

<template>
  <PanelSection num="01" :title="title ?? t.dashboard.badge.preview.title" flush>
    <template #icon>
      <i class="i-tabler-eye text-[15px] text-ct-fg-muted" />
    </template>
    <div class="widget-preview-stage">
      <div class="widget-preview-grid" aria-hidden="true" />
      <div
        v-if="!loaded"
        class="widget-preview-skeleton"
      />
      <img
        v-if="link"
        :key="link"
        :class="loaded ? '' : 'hidden'"
        :src="link"
        class="relative"
        :style="{ height: typeof height === 'number' ? `${height}px` : (height ?? 'auto') }"
        alt="CodeTime Widget"
        @load="loaded = true"
        @error="loaded = true"
      >
    </div>
  </PanelSection>
</template>

<style scoped>
.widget-preview-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  padding: 2rem 1.5rem;
  overflow: hidden;
}

.widget-preview-grid {
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

.widget-preview-skeleton {
  position: relative;
  height: 64px;
  width: 18rem;
  background: var(--ct-surface-2);
  border-radius: var(--ct-radius-md);
  animation: widget-pulse 1.4s ease-in-out infinite;
}

@keyframes widget-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}
</style>
