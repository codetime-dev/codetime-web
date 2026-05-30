import process from 'node:process'
import { listPrices } from '@lemonsqueezy/lemonsqueezy.js'

// Shared LemonSqueezy variant helpers. Both POST /v3/payments/checkout and
// GET /v3/payments/pricing resolve the same variant id from env so the price
// shown to the user is the variant they actually get charged for.

export type BillingType = 'monthly' | 'yearly'
export type ProductKind = 'subscription' | 'onetime'

// Resolve a variant id from LEMONSQUEEZY_<PRODUCT>_ID_<TYPE>
// (e.g. LEMONSQUEEZY_SUBSCRIPTION_ID_MONTHLY). Returns null when unset.
export function resolveVariantId(billingType: string, product: string): string | null {
  const key = `LEMONSQUEEZY_${product.toUpperCase()}_ID_${billingType.toUpperCase()}`
  return process.env[key] || null
}

type PriceAttributes = { unit_price?: number, created_at?: string }
type PriceRow = { id?: string, attributes?: PriceAttributes }

// A variant accumulates a price history; the current price is the most
// recently created one. Returns the active unit price in cents, or null when
// the variant has no resolvable price (unset id, LS error, empty history).
export async function fetchCurrentVariantPriceCents(variantId: string | null): Promise<number | null> {
  if (!variantId) {
    return null
  }

  const { data, error } = await listPrices({ filter: { variantId } })
  if (error || !data) {
    return null
  }

  const rows = (data.data ?? []) as PriceRow[]
  let current: PriceRow | null = null
  for (const row of rows) {
    if (row.attributes?.unit_price == null) {
      continue
    }
    if (!current || (row.attributes.created_at ?? '') > (current.attributes?.created_at ?? '')) {
      current = row
    }
  }

  return current?.attributes?.unit_price ?? null
}
