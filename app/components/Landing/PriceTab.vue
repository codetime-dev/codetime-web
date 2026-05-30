<script setup lang="ts">
type Variant = 'monthly' | 'one-time' | 'annual'

const variant = defineModel<Variant>()
const t = useI18N()
const { annualDiscountPercent } = useProPricing()

const items = computed(() => [
  { id: 'monthly' as Variant, label: t.value.plan.monthly, meta: t.value.plan.mostFlexible },
  { id: 'one-time' as Variant, label: t.value.plan.oneTime, meta: 'icons', metaClass: 'pt-tab-icons' },
  { id: 'annual' as Variant, label: t.value.plan.yearly, meta: t.value.plan.savePercent(annualDiscountPercent.value) },
])
</script>

<template>
  <UTabs v-model="variant" :items="items" variant="segmented">
    <template #meta="{ item }">
      <template v-if="item.id === 'one-time'">
        <i class="i-ant-design-alipay-circle-outlined" />
        <i class="i-ant-design-wechat-filled" />
        <i class="i-entypo-social-paypal" />
      </template>
      <template v-else>
        {{ item.meta }}
      </template>
    </template>
  </UTabs>
</template>

<style scoped>
:deep(.pt-tab-icons) {
  display: inline-flex;
  gap: 6px;
  font-size: 14px;
  text-transform: none;
}
</style>
