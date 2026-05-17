<script setup lang="ts">
// Vibe page section frame. Mirrors agent-time's Section.vue but uses
// the codetime-web-v3 ct-* design tokens so it blends with the
// dashboard layout. The top diagonal-stripe divider replaces the
// agent-time hairline so consecutive sections stack visually.

defineProps<{
  num?: string
  title: string
  meta?: string
  flush?: boolean
}>()
</script>

<template>
  <section class="vibe-section">
    <div class="vibe-section-divider" aria-hidden="true">
      <span class="vibe-section-divider-fill" />
    </div>
    <header class="vibe-section-head">
      <span v-if="num" class="vibe-section-num mono">{{ num }}</span>
      <slot name="icon" />
      <span class="vibe-section-title">{{ title }}</span>
      <span class="vibe-section-meta mono">{{ meta ?? "" }}</span>
    </header>
    <div class="vibe-section-body" :class="{ flush }">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.vibe-section { position: relative; }

.vibe-section-divider { position: relative; height: 22px; }
.vibe-section:first-child .vibe-section-divider { display: none; }
.vibe-section-divider::before,
.vibe-section-divider::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: var(--ct-border);
  pointer-events: none;
}
.vibe-section-divider::before { top: 0; }
.vibe-section-divider::after  { bottom: 0; }
.vibe-section-divider-fill {
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
}

.vibe-section-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--ct-border);
  background: var(--ct-surface-1);
}

.vibe-section-num {
  position: relative;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--ct-primary);
  padding-left: 12px;
  font-variant-numeric: tabular-nums;
}
.vibe-section-num::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 6px;
  height: 1px;
  background: var(--ct-primary);
  transform: translateY(-50%);
  opacity: 0.6;
}

.vibe-section-title {
  font-size: 13px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ct-fg);
  font-weight: var(--ct-weight-medium);
}

.vibe-section-meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--ct-fg-muted);
  letter-spacing: 0.04em;
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.vibe-section-body { padding: 18px 22px; }
.vibe-section-body.flush { padding: 0; }

@media (max-width: 880px) {
  .vibe-section-head { flex-wrap: wrap; }
  .vibe-section-head .vibe-section-meta {
    flex-basis: 100%;
    margin-left: 0;
    text-align: left;
  }
}
</style>
