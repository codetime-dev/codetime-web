import process from 'node:process'

// Helpers shared between the checkout creator and the webhook handler.
// Mirrors codetime-server-v3/src/services/payments.py — names align with
// the Python `PlanStatus` enum and the `_calculate_expiration_from_variant_id`
// logic so behaviour stays consistent across both backends.

export const PlanStatus = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  ON_TRIAL: 'on_trial',
  PAUSED: 'paused',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  EMPTY: '',
} as const

export const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  active: PlanStatus.ACTIVE,
  cancelled: PlanStatus.CANCELLED,
  expired: PlanStatus.EXPIRED,
  on_trial: PlanStatus.ON_TRIAL,
  paused: PlanStatus.PAUSED,
  past_due: PlanStatus.PAST_DUE,
  unpaid: PlanStatus.UNPAID,
}

const DEV_RENEW_WINDOW_MS = 5 * 60 * 1000

export function isDevPaymentsMode(): boolean {
  return process.env.NUXT_PUBLIC_MODE !== 'production' || !!import.meta.dev
}

// Dev environments use a fast 5-minute window for renewals/expirations so
// the manual checkout/webhook flow can be exercised end-to-end during
// testing. Matches the Python `is_dev` branches.
export function renewExpiry(renewsAt: string | undefined | null): Date | null {
  if (!renewsAt) {
 return null
}
  if (isDevPaymentsMode()) {
 return new Date(Date.now() + DEV_RENEW_WINDOW_MS)
}
  const t = new Date(renewsAt)
  return Number.isNaN(t.getTime()) ? null : t
}

export function endsExpiry(endsAt: string | undefined | null): Date | null {
  if (!endsAt) {
 return null
}
  if (isDevPaymentsMode()) {
 return new Date(Date.now() + DEV_RENEW_WINDOW_MS)
}
  const t = new Date(endsAt)
  return Number.isNaN(t.getTime()) ? null : t
}

// Adds a calendar month/year. Python uses `dateutil.relativedelta`; we
// emulate by walking the wall-clock components and letting JS's Date
// normalise overflows (Feb 30 → Mar 2, same as relativedelta in those
// edge cases).
function addCalendar(base: Date, years: number, months: number): Date {
  const d = new Date(base)
  d.setUTCFullYear(d.getUTCFullYear() + years, d.getUTCMonth() + months, d.getUTCDate())
  return d
}

// Mirrors PaymentService._calculate_expiration_from_variant_id.
// Extends from the user's existing future expiration when present.
export function calcExpirationFromVariant(variantId: string | null | undefined, currentExpiresAt: Date | null): Date {
  const now = new Date()
  const baseTime = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now
  if (!variantId) {
 return addCalendar(baseTime, 0, 1)
}

  const monthlyId = process.env.LEMONSQUEEZY_ONETIME_ID_MONTHLY
  const yearlyId = process.env.LEMONSQUEEZY_ONETIME_ID_YEARLY
  if (variantId === yearlyId) {
 return addCalendar(baseTime, 1, 0)
}
  if (variantId === monthlyId) {
 return addCalendar(baseTime, 0, 1)
}
  return addCalendar(baseTime, 0, 1)
}

// Mirror PaymentService._is_subscription_order.
export function isSubscriptionOrder(webhook: Record<string, any>): boolean {
  const data = webhook.data || {}
  const attributes = data.attributes || {}
  const firstItem = attributes.first_order_item
  const variantId = firstItem?.variant_id
  if (variantId !== undefined && variantId !== null) {
    const monthly = process.env.LEMONSQUEEZY_SUBSCRIPTION_ID_MONTHLY
    const yearly = process.env.LEMONSQUEEZY_SUBSCRIPTION_ID_YEARLY
    if ([monthly, yearly].includes(String(variantId))) {
 return true
}
  }
  const productName = String(attributes.product_name || '').toLowerCase()
  return productName.includes('subscription')
}
