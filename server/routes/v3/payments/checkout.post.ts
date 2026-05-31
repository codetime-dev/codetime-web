import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'
import { eq } from 'drizzle-orm'
import { defineEventHandler, readBody } from 'h3'
import { users } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { isProduction } from '../../../utils/env'
import { siteLocaleToLemonSqueezy, useLemonSqueezy } from '../../../utils/lemonsqueezy'
import { resolveVariantId } from '../../../utils/lemonsqueezy-variants'
import { sendPyError } from '../../../utils/py-error'

// Mirrors POST /v3/payments/checkout. Resolves variant id from
// LEMONSQUEEZY_<PRODUCT>_ID_<TYPE> (e.g. SUBSCRIPTION_ID_MONTHLY), then
// asks LemonSqueezy for a checkout URL stamped with `uid` in custom data
// so the subsequent webhook can join back to our user row.

const ALLOWED_TYPES = new Set(['monthly', 'yearly'])
const ALLOWED_PRODUCTS = new Set(['subscription', 'onetime'])

defineRouteMeta({
  openAPI: {
    tags: ['payments'],
    summary: 'Create a checkout session for the authenticated user',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutRequest' } } },
    },
    responses: {
      200: {
        description: 'Checkout URL',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutResponse' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
      404: { $ref: '#/components/responses/NotFound' },
      500: { $ref: '#/components/responses/BadRequest' },
    },
    $global: {
      components: {
        schemas: {
          CheckoutRequest: {
            type: 'object',
            required: ['type', 'product'],
            properties: {
              type: { type: 'string', enum: ['monthly', 'yearly'] },
              product: { type: 'string', enum: ['subscription', 'onetime'] },
              // Optional site UI locale (the `[locale]` route param). Mapped to a
              // LemonSqueezy checkout language so the hosted page matches the
              // language the user is browsing in. Unknown values are ignored.
              locale: { type: 'string' },
            },
          },
          CheckoutResponse: {
            type: 'object',
            required: ['checkoutUrl', 'expiresAt'],
            properties: {
              checkoutUrl: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
})

const isDev = !isProduction() || !!import.meta.dev

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const body = await readBody<{ type?: string, product?: string, locale?: string }>(event).catch(() => null)
  const type = (body?.type ?? '').toLowerCase()
  const product = (body?.product ?? '').toLowerCase()
  if (!ALLOWED_TYPES.has(type) || !ALLOWED_PRODUCTS.has(product)) {
    return sendPyError(event, 400, 'Invalid type/product')
  }

  const variantId = resolveVariantId(type, product)
  if (!variantId) {
    return sendPyError(
      event,
      400,
      `Product ID not found for billing_type=${type}, product=${product}. Environment variable LEMONSQUEEZY_${product.toUpperCase()}_ID_${type.toUpperCase()} is not set.`,
    )
  }

  const db = useDb()
  const [user] = await db
    .select({ id: users.id, email: users.email, username: users.username })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1)
  if (!user) {
 return sendPyError(event, 404, 'User not found')
}

  const { storeId } = useLemonSqueezy()
  const email = user.email?.trim()
  const newCheckout: Parameters<typeof createCheckout>[2] = {
    testMode: isDev,
    checkoutData: {
      name: user.username || '',
      ...(email ? { email } : {}),
      custom: { uid: String(user.id) },
    },
  }

  // Force the checkout language to match the site UI locale. The SDK's v4
  // CheckoutOptions type predates LemonSqueezy's `locale` field, but the SDK
  // forwards unknown keys verbatim (deep snake_case conversion) and the API
  // honours `checkout_options.locale` above store/browser defaults.
  const lsLocale = siteLocaleToLemonSqueezy(body?.locale)
  if (lsLocale) {
    ;(newCheckout as { checkoutOptions?: Record<string, unknown> }).checkoutOptions = { locale: lsLocale }
  }

  const { data, error, statusCode: lsStatus } = await createCheckout(storeId, variantId, newCheckout)

  if (error || !data?.data?.attributes?.url) {
    // Forward LemonSqueezy's HTTP status so callers can distinguish
    // bad-variant (4xx) from server fault (5xx).
    const status = typeof lsStatus === 'number' && lsStatus >= 400 ? lsStatus : 500
    return sendPyError(event, status, `Failed to create checkout session: ${error?.message ?? 'unknown error'}`)
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  return { checkoutUrl: data.data.attributes.url, expiresAt }
})
