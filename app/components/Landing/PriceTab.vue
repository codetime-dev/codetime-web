<script setup lang="ts">
const variant = defineModel<string>()
const t = useI18N()
</script>

<template>
  <div class="bg-surface-variant-1/10 p-1 rounded-2xl inline-flex gap-1">
    <button
      type="button"
      class="text-[13px] tracking-[0.02em] font-mono px-4 py-2.5 rounded-xl flex flex-col gap-0.5 min-w-0 cursor-pointer transition-all duration-200 items-center"
      :class="variant === 'monthly'
        ? 'bg-surface-variant-1/30 text-surface shadow-sm'
        : 'text-surface-dimmed hover:text-surface hover:bg-surface-variant-1/15'"
      @click="() => variant = 'monthly'"
    >
      <span class="font-medium">{{ t.plan.monthly }}</span>
      <span class="text-[10px] opacity-60">{{ t.plan.mostFlexible }}</span>
    </button>
    <button
      type="button"
      class="text-[13px] tracking-[0.02em] font-mono px-4 py-2.5 rounded-xl flex flex-col gap-0.5 min-w-0 cursor-pointer transition-all duration-200 items-center"
      :class="variant === 'one-time'
        ? 'bg-surface-variant-1/30 text-surface shadow-sm'
        : 'text-surface-dimmed hover:text-surface hover:bg-surface-variant-1/15'"
      @click="() => variant = 'one-time'"
    >
      <span class="font-medium">{{ t.plan.oneTime }}</span>
      <span class="text-[10px] opacity-60 flex gap-1">
        <i class="i-ant-design-alipay-circle-outlined text-xs" />
        <i class="i-ant-design-wechat-filled text-xs" />
        <i class="i-entypo-social-paypal text-xs" />
      </span>
    </button>
    <button
      type="button"
      class="text-[13px] tracking-[0.02em] font-mono px-4 py-2.5 rounded-xl flex flex-col gap-0.5 min-w-0 cursor-pointer transition-all duration-200 items-center"
      :class="variant === 'annual'
        ? 'bg-surface-variant-1/30 text-surface shadow-sm'
        : 'text-surface-dimmed hover:text-surface hover:bg-surface-variant-1/15'"
      @click="() => variant = 'annual'"
    >
      <span class="font-medium">{{ t.plan.yearly }}</span>
      <span class="text-[10px] opacity-60">{{ t.plan.save25 }}</span>
    </button>
  </div>
</template>
