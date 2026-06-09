import { createHmac, timingSafeEqual } from 'node:crypto'
import process from 'node:process'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { defineEventHandler, getHeader, readRawBody } from 'h3'
import { lemonsqueezyRawWebhooks, users } from '../../../../db/schema'
import { useDb } from '../../../../utils/db'
import { isProduction } from '../../../../utils/env'
import {
  calcExpirationFromVariant,
  endsExpiry,
  isSubscriptionOrder,
  PlanStatus,
  renewExpiry,
  SUBSCRIPTION_STATUS_MAP,
} from '../../../../utils/payments'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors POST /v3/payments/webhooks/lemonsqueezy. Verifies the X-Signature
// HMAC-SHA256 against LEMONSQUEEZY_WEBHOOK_SECRET, persists the raw body
// (used for idempotency + audit), then dispatches by event_name to the
// per-event handlers. Keeps wire-level parity with Python's
// PaymentService.process_webhook + per-event handlers.

defineRouteMeta({
  openAPI: {
    tags: ['payments'],
    summary: 'LemonSqueezy webhook receiver',
    description: 'Public endpoint; auth is by HMAC signature in X-Signature.',
    responses: {
      200: {
        description: 'Webhook processed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WebhookResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          WebhookResponse: {
            type: 'object',
            required: ['success', 'message'],
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
})

function verifySignature(raw: string | Buffer, signature: string | undefined): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    // In production, refuse to process the webhook rather than accepting
    // it unauthenticated: a missing secret would otherwise let anyone
    // forge `subscription_created` events and grant Pro plans by sending
    // `meta.custom_data.uid` for a victim. In dev we keep the old
    // accept-all behaviour so local test fixtures keep working.
    if (isProduction()) {
      console.error('[ls-webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not configured; rejecting webhook in production')
      return false
    }
    return true
  }
  if (!signature) {
 return false
}
  const provided = signature.replace(/^sha256=/, '')
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  if (expected.length !== provided.length) {
 return false
}
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'))
  }
  catch {
    return false
  }
}

type Webhook = Record<string, any>

function uidOf(webhook: Webhook): number | null {
  const raw = webhook.meta?.custom_data?.uid
  if (raw === undefined || raw === null) {
 return null
}
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

async function loadUser(db: ReturnType<typeof useDb>, uid: number) {
  const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1)
  return user ?? null
}

function userEmailOf(webhook: Webhook): string | null {
  const raw = webhook.data?.attributes?.user_email
  if (typeof raw !== 'string') {
    return null
  }
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

// Resolve the paying user for an activation event (order_created /
// subscription_created). The happy path is `meta.custom_data.uid`, which we
// attach when *we* create the checkout (/checkout/custom/...). But orders
// placed through the public storefront or a /buy/<slug> direct link arrive
// with NO custom_data — so fall back to matching LemonSqueezy's `user_email`
// against a single non-deleted account. If nothing resolves (or the email is
// ambiguous), log loudly instead of silently dropping the sale; the raw
// payload is always persisted in lemonsqueezy_raw_webhooks for manual triage.
async function resolveActivationUser(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (uid) {
    const user = await loadUser(db, uid)
    if (user) {
      return user
    }
  }

  const event = w.meta?.event_name
  const orderId = w.data?.id
  const email = userEmailOf(w)
  if (email) {
    const matches = await db
      .select()
      .from(users)
      .where(and(sql`lower(${users.email}) = lower(${email})`, isNull(users.deletedAt)))
      .limit(2)
    if (matches.length === 1) {
      return matches[0]
    }
    if (matches.length > 1) {
      console.error(`[ls-webhook] ${event}: user_email ${email} matches multiple accounts; NOT auto-activating order ${orderId}`)
      return null
    }
  }

  console.error(`[ls-webhook] ${event}: could not resolve user (uid=${uid ?? 'none'}, email=${email ?? 'none'}, order=${orderId}); payment NOT activated`)
  return null
}

async function handleSubscriptionCreated(db: ReturnType<typeof useDb>, w: Webhook) {
  const user = await resolveActivationUser(db, w)
  if (!user) {
 return
}

  const renewsAt = w.data?.attributes?.renews_at
  let expires = user.planExpiresAt
  const renewExp = renewExpiry(renewsAt)
  if (renewExp) {
    // If user already has a paid window in the future (one-time purchases),
    // extend by the new subscription duration instead of overwriting.
    if (user.planExpiresAt && user.planExpiresAt > new Date()) {
      const now = new Date()
      const subDurationMs = renewExp.getTime() - now.getTime()
      expires = new Date(user.planExpiresAt.getTime() + subDurationMs)
    }
    else {
      expires = renewExp
    }
  }
  await db.update(users)
    .set({ plan: 'pro', planStatus: PlanStatus.ACTIVE, planExpiresAt: expires })
    .where(eq(users.id, user.id))
}

async function handleSubscriptionUpdated(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (!uid) {
 return
}
  const user = await loadUser(db, uid)
  if (!user) {
 return
}

  const status = String(w.data?.attributes?.status || '')
  const mapped = SUBSCRIPTION_STATUS_MAP[status] ?? user.planStatus
  let plan = user.plan
  if (status === 'expired') {
 plan = 'free'
}
  else if (status === 'active') {
 plan = 'pro'
}

  const renewsAt = w.data?.attributes?.renews_at
  const renewExp = renewExpiry(renewsAt) ?? user.planExpiresAt
  await db.update(users)
    .set({ plan, planStatus: mapped, planExpiresAt: renewExp })
    .where(eq(users.id, uid))
}

async function handleSubscriptionCancelled(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (!uid) {
 return
}
  const endsAt = w.data?.attributes?.ends_at
  const endsExp = endsExpiry(endsAt)
  await db.update(users)
    .set({
      planStatus: PlanStatus.CANCELLED,
      ...(endsExp ? { planExpiresAt: endsExp } : {}),
    })
    .where(eq(users.id, uid))
}

async function handleSubscriptionExpired(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (!uid) {
 return
}
  await db.update(users)
    .set({ plan: 'free', planStatus: PlanStatus.EXPIRED, planExpiresAt: null })
    .where(eq(users.id, uid))
}

async function handleSubscriptionResumed(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (!uid) {
 return
}
  const renewExp = renewExpiry(w.data?.attributes?.renews_at)
  await db.update(users)
    .set({
      plan: 'pro',
      planStatus: PlanStatus.ACTIVE,
      ...(renewExp ? { planExpiresAt: renewExp } : {}),
    })
    .where(eq(users.id, uid))
}

async function handleSubscriptionPaused(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (!uid) {
 return
}
  await db.update(users).set({ planStatus: PlanStatus.PAUSED }).where(eq(users.id, uid))
}

async function handleSubscriptionUnpaused(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (!uid) {
 return
}
  await db.update(users).set({ planStatus: PlanStatus.ACTIVE }).where(eq(users.id, uid))
}

async function handleSubscriptionPaymentSuccess(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (!uid) {
 return
}
  const user = await loadUser(db, uid)
  if (!user) {
 return
}
  const billingReason = String(w.data?.attributes?.billing_reason || '')
  if ((billingReason === 'renewal' || billingReason === 'recurring') && user.plan !== 'pro') {
    await db.update(users)
      .set({ plan: 'pro', planStatus: PlanStatus.ACTIVE })
      .where(eq(users.id, uid))
  }
}

async function handleOrderCreated(db: ReturnType<typeof useDb>, w: Webhook) {
  // Subscription orders are handled by subscription_created — avoid
  // double-counting by short-circuiting here.
  if (isSubscriptionOrder(w)) {
 return
}

  const status = String(w.data?.attributes?.status || '')
  if (status !== 'paid') {
 return
}

  // Only resolve the user (and alert on failure) for genuine paid one-time
  // orders — skipping the lookup for subscription/unpaid orders above keeps
  // the no-match alert meaningful instead of noisy.
  const user = await resolveActivationUser(db, w)
  if (!user) {
 return
}

  const variantId = w.data?.relationships?.variant?.data?.id
  const expires = calcExpirationFromVariant(variantId ? String(variantId) : null, user.planExpiresAt)
  await db.update(users)
    .set({ plan: 'pro', planStatus: PlanStatus.ACTIVE, planExpiresAt: expires })
    .where(eq(users.id, user.id))
}

async function handleOrderRefunded(db: ReturnType<typeof useDb>, w: Webhook) {
  const uid = uidOf(w)
  if (!uid) {
 return
}
  await db.update(users)
    .set({ plan: 'free', planStatus: PlanStatus.EXPIRED, planExpiresAt: null })
    .where(eq(users.id, uid))
}

const HANDLERS: Record<string, (db: ReturnType<typeof useDb>, w: Webhook) => Promise<void>> = {
  subscription_created: handleSubscriptionCreated,
  subscription_updated: handleSubscriptionUpdated,
  subscription_cancelled: handleSubscriptionCancelled,
  subscription_expired: handleSubscriptionExpired,
  subscription_resumed: handleSubscriptionResumed,
  subscription_paused: handleSubscriptionPaused,
  subscription_unpaused: handleSubscriptionUnpaused,
  subscription_payment_success: handleSubscriptionPaymentSuccess,
  order_created: handleOrderCreated,
  order_refunded: handleOrderRefunded,
}

export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event, false)
  if (!raw) {
 return sendPyError(event, 400, 'Empty webhook body')
}

  const signature = getHeader(event, 'x-signature')
  if (!verifySignature(raw, signature)) {
    return sendPyError(event, 401, 'Invalid webhook signature')
  }

  let webhook: Webhook
  try {
    webhook = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'))
  }
  catch {
    return sendPyError(event, 400, 'Invalid JSON body')
  }

  const db = useDb()
  const webhookId: string | undefined = webhook.meta?.webhook_id
  const eventName: string | undefined = webhook.meta?.event_name

  if (webhookId) {
    // Idempotency: skip if we've already persisted this webhook_id.
    const rows = await db
      .select({ id: lemonsqueezyRawWebhooks.id })
      .from(lemonsqueezyRawWebhooks)
      // ->> extracts JSON text; cheaper than ->'..'->>'..' chaining here.
      .where(sql`data->'meta'->>'webhook_id' = ${webhookId}`)
      .limit(1)
    if (rows.length > 0) {
      return { success: true, message: 'Webhook already processed' }
    }
  }

  // Persist the raw payload first so even handler failures leave a trace.
  await db.insert(lemonsqueezyRawWebhooks).values({
    data: webhook,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any)

  const handler = eventName ? HANDLERS[eventName] : undefined
  if (handler) {
    try {
      await handler(db, webhook)
    }
    catch (error) {
      console.error('[ls-webhook] handler failed', eventName, error)
      // Return success so LemonSqueezy doesn't keep retrying; matches Python.
      return { success: false, message: 'Webhook received but processing failed' }
    }
  }
  else {
    console.warn('[ls-webhook] unhandled event', eventName)
  }

  return { success: true, message: 'Webhook processed successfully' }
})
