import { getV3PaymentsPricing } from '~/api/v3'

export type PriceVariant = 'monthly' | 'annual' | 'one-time'

// Fallback amounts (cents) used when the LemonSqueezy-backed pricing endpoint
// is unavailable, so the pricing UI never renders blank. Mirrors the previous
// hard-coded $4 / $36 / Save 25%.
const FALLBACK = {
  subscriptionMonthly: 400,
  subscriptionYearly: 3600,
  onetimeMonthly: 400,
  onetimeYearly: 3600,
  annualDiscountPercent: 25,
}

function formatPriceCents(cents: number): string {
  const dollars = cents / 100
  return `$${cents % 100 === 0 ? String(dollars) : dollars.toFixed(2)}`
}

/**
 * Live Pro pricing resolved from LemonSqueezy variants. Shared across the
 * pricing table, upgrade modal and landing page via a single useAsyncData key.
 */
export function useProPricing() {
  const { data } = useAsyncData('proPricing', async () => {
    try {
      const resp = await getV3PaymentsPricing()
      return resp.data ?? null
    }
    catch (error) {
      console.warn('Failed to fetch pricing:', error)
      return null
    }
  }, { default: () => null })

  // Merge endpoint values over fallbacks field-by-field; a null/missing field
  // degrades to its default without dragging the rest down.
  const amounts = computed(() => ({
    subscriptionMonthly: data.value?.subscriptionMonthly ?? FALLBACK.subscriptionMonthly,
    subscriptionYearly: data.value?.subscriptionYearly ?? FALLBACK.subscriptionYearly,
    onetimeMonthly: data.value?.onetimeMonthly ?? FALLBACK.onetimeMonthly,
    onetimeYearly: data.value?.onetimeYearly ?? FALLBACK.onetimeYearly,
    annualDiscountPercent: data.value?.annualDiscountPercent ?? FALLBACK.annualDiscountPercent,
  }))

  const annualDiscountPercent = computed(() => amounts.value.annualDiscountPercent)

  // Map a UI variant to the variant checkout would actually charge (see
  // useCheckoutLink): annual → yearly subscription, one-time → monthly
  // one-time, monthly → monthly subscription. Keeps shown price === paid price.
  function priceCentsForVariant(variant: PriceVariant): number {
    if (variant === 'annual') {
      return amounts.value.subscriptionYearly
    }
    if (variant === 'one-time') {
      return amounts.value.onetimeMonthly
    }
    return amounts.value.subscriptionMonthly
  }

  function formatVariantPrice(variant: PriceVariant): string {
    return formatPriceCents(priceCentsForVariant(variant))
  }

  return {
    amounts,
    annualDiscountPercent,
    priceCentsForVariant,
    formatVariantPrice,
    formatPriceCents,
  }
}
