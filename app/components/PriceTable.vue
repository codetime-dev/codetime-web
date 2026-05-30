<script setup lang="ts">
const variant = ref<'monthly' | 'annual' | 'one-time'>('monthly')
const isAnuual = computed({
  get: () => variant.value === 'annual',
  set: (val) => {
    variant.value = val ? 'annual' : 'monthly'
  },
})
const t = useI18N()
const { formatVariantPrice } = useProPricing()
</script>

<template>
  <div>
    <div class="mb-12 flex justify-center">
      <LandingPriceTab v-model="variant" />
    </div>
    <div class="price-grid mx-auto max-w-5xl">
      <!-- Basic Plan -->
      <div class="price-col flex flex-col h-full relative">
        <div class="price-col-inner">
          <div class="mb-7">
            <span class="text-[12px] text-ct-fg-muted tracking-[0.14em] font-mono uppercase">{{ t.plan.basic.title }}</span>
            <div class="mt-4 flex gap-2 items-end">
              <span class="text-5xl text-ct-fg leading-none tracking-tight font-light">$0</span>
              <span class="text-sm text-ct-fg-muted mb-1">{{ t.plan.basic.forever }}</span>
            </div>
            <p class="text-[14px] text-ct-fg-muted leading-relaxed mt-3">
              {{ t.landing.pricing.description }}
            </p>
          </div>

          <div class="flex-1 space-y-3">
            <FeatureItem>{{ t.plan.basic.features.item.saveHistory }}</FeatureItem>
            <FeatureItem>{{ t.plan.basic.features.item.browseRecent }}</FeatureItem>
            <FeatureItem>{{ t.plan.basic.features.item.codetimeTrend }}</FeatureItem>
            <FeatureItem>{{ t.plan.basic.features.item.codetimeLanguaeTrend }}</FeatureItem>
            <FeatureItem>{{ t.plan.basic.features.item.codetimeProjectTrend }}</FeatureItem>
            <FeatureItem>{{ t.plan.basic.features.item.badge }}</FeatureItem>
            <FeatureItem>{{ t.plan.basic.features.item.agent }}</FeatureItem>
            <FeatureItem>{{ t.plan.basic.features.item.export }}</FeatureItem>
            <FeatureItem not-yet>
              {{ t.plan.basic.features.item.import }}
            </FeatureItem>
            <FeatureItem not-yet>
              {{ t.plan.basic.features.item.more }}
            </FeatureItem>
          </div>

          <div class="mt-8">
            <div class="price-cta price-cta-basic">
              {{ t.plan.basic.button }}
            </div>
          </div>
        </div>
      </div>

      <!-- Pro Plan -->
      <div class="price-col price-col-pro h-full relative">
        <div class="price-col-glow" aria-hidden="true" />
        <div class="price-col-inner relative">
          <div class="mb-7">
            <div class="flex gap-3 items-center justify-between">
              <span class="text-[12px] text-ct-fg-muted tracking-[0.14em] font-mono uppercase">{{ t.plan.pro.title }}</span>
              <span
                class="price-badge"
                :class="isAnuual ? 'price-badge-best' : 'price-badge-popular'"
              >
                {{ !isAnuual ? t.plan.mostPopular : t.plan.bestValue }}
              </span>
            </div>
            <div class="mt-4 flex gap-2 items-end">
              <span
                class="text-5xl leading-none tracking-tight font-light"
                :class="isAnuual ? 'text-error' : 'text-primary'"
              >
                {{ formatVariantPrice(variant) }}
              </span>
              <span class="text-sm text-ct-fg-muted mb-1">{{ isAnuual ? t.plan.pro.preYear : t.plan.pro.preMonth }}</span>
            </div>
            <p class="text-[14px] text-ct-fg-muted leading-relaxed mt-3">
              {{ t.landing.pricing.description }}
            </p>
          </div>

          <div class="flex-1 space-y-3">
            <FeatureItem>{{ t.plan.pro.features.item.include }}</FeatureItem>
            <FeatureItem>{{ t.plan.pro.features.item.browseAll }}</FeatureItem>
            <FeatureItem>{{ t.plan.pro.features.item.workspace }}</FeatureItem>
            <FeatureItem>{{ t.plan.pro.features.item.tag }}</FeatureItem>
            <FeatureItem>{{ t.plan.pro.features.item.rule }}</FeatureItem>
            <FeatureItem>{{ t.plan.pro.features.item.widgetCustom }}</FeatureItem>
            <FeatureItem>{{ t.plan.pro.features.item.widgetUnlimited }}</FeatureItem>
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
  gap: 20px;
  align-items: stretch;
}

@media (min-width: 1024px) {
  .price-grid {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}

.price-col {
  border: 1px solid var(--ct-border);
  border-radius: 20px;
  background: var(--ct-surface);
  overflow: hidden;
  transition: border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease;
}
.price-col:hover {
  border-color: color-mix(in srgb, var(--ct-primary) 25%, var(--ct-border));
  transform: translateY(-2px);
}

.price-col-inner {
  padding: 32px 30px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.price-col-pro {
  isolation: isolate;
  border-color: color-mix(in srgb, var(--color-primary-1) 35%, var(--ct-border));
}
.price-col-pro:hover {
  border-color: color-mix(in srgb, var(--color-primary-1) 60%, var(--ct-border));
}

.price-col-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 0%,
    color-mix(in srgb, var(--color-primary-1) 12%, transparent) 0%,
    transparent 65%);
  pointer-events: none;
  z-index: 0;
}

.price-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  letter-spacing: 0.12em;
  font-family: var(--ct-font-mono);
  padding: 4px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  color: #fff;
}
.price-badge-popular { background: var(--ct-primary); }
.price-badge-best { background: var(--ct-error, #e5484d); }

.price-cta {
  font-size: 14px;
  font-family: var(--ct-font-mono);
  letter-spacing: 0.04em;
  padding: 12px 16px;
  text-align: center;
  border-radius: 12px;
  background: var(--ct-surface-1);
  color: var(--ct-fg-muted);
  border: 1px solid var(--ct-border);
}
</style>
