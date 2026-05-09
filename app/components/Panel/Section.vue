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
    <header class="up-section-header bg-surface-variant-1/30 px-5.5 py-3 flex flex-wrap gap-3.5 items-center sm:flex-nowrap sm:gap-3.5">
      <span class="up-section-num text-[12px] tracking-[0.18em] font-mono tabular-nums">{{ num }}</span>
      <slot name="icon" />
      <span class="text-[13px] text-surface tracking-[0.22em] font-medium uppercase">{{ title }}</span>
      <span
        v-if="meta"
        class="text-surface-dimmed/80 text-[12px] tracking-[0.04em] font-mono ml-0 ml-auto text-left text-right flex-basis-full min-w-0 break-words tabular-nums sm:ml-auto sm:text-right sm:flex-none"
      >{{ meta }}</span>
    </header>
    <div :class="flush ? '' : 'px-5.5 py-4.5'">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.up-section {
  position: relative;
}

.up-section-header {
  border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 40%, transparent);
}

.up-section-divider {
  position: relative;
  height: 22px;
}

.up-section:first-child .up-section-divider {
  display: none;
}

.up-section-divider::before,
.up-section-divider::after {
  content: "";
  position: absolute;
  left: 50%;
  width: 100vw;
  height: 1px;
  background: var(--r-surface-border-color);
  opacity: 0.32;
  transform: translateX(-50%);
  pointer-events: none;
}

.up-section-divider::before {
  top: 0;
}

.up-section-divider::after {
  bottom: 0;
}

.up-section-divider-fill {
  position: absolute;
  inset: 1px 0;
  background-color: var(--r-surface-border-color);
  opacity: 0.22;
  -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><line x1='0' y1='8' x2='8' y2='0' stroke='black' stroke-width='1.2'/><line x1='-1' y1='1' x2='1' y2='-1' stroke='black' stroke-width='1.2'/><line x1='7' y1='9' x2='9' y2='7' stroke='black' stroke-width='1.2'/></svg>");
  mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><line x1='0' y1='8' x2='8' y2='0' stroke='black' stroke-width='1.2'/><line x1='-1' y1='1' x2='1' y2='-1' stroke='black' stroke-width='1.2'/><line x1='7' y1='9' x2='9' y2='7' stroke='black' stroke-width='1.2'/></svg>");
  -webkit-mask-size: 8px 8px;
  mask-size: 8px 8px;
  -webkit-mask-repeat: repeat;
  mask-repeat: repeat;
}

.up-section-num {
  position: relative;
  color: var(--color-primary-1);
  padding-left: 12px;
}

.up-section-num::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 6px;
  height: 1px;
  background: var(--color-primary-1);
  transform: translateY(-50%);
  opacity: 0.65;
}
</style>
