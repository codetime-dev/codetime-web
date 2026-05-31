<script setup lang="ts">
const props = defineProps<{
  variant: 'monthly' | 'annual' | 'one-time'
  embedded?: boolean
}>()
const isAnuual = computed(() => props.variant === 'annual')
const isOneTime = computed(() => props.variant === 'one-time')
const user = useUser()

const t = useI18N()

function onLogin() {
  if (globalThis.window === undefined) {
    return
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const { getCheckoutLink } = useCheckoutLink(isAnuual, isOneTime)
const { formatVariantPrice } = useProPricing()

async function toCheckoutLink() {
  if (globalThis.window === undefined) {
    return
  }
  const checkoutLink = await getCheckoutLink()
  if (checkoutLink) {
    globalThis.location.href = checkoutLink
  }
}
</script>

<template>
  <!-- Embedded mode: just the CTA button (used inside PriceTable) -->
  <template v-if="embedded">
    <ClientOnly>
      <UButton
        v-if="user && user.plan === 'pro' && user.planStatus"

        variant="secondary"
        size="lg"
        icon-left="i-tabler-check"
        disabled block
      >
        {{ t.plan.status(user.planStatus) }}
      </UButton>
      <UButton
        v-else-if="user && user.plan === 'free'"
        block
        variant="primary"
        size="lg"
        icon-left="i-tabler-credit-card"
        class="lemonsqueezy-button"
        @click="toCheckoutLink"
      >
        {{ t.plan.pro.button }}
      </UButton>
      <UButton
        v-else-if="!user"
        block
        variant="secondary"
        size="lg"
        @click="onLogin"
      >
        {{ t.plan.needLogin }}
      </UButton>
    </ClientOnly>
  </template>

  <!-- Full card mode (used standalone in modals, etc.) -->
  <div
    v-else
    class="ppp"
  >
    <div class="ppp-pop">
      {{ !isAnuual ? t.plan.mostPopular : t.plan.bestValue }}
    </div>
    <div>
      <div class="ppp-name">
        {{ t.plan.pro.title }}
      </div>
      <div class="ppp-price-row">
        <div
          class="ppp-price"
          :class="{
            'ppp-price-annual': isAnuual,
            'ppp-price-monthly': !isAnuual,
          }"
        >
          {{ formatVariantPrice(variant) }}
        </div>
        <div class="ppp-price-unit">
          {{ isAnuual ? t.plan.pro.preYear : t.plan.pro.preMonth }}
        </div>
      </div>
      <div class="ppp-feature-title">
        {{ t.plan.basic.features.title }}
      </div>
      <div class="ppp-features">
        <FeatureItem>
          {{ t.plan.pro.features.item.include }}
        </FeatureItem>
        <FeatureItem>
          {{ t.plan.pro.features.item.browseAll }}
        </FeatureItem>
        <FeatureItem>
          {{ t.plan.pro.features.item.workspace }}
        </FeatureItem>
        <FeatureItem>
          {{ t.plan.pro.features.item.tag }}
        </FeatureItem>
        <FeatureItem>
          {{ t.plan.pro.features.item.rule }}
        </FeatureItem>
        <FeatureItem>
          {{ t.plan.pro.features.item.widgetCustom }}
        </FeatureItem>
        <FeatureItem>
          {{ t.plan.pro.features.item.widgetUnlimited }}
        </FeatureItem>
      </div>
    </div>
    <div>
      <ClientOnly>
        <UButton
          v-if="user && user.plan === 'pro' && user.planStatus"

          variant="secondary"
          size="lg"
          icon-left="i-tabler-check"
          disabled block
        >
          {{ t.plan.status(user.planStatus) }}
        </UButton>
        <UButton
          v-else-if="user && user.plan === 'free'"
          block
          variant="primary"
          size="lg"
          icon-left="i-tabler-credit-card"
          class="lemonsqueezy-button"
          @click="toCheckoutLink"
        >
          {{ t.plan.pro.button }}
        </UButton>
        <UButton
          v-else-if="!user"
          block
          variant="secondary"
          size="lg"
          @click="onLogin"
        >
          {{ t.plan.needLogin }}
        </UButton>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.ppp {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  min-height: 600px;
  padding: 28px 24px;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
}
.ppp-pop {
  position: absolute;
  right: 16px;
  top: 0;
  transform: translateY(-50%);
  padding: 4px 14px;
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-on-primary);
  background: var(--ct-primary);
  border-radius: var(--ct-radius-full);
}
.ppp-name { font-size: var(--ct-text-base); font-weight: var(--ct-weight-medium); color: var(--ct-fg-muted); }
.ppp-price-row { display: flex; gap: 8px; align-items: baseline; margin-top: 4px; }
.ppp-price {
  font-size: 36px;
  font-weight: var(--ct-weight-semibold);
  letter-spacing: var(--ct-tracking-tight);
}
.ppp-price-monthly { color: var(--ct-primary); }
.ppp-price-annual  { color: var(--ct-danger); }
.ppp-price-unit { font-size: var(--ct-text-sm); color: var(--ct-fg-subtle); }
.ppp-feature-title {
  margin-top: 24px;
  margin-bottom: 10px;
  font-size: var(--ct-text-lg);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
}
.ppp-features { display: flex; flex-direction: column; gap: 8px; font-size: var(--ct-text-sm); color: var(--ct-fg-muted); }
</style>
