<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { de, es, fr, it, ja, ko, ms, ptBR, ru, zhCN, zhTW } from 'date-fns/locale'
import { getV3DiscountsActive } from '~/api/v3/sdk.gen'

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
    const result = await getV3DiscountsActive()
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
          {{ isAnuual ? '$36' : '$4' }}
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
