<script setup lang="ts">
defineProps<{
  num: string
  title: string
  meta?: string
  flush?: boolean
}>()
</script>

<template>
  <section class="up-section">
    <div class="up-section-divider" aria-hidden="true">
      <span class="up-section-divider-fill" />
    </div>
    <header class="up-section-header">
      <span class="up-section-num tabular-nums">{{ num }}</span>
      <slot name="icon" />
      <span class="up-section-title">{{ title }}</span>
      <span v-if="meta" class="up-section-meta tabular-nums">{{ meta }}</span>
    </header>
    <div :class="flush ? '' : 'up-section-body'">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.up-section {
  position: relative;
  background: transparent;
}
/* Diagonal-stripes divider — shown between adjacent sections, hidden
   on the first section so it doesn't double up against page header. */
.up-section-divider {
  position: relative;
  height: 22px;
}
.up-section:first-child .up-section-divider { display: none; }
.up-section-divider::before,
.up-section-divider::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--ct-border);
  pointer-events: none;
}
.up-section-divider::before { top: 0; }
.up-section-divider::after  { bottom: 0; }
.up-section-divider-fill {
  position: absolute;
  inset: 1px 0;
  background-color: var(--ct-border);
  opacity: 0.85;
  -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><line x1='0' y1='8' x2='8' y2='0' stroke='black' stroke-width='1.2'/><line x1='-1' y1='1' x2='1' y2='-1' stroke='black' stroke-width='1.2'/><line x1='7' y1='9' x2='9' y2='7' stroke='black' stroke-width='1.2'/></svg>");
          mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><line x1='0' y1='8' x2='8' y2='0' stroke='black' stroke-width='1.2'/><line x1='-1' y1='1' x2='1' y2='-1' stroke='black' stroke-width='1.2'/><line x1='7' y1='9' x2='9' y2='7' stroke='black' stroke-width='1.2'/></svg>");
  -webkit-mask-size: 8px 8px;
          mask-size: 8px 8px;
  -webkit-mask-repeat: repeat;
          mask-repeat: repeat;
  pointer-events: none;
}

.up-section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: var(--ct-surface-1);
  border-bottom: 1px solid var(--ct-border);
}
@media (min-width: 640px) {
  .up-section-header { flex-wrap: nowrap; }
}

.up-section-num {
  position: relative;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-primary);
  padding-left: 12px;
}
.up-section-num::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 6px;
  height: 2px;
  background: var(--ct-primary);
  transform: translateY(-50%);
  border-radius: 2px;
}

.up-section-title {
  font-size: var(--ct-text-base);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
}

.up-section-meta {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  margin-left: 0;
  text-align: left;
  flex-basis: 100%;
  min-width: 0;
  word-break: break-word;
}
@media (min-width: 640px) {
  .up-section-meta { margin-left: auto; flex-basis: auto; text-align: right; }
}

.up-section-body { padding: 10px 18px; }
</style>
