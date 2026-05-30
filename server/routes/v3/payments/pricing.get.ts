import { defineEventHandler } from 'h3'
import { useLemonSqueezy } from '../../../utils/lemonsqueezy'
import { fetchCurrentVariantPriceCents, resolveVariantId } from '../../../utils/lemonsqueezy-variants'

// GET /v3/payments/pricing. Resolves the live per-variant price from
// LemonSqueezy for the four billable options (subscription / one-time ×
// monthly / yearly) so the pricing UI never hard-codes amounts. Prices are
// keyed off the same LEMONSQUEEZY_<PRODUCT>_ID_<TYPE> env vars the checkout
// route uses, guaranteeing the displayed price matches the charged variant.

defineRouteMeta({
  openAPI: {
    tags: ['payments'],
    summary: 'Live Pro pricing resolved from LemonSqueezy variants',
    responses: {
      200: {
        description: 'Pricing',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PricingPublic' },
          },
        },
      },
    },
    $global: {
      components: {
        schemas: {
          PricingPublic: {
            type: 'object',
            required: ['currency', 'subscriptionMonthly', 'subscriptionYearly', 'onetimeMonthly', 'onetimeYearly', 'annualDiscountPercent'],
            properties: {
              currency: { type: 'string' },
              subscriptionMonthly: { type: 'integer', nullable: true, description: 'Price in cents' },
              subscriptionYearly: { type: 'integer', nullable: true, description: 'Price in cents' },
              onetimeMonthly: { type: 'integer', nullable: true, description: 'Price in cents' },
              onetimeYearly: { type: 'integer', nullable: true, description: 'Price in cents' },
              annualDiscountPercent: { type: 'integer', nullable: true, description: 'Yearly vs monthly×12 saving, in percent' },
            },
          },
        },
      },
    },
  },
})

type Pricing = {
  currency: string
  subscriptionMonthly: number | null
  subscriptionYearly: number | null
  onetimeMonthly: number | null
  onetimeYearly: number | null
  annualDiscountPercent: number | null
}

// LemonSqueezy prices change rarely; cache in-process to avoid hitting their
// API on every pricing-page render. TTL is short enough that a dashboard
// price edit reflects within minutes.
const CACHE_TTL_MS = 5 * 60 * 1000
let cache: { value: Pricing, expiresAt: number } | null = null

function annualDiscountPercent(monthly: number | null, yearly: number | null): number | null {
  if (monthly == null || yearly == null || monthly <= 0) {
    return null
  }
  return Math.round((1 - yearly / (monthly * 12)) * 100)
}

export default defineEventHandler(async (): Promise<Pricing> => {
  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return cache.value
  }

  useLemonSqueezy()

  const [subscriptionMonthly, subscriptionYearly, onetimeMonthly, onetimeYearly] = await Promise.all([
    fetchCurrentVariantPriceCents(resolveVariantId('monthly', 'subscription')),
    fetchCurrentVariantPriceCents(resolveVariantId('yearly', 'subscription')),
    fetchCurrentVariantPriceCents(resolveVariantId('monthly', 'onetime')),
    fetchCurrentVariantPriceCents(resolveVariantId('yearly', 'onetime')),
  ])

  const value: Pricing = {
    currency: 'USD',
    subscriptionMonthly,
    subscriptionYearly,
    onetimeMonthly,
    onetimeYearly,
    annualDiscountPercent: annualDiscountPercent(subscriptionMonthly, subscriptionYearly),
  }

  cache = { value, expiresAt: now + CACHE_TTL_MS }
  return value
})
