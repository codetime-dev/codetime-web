<script setup lang="ts">
import { Btn } from '@roku-ui/vue'

const variant = defineModel<string>()
const t = useI18N()
</script>

<template>
  <div class="gap-2 grid grid-cols-1 max-w-[min(100%,42rem)] w-full sm:grid-cols-3 !children:px-3 !children:py-1 !children:text-center !children:rounded-xl !children:gap-2 !children:min-w-0 !children:w-full !children:cursor-pointer !children:duration-100 !children:ease-in-out sm:!children:px-4">
    <Btn
      :variant="variant === 'monthly' ? 'filled' : 'default'"
      class="!h-14"
      size="lg"
      @click="() => variant = 'monthly'"
    >
      <div>
        {{ t.plan.monthly }}
        <div class="text-xs op-75">
          {{ t.plan.mostFlexible }}
        </div>
      </div>
    </Btn>
    <Btn
      :variant="variant === 'one-time' ? 'filled' : 'default'"
      class="!h-14"
      @click="() => variant = 'one-time'"
    >
      <div>
        {{ t.plan.oneTime }}
        <div class="text-xs op-75">
          <i class="i-ant-design-alipay-circle-outlined" />
          <i class="i-ant-design-wechat-filled" />
          <i class="i-entypo-social-paypal" />
        </div>
      </div>
    </Btn>
    <Btn
      class="!h-14"
      :variant="variant === 'annual' ? 'filled' : 'default'"
      @click="() => variant = 'annual'"
    >
      <div>
        <div>
          {{ t.plan.yearly }}
        </div>
        <div class="text-xs op-75">
          {{ t.plan.save25 }}
        </div>
      </div>
    </Btn>
  </div>
</template>
