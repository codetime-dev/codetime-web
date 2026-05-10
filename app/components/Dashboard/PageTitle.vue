<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  loading?: boolean
  num?: string
}>()
</script>

<template>
  <div class="dash-page-title-container">
    <div class="dash-title-divider" aria-hidden="true">
      <span class="dash-title-divider-fill" />
    </div>
    <header class="dash-page-title relative">
      <div class="mx-auto px-5.5 py-7 max-w-7xl w-full">
        <div class="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
          <div
            v-if="loading"
            class="bg-surface-variant-1/40 h-7 w-48 animate-pulse"
          />
          <h1
            v-else
            class="text-[18px] text-surface tracking-[0.22em] font-medium font-mono"
          >
            {{ title }}
          </h1>
        </div>
        <div
          v-if="loading"
          class="bg-surface-variant-1/30 mt-3 h-3 w-72 animate-pulse"
        />
        <p
          v-else-if="description"
          class="text-surface-dimmed/80 text-[12.5px] tracking-[0.04em] font-mono mt-2"
        >
          {{ description }}
        </p>
      </div>
    </header>
    <div class="dash-title-divider" aria-hidden="true">
      <span class="dash-title-divider-fill" />
    </div>
  </div>
</template>

<style scoped>
.dash-page-title-container {
  width: 100%;
}

.dash-title-divider {
  position: relative;
  height: 22px;
}

.dash-title-divider::before,
.dash-title-divider::after {
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

.dash-title-divider::before {
  top: 0;
}

.dash-title-divider::after {
  bottom: 0;
}

.dash-title-divider-fill {
  position: absolute;
  inset: 1px 0;
  margin-inline: auto;
  max-width: 80rem;
  background-color: var(--r-surface-border-color);
  opacity: 0.22;
  -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><line x1='0' y1='8' x2='8' y2='0' stroke='black' stroke-width='1.2'/><line x1='-1' y1='1' x2='1' y2='-1' stroke='black' stroke-width='1.2'/><line x1='7' y1='9' x2='9' y2='7' stroke='black' stroke-width='1.2'/></svg>");
  mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><line x1='0' y1='8' x2='8' y2='0' stroke='black' stroke-width='1.2'/><line x1='-1' y1='1' x2='1' y2='-1' stroke='black' stroke-width='1.2'/><line x1='7' y1='9' x2='9' y2='7' stroke='black' stroke-width='1.2'/></svg>");
  -webkit-mask-size: 8px 8px;
  mask-size: 8px 8px;
  -webkit-mask-repeat: repeat;
  mask-repeat: repeat;
  pointer-events: none;
}
</style>
