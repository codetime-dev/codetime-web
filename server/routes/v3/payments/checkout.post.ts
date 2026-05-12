import process from 'node:process'
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'
import { eq } from 'drizzle-orm'
import { defineEventHandler, readBody } from 'h3'
import { users } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { useLemonSqueezy } from '../../../utils/lemonsqueezy'
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
            },
          },
          CheckoutResponse: {
            type: 'object',
            required: ['checkout_url', 'expires_at'],
            properties: {
              checkout_url: { type: 'string' },
              expires_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
})

function resolveVariantId(billingType: string, product: string): string | null {
  const key = `LEMONSQUEEZY_${product.toUpperCase()}_ID_${billingType.toUpperCase()}`
  return process.env[key] || null
}

const isDev = process.env.NUXT_PUBLIC_MODE !== 'production' || !!import.meta.dev

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) return sendPyError(event, 401, 'Not authenticated')

  const body = await readBody<{ type?: string, product?: string }>(event).catch(() => null)
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
  if (!user) return sendPyError(event, 404, 'User not found')

  const { storeId } = useLemonSqueezy()
  const email = user.email?.trim()
  const { data, error } = await createCheckout(storeId, variantId, {
    testMode: isDev,
    checkoutData: {
      name: user.username || '',
      ...(email ? { email } : {}),
      custom: { uid: String(user.id) },
    },
  })

  if (error || !data?.data?.attributes?.url) {
    return sendPyError(event, 500, `Failed to create checkout session: ${error?.message ?? 'unknown error'}`)
  }

  // Python sets expires_at = now + 24h regardless of LS' real expiry.
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  return { checkout_url: data.data.attributes.url, expires_at: expiresAt }
})
