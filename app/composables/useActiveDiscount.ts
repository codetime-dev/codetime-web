import { getV3DiscountsActive } from '~/api/v3/sdk.gen'

// Localized unit labels for the live countdown. CJK locales use their native
// units; everything else falls back to Latin abbreviations (d/h/m/s).
function countdownUnits(loc: string) {
  switch (loc) {
    case 'zh-CN':
    case 'zh-TW': {
      return { d: '天', h: '小时', m: '分', s: '秒' }
    }
    case 'ja': {
      return { d: '日', h: '時間', m: '分', s: '秒' }
    }
    case 'ko': {
      return { d: '일', h: '시간', m: '분', s: '초' }
    }
    default: {
      return { d: 'd', h: 'h', m: 'm', s: 's' }
    }
  }
}

// Shared source of truth for the currently-active LemonSqueezy discount and its
// localized, live-counting-down promo text. Consumed by both the global landing
// banner (DiscountBanner.vue) and the upgrade modal (ProUpgradeModal.vue). The
// `useAsyncData('activeDiscounts')` key is shared, so the discount is fetched at
// most once regardless of how many consumers mount.
export function useActiveDiscount() {
  const user = useUser()
  const locale = useLocale()
  const { formatPriceCents } = useProPricing()

  // Fetch active discounts only if user is logged in. No top-level await: the
  // consumer should render immediately and fill in once the request resolves.
  const { data: activeDiscounts } = useAsyncData('activeDiscounts', async () => {
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

  // Countdown logic: tick `now` once a second so the remaining time recomputes.
  const now = ref(Date.now())
  const countdownTimer = ref()

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

  const countdownText = computed(() => {
    // `timeRemaining` already recomputes every second (driven by the `now`
    // ticker) and is null once expired, so the countdown updates live.
    const rem = timeRemaining.value
    if (!rem) {
      return null
    }

    const loc = locale.value
    const u = countdownUnits(loc)

    // Drop leading zero segments (under a day hides the days field, etc.) but
    // always keep everything from the first non-zero unit down to seconds.
    // Seconds are zero-padded so the last segment doesn't visually jitter.
    const segs: string[] = []
    if (rem.days > 0) {
      segs.push(`${rem.days}${u.d}`)
    }
    if (segs.length > 0 || rem.hours > 0) {
      segs.push(`${rem.hours}${u.h}`)
    }
    if (segs.length > 0 || rem.minutes > 0) {
      segs.push(`${rem.minutes}${u.m}`)
    }
    segs.push(`${String(rem.seconds).padStart(2, '0')}${u.s}`)
    const time = segs.join(' ')

    // Wrap the precise countdown in a localized "expires in" phrase.
    switch (loc) {
      case 'zh-CN': {
        return `${time}后到期`
      }
      case 'zh-TW': {
        return `${time}後到期`
      }
      case 'ja': {
        return `${time}で期限切れ`
      }
      case 'de': {
        return `Läuft in ${time} ab`
      }
      case 'es': {
        return `Caduca en ${time}`
      }
      case 'fr': {
        return `Expire dans ${time}`
      }
      case 'it': {
        return `Scade tra ${time}`
      }
      case 'ru': {
        return `Истекает через ${time}`
      }
      case 'ua': {
        return `Закінчується через ${time}`
      }
      case 'ms': {
        return `Tamat tempoh dalam ${time}`
      }
      case 'pt-BR': {
        return `Expira em ${time}`
      }
      case 'ko': {
        return `${time} 후 만료`
      }
      default: {
        return `Expires in ${time}`
      }
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
    // Render only the magnitude here — each locale's sentence below already
    // supplies its own "off / 优惠 / Rabatt / 割引" word, so appending "Off"
    // again double-stated it. Fixed-amount discounts arrive in cents from
    // LemonSqueezy (a $5 coupon is amount=500); percentages are a plain int.
    const discountValue = isPercentageDiscount
      ? `${discount.amount}%`
      : formatPriceCents(discount.amount)

    const countdown = countdownText.value
    const countdownSuffix = countdown ? ` (${countdown})` : ''

    switch (locale.value) {
      case 'en': {
        return `Apply discount code "${discount.code}" for ${discountValue} off${countdownSuffix}.`
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
        return `Apply discount code "${discount.code}" for ${discountValue} off${countdownSuffix}.`
      }
    }
  })

  return { primaryDiscount, discountText }
}
