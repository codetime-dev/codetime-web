<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  loading?: boolean
  num?: string
}>()
</script>

<template>
  <div class="dash-page-title-wrap">
    <div class="dash-stripes" aria-hidden="true">
      <span class="dash-stripes-fill" />
    </div>
    <header class="dash-page-title">
      <div class="dash-page-title-inner">
        <div
          v-if="loading"
          class="dash-title-skeleton dash-title-skeleton-lg"
        />
        <h1 v-else class="dash-title-text">
          {{ title }}
        </h1>
        <div
          v-if="loading"
          class="dash-title-skeleton dash-title-skeleton-sm"
        />
        <p v-else-if="description" class="dash-title-desc">
          {{ description }}
        </p>
      </div>
    </header>
    <div class="dash-stripes" aria-hidden="true">
      <span class="dash-stripes-fill" />
    </div>
  </div>
</template>

<style scoped>
.dash-page-title-wrap { width: 100%; }
.dash-page-title { width: 100%; }

.dash-stripes { position: relative; height: 22px; }
.dash-stripes::before,
.dash-stripes::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--ct-border);
  pointer-events: none;
}
.dash-stripes::before { top: 0; }
.dash-stripes::after  { bottom: 0; }
.dash-stripes-fill {
  position: absolute;
  inset: 1px 0;
  background-color: var(--ct-border);
  opacity: 0.55;
  -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><line x1='0' y1='8' x2='8' y2='0' stroke='black' stroke-width='1.2'/><line x1='-1' y1='1' x2='1' y2='-1' stroke='black' stroke-width='1.2'/><line x1='7' y1='9' x2='9' y2='7' stroke='black' stroke-width='1.2'/></svg>");
          mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><line x1='0' y1='8' x2='8' y2='0' stroke='black' stroke-width='1.2'/><line x1='-1' y1='1' x2='1' y2='-1' stroke='black' stroke-width='1.2'/><line x1='7' y1='9' x2='9' y2='7' stroke='black' stroke-width='1.2'/></svg>");
  -webkit-mask-size: 8px 8px;
          mask-size: 8px 8px;
  -webkit-mask-repeat: repeat;
          mask-repeat: repeat;
  pointer-events: none;
}
.dash-page-title-inner {
  max-width: 80rem;
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px;
}
.dash-title-text {
  font-size: var(--ct-text-2xl);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  letter-spacing: var(--ct-tracking-tight);
  line-height: 1.2;
}
.dash-title-desc {
  margin-top: 8px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  line-height: 1.55;
}
.dash-title-skeleton {
  background: var(--ct-surface-2);
  animation: dash-pulse 1.4s ease-in-out infinite;
}
.dash-title-skeleton-lg { height: 28px; width: 12rem; }
.dash-title-skeleton-sm { height: 12px; width: 18rem; margin-top: 12px; }
@keyframes dash-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}
</style>
