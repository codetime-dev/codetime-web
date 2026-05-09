<script setup lang="ts">
import { Btn, Paper, useContainerFilledCS } from '@roku-ui/vue'
import { formatDistanceToNow } from 'date-fns'
import { de, es, fr, it, ja, ko, ms, ptBR, ru, zhCN, zhTW } from 'date-fns/locale'
import { v3GetActiveDiscounts } from '~/api/v3/sdk.gen'

const props = defineProps<{
  variant: 'monthly' | 'annual' | 'one-time'
  embedded?: boolean
}>()
const isAnuual = computed(() => props.variant === 'annual')
const isOneTime = computed(() => props.variant === 'one-time')
const annualGradientCls = 'text-error'
const monthlyGradientCls = 'text-primary'

const user = useUser()

const t = useI18N()

function onLogin() {
  if (globalThis.window === undefined) {
    return
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const { getCheckoutLink } = useCheckoutLink(isAnuual, isOneTime)
const locale = useLocale()
const discountRef = ref()
watchEffect(() => {
  if (discountRef.value) {
    try {
      const dom = discountRef.value
      const body = document.querySelector('body')
      body?.insertBefore(dom, body.firstChild)
    }
    catch (error) {
      console.error(error)
    }
  }
})

// Fetch active discounts only if user is logged in
const { data: activeDiscounts } = await useAsyncData('activeDiscounts', async () => {
  if (!user.value) {
    return []
  }
  try {
    const result = await v3GetActiveDiscounts()
    return result.data
  }
  catch (error) {
    console.warn('Failed to fetch active discounts:', error)
    return []
  }
}, {
  server: false,
  default: () => [],
  watch: [user],
})

const primaryDiscount = computed(() => {
  if (!activeDiscounts.value || activeDiscounts.value.length === 0) {
    return null
  }
  return activeDiscounts.value[0]
})

// Countdown logic
const now = ref(Date.now())
const countdownTimer = ref()

// Update current time every second
onMounted(() => {
  countdownTimer.value = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})

const timeRemaining = computed(() => {
  const discount = primaryDiscount.value
  if (!discount || !discount.expiresAt) {
    return null
  }

  const expiryTime = new Date(discount.expiresAt).getTime()
  const remaining = expiryTime - now.value

  if (remaining <= 0) {
    return null // Expired
  }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
})

// Date-fns locale mapping
function getDateFnsLocale(locale: string) {
  switch (locale) {
    case 'zh-CN': { return zhCN
    }
    case 'zh-TW': { return zhTW
    }
    case 'ja': { return ja
    }
    case 'de': { return de
    }
    case 'es': { return es
    }
    case 'fr': { return fr
    }
    case 'it': { return it
    }
    case 'ru': { return ru
    }
    case 'ms': { return ms
    }
    case 'pt-BR': { return ptBR
    }
    case 'ko': { return ko
    }
    default:
     // English default
  }
}

const countdownText = computed(() => {
  const discount = primaryDiscount.value
  if (!discount || !discount.expiresAt) {
    return null
  }

  const expiryDate = new Date(discount.expiresAt)
  const locale = useLocale().value
  const dateFnsLocale = getDateFnsLocale(locale)

  // Check if expired
  if (expiryDate <= new Date()) {
    return null
  }

  try {
    const relativeTime = formatDistanceToNow(expiryDate, {
      addSuffix: false, // Remove suffix to avoid awkward phrasing
      locale: dateFnsLocale,
    })

    // Create appropriate expire message for each language
    const expiresMessage = (() => {
      switch (locale) {
        case 'zh-CN': {
          return `${relativeTime}后到期`
        }
        case 'zh-TW': {
          return `${relativeTime}後到期`
        }
        case 'ja': {
          return `${relativeTime}で期限切れ`
        }
        case 'de': {
          return `Läuft in ${relativeTime} ab`
        }
        case 'es': {
          return `Caduca en ${relativeTime}`
        }
        case 'fr': {
          return `Expire dans ${relativeTime}`
        }
        case 'it': {
          return `Scade tra ${relativeTime}`
        }
        case 'ru': {
          return `Истекает через ${relativeTime}`
        }
        case 'ua': {
          return `Закінчується через ${relativeTime}`
        }
        case 'ms': {
          return `Tamat tempoh dalam ${relativeTime}`
        }
        case 'pt-BR': {
          return `Expira em ${relativeTime}`
        }
        case 'ko': {
          return `${relativeTime} 후 만료`
        }
        default: {
          return `Expires in ${relativeTime}`
        }
      }
    })()

    return expiresMessage
  }
  catch (error) {
    console.warn('Error formatting countdown:', error)
    return null
  }
})

const discountText = computed(() => {
  const discount = primaryDiscount.value
  if (!discount) {
    return null
  }

  // Check if discount is expired
  if (discount.expiresAt && timeRemaining.value === null) {
    return null // Don't show expired discounts
  }

  const isPercentageDiscount = discount.amountType === 'percent' || discount.amountType === 'percentage'
  const discountValue = isPercentageDiscount
    ? `${discount.amount}% Off`
    : `$${discount.amount} Off`

  const countdown = countdownText.value
  const countdownSuffix = countdown ? ` (${countdown})` : ''

  switch (locale.value) {
    case 'en': {
      return `Apply discount code "${discount.code}" for ${discountValue}${countdownSuffix}.`
    }
    case 'zh-CN': {
      return `使用折扣码 "${discount.code}" 享受 ${discountValue} 优惠${countdownSuffix}。`
    }
    case 'de': {
      return `Verwenden Sie den Rabattcode "${discount.code}", um ${discountValue} Rabatt zu erhalten${countdownSuffix}.`
    }
    case 'es': {
      return `Utilice el código de descuento "${discount.code}" para obtener ${discountValue} de descuento${countdownSuffix}.`
    }
    case 'fr': {
      return `Utilisez le code de réduction "${discount.code}" pour obtenir ${discountValue} de réduction${countdownSuffix}.`
    }
    case 'it': {
      return `Utilizza il codice sconto "${discount.code}" per ottenere ${discountValue} di sconto${countdownSuffix}.`
    }
    case 'ja': {
      return `割引コード "${discount.code}" を適用して ${discountValue} の割引を受けてください${countdownSuffix}。`
    }
    case 'ms': {
      return `Gunakan kod diskaun "${discount.code}" untuk mendapatkan ${discountValue} diskaun${countdownSuffix}.`
    }
    case 'ko': {
      return `할인 코드 "${discount.code}" 를 적용하여 ${discountValue} 할인을 받으세요${countdownSuffix}.`
    }
    case 'pt-BR': {
      return `Use o código de desconto "${discount.code}" para obter ${discountValue} de desconto${countdownSuffix}.`
    }
    case 'ru': {
      return `Используйте код скидки "${discount.code}" для получения ${discountValue} скидки${countdownSuffix}.`
    }
    case 'ua': {
      return `Використовуйте код знижки "${discount.code}" для отримання ${discountValue} знижки${countdownSuffix}.`
    }
    case 'zh-TW': {
      return `使用折扣碼 "${discount.code}" 享受 ${discountValue} 優惠${countdownSuffix}。`
    }
    default: {
      return `Apply discount code "${discount.code}" for ${discountValue}${countdownSuffix}.`
    }
  }
})
const filledContainerCS = useContainerFilledCS('primary')
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
  <Teleport to="body">
    <div
      v-if="user && user.plan !== 'pro' && discountText"
      ref="discountRef"
      class="text-sm text-white px-1 py-2 bg-sky-900 flex min-h-2em w-full items-center justify-center relative z-110"
    >
      {{ discountText }}
    </div>
  </Teleport>

  <!-- Embedded mode: just the CTA button (used inside PriceTable) -->
  <template v-if="embedded">
    <ClientOnly>
      <div v-if="user && user.plan === 'pro'" class="flex gap-2">
        <Btn
          v-if="user.planStatus"
          class="w-full"
          variant="transparent"
          disabled
        >
          <template #leftSection>
            <i class="i-tabler-check" />
          </template>
          {{ t.plan.status(user.planStatus) }}
        </Btn>
      </div>
      <div v-else-if="user && user.plan === 'free'">
        <Btn
          variant="filled"
          class="lemonsqueezy-button w-full !text-[14px] !tracking-[0.02em] !rounded-xl !h-11"
          color="primary"
          @click="toCheckoutLink"
        >
          <template #leftSection>
            <i class="i-tabler-credit-card" />
            <i v-if="isOneTime" class="i-ant-design-alipay-circle-outlined" />
            <i v-if="isOneTime" class="i-ant-design-wechat-filled" />
            <i v-if="isOneTime" class="i-entypo-social-paypal" />
          </template>
          <div class="text-center">
            {{ t.plan.pro.button }}
          </div>
        </Btn>
      </div>
      <div v-else>
        <Btn
          v-if="!user"
          class="w-full !text-[14px] !rounded-xl !h-11"
          variant="transparent"
          @click="onLogin"
        >
          {{ t.plan.needLogin }}
        </Btn>
      </div>
    </ClientOnly>
  </template>

  <!-- Full card mode (used standalone in modals, etc.) -->
  <Paper
    v-else
    class="flex flex-col h-full min-h-600px w-full justify-between"
  >
    <div
      v-bind="filledContainerCS"
      class="text-sm text-white px-4 py-1 rounded-full right-4 top-0 absolute -translate-y-50%"
    >
      {{ !isAnuual ? t.plan.mostPopular : t.plan.bestValue }}
    </div>
    <div>
      <div class="text-base font-light">
        {{ t.plan.pro.title }}
      </div>
      <div class="font-light flex gap-2 items-end">
        <div
          :class="{
            [monthlyGradientCls]: !isAnuual,
            [annualGradientCls]: isAnuual,
          }"
          class="text-4xl"
        >
          {{ isAnuual ? '$36' : '$4' }}
        </div>
        <div class="text-sm text-surface-dimmed">
          {{ isAnuual ? t.plan.pro.preYear : t.plan.pro.preMonth }}
        </div>
      </div>
      <div class="text-xl mb-2 mt-4">
        {{ t.plan.basic.features.title }}
      </div>
      <div class="text-sm text-surface-dimmed flex flex-col gap-2">
        <FeatureItem>
          {{ t.plan.pro.features.item.include }}
        </FeatureItem>
        <FeatureItem>
          {{ t.plan.pro.features.item.browseAll }}
        </FeatureItem>
        <FeatureItem not-yet>
          {{ t.plan.pro.features.item.rule }}
        </FeatureItem>
        <FeatureItem not-yet>
          {{ t.plan.pro.features.item.tag }}
        </FeatureItem>
      </div>
    </div>
    <div>
      <ClientOnly>
        <div v-if="user && user.plan === 'pro'" class="flex gap-2">
          <Btn
            v-if="user.planStatus"
            class="w-full"
            variant="transparent"
            disabled
          >
            <template #leftSection>
              <i class="i-tabler-check" />
            </template>
            {{ t.plan.status(user.planStatus) }}
          </Btn>
        </div>
        <div v-else-if="user && user.plan === 'free'">
          <Btn
            variant="filled"
            class="lemonsqueezy-button w-full"
            color="primary"
            @click="toCheckoutLink"
          >
            <template #leftSection>
              <i class="i-tabler-credit-card" />
              <i v-if="isOneTime" class="i-ant-design-alipay-circle-outlined" />
              <i v-if="isOneTime" class="i-ant-design-wechat-filled" />
              <i v-if="isOneTime" class="i-entypo-social-paypal" />
            </template>
            <div class="text-center">
              {{ t.plan.pro.button }}
            </div>
          </Btn>
        </div>
        <div v-else>
          <Btn v-if="!user" class="w-full" variant="transparent" @click="onLogin">
            {{ t.plan.needLogin }}
          </Btn>
        </div>
      </ClientOnly>
    </div>
  </Paper>
</template>
