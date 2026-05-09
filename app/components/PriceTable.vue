<script setup lang="ts">
const variant = ref<'monthly' | 'annual' | 'one-time'>('monthly')
const isAnuual = computed({
  get: () => variant.value === 'annual',
  set: (val) => {
    variant.value = val ? 'annual' : 'monthly'
  },
})
const t = useI18N()
</script>

<template>
  <div>
    <div class="mb-10 flex justify-center">
      <LandingPriceTab v-model="variant" />
    </div>
    <div class="price-grid mx-auto max-w-4xl">
      <!-- Basic Plan -->
      <div class="price-col px-7 py-8 flex flex-col h-full relative">
        <div class="mb-6">
          <span class="text-[11px] text-surface-dimmed tracking-[0.16em] font-mono uppercase">{{ t.plan.basic.title }}</span>
          <div class="mt-3 flex gap-1.5 items-end">
            <span class="text-5xl text-surface tracking-tight font-light">$0</span>
            <span class="text-sm text-surface-dimmed mb-1.5">{{ t.plan.basic.forever }}</span>
          </div>
          <p class="text-[13px] text-surface-dimmed leading-relaxed mt-2">
            {{ t.landing.pricing.description }}
          </p>
        </div>

        <div class="flex-1 space-y-2.5">
          <FeatureItem>{{ t.plan.basic.features.item.saveHistory }}</FeatureItem>
          <FeatureItem>{{ t.plan.basic.features.item.browseRecent }}</FeatureItem>
          <FeatureItem>{{ t.plan.basic.features.item.codetimeTrend }}</FeatureItem>
          <FeatureItem>{{ t.plan.basic.features.item.codetimeLanguaeTrend }}</FeatureItem>
          <FeatureItem>{{ t.plan.basic.features.item.codetimeProjectTrend }}</FeatureItem>
          <FeatureItem>{{ t.plan.basic.features.item.badge }}</FeatureItem>
          <FeatureItem>{{ t.plan.basic.features.item.export }}</FeatureItem>
          <FeatureItem not-yet>
            {{ t.plan.basic.features.item.import }}
          </FeatureItem>
          <FeatureItem not-yet>
            {{ t.plan.basic.features.item.more }}
          </FeatureItem>
        </div>

        <div class="mt-8">
          <div class="bg-surface-variant-1/20 text-surface-dimmed/70 text-[13px] tracking-[0.04em] font-mono py-2.5 text-center rounded-xl">
            {{ t.plan.basic.button }}
          </div>
        </div>
      </div>

      <!-- Pro Plan -->
      <div class="price-col price-col-pro h-full relative">
        <div class="price-col-glow" aria-hidden="true" />
        <div class="px-7 py-8 flex flex-col h-full relative">
          <div class="mb-6">
            <div class="flex gap-3 items-center justify-between">
              <span class="text-[11px] text-surface-dimmed tracking-[0.16em] font-mono uppercase">{{ t.plan.pro.title }}</span>
              <span
                class="text-[10px] text-white tracking-[0.14em] font-mono px-2.5 py-0.5 rounded-full uppercase"
                :class="isAnuual ? 'bg-error' : 'bg-primary'"
              >
                {{ !isAnuual ? t.plan.mostPopular : t.plan.bestValue }}
              </span>
            </div>
            <div class="mt-3 flex gap-1.5 items-end">
              <span
                class="text-5xl tracking-tight font-light"
                :class="isAnuual ? 'text-error' : 'text-primary'"
              >
                {{ isAnuual ? '$36' : '$4' }}
              </span>
              <span class="text-sm text-surface-dimmed mb-1.5">{{ isAnuual ? t.plan.pro.preYear : t.plan.pro.preMonth }}</span>
            </div>
            <p class="text-[13px] text-surface-dimmed leading-relaxed mt-2">
              {{ t.landing.pricing.description }}
            </p>
          </div>

          <div class="flex-1 space-y-2.5">
            <FeatureItem>{{ t.plan.pro.features.item.include }}</FeatureItem>
            <FeatureItem>{{ t.plan.pro.features.item.browseAll }}</FeatureItem>
            <FeatureItem not-yet>
              {{ t.plan.pro.features.item.rule }}
            </FeatureItem>
            <FeatureItem not-yet>
              {{ t.plan.pro.features.item.tag }}
            </FeatureItem>
          </div>

          <div class="mt-8">
            <ProPricePaper :variant="variant" embedded />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.price-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  align-items: stretch;
}

@media (min-width: 1024px) {
  .price-grid {
    grid-template-columns: 1fr 1fr;
  }
  .price-grid > .price-col + .price-col {
    border-left: 1px solid color-mix(in srgb, var(--r-surface-border-color) 35%, transparent);
  }
}

.price-col-pro {
  isolation: isolate;
}

.price-col-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 0%,
    color-mix(in srgb, var(--color-primary-1) 14%, transparent) 0%,
    transparent 60%);
  pointer-events: none;
  z-index: -1;
}
</style>
