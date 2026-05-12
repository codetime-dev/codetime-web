import { listDiscounts } from '@lemonsqueezy/lemonsqueezy.js'
import { defineEventHandler } from 'h3'
import { useLemonSqueezy } from '../../../utils/lemonsqueezy'

// Mirrors GET /v3/discounts/active. Pages through LemonSqueezy until
// exhaustion, drops drafts and 100%-percent discounts, returns the
// trimmed `DiscountPublic` projection. Python implementation lives at
// codetime-server-v3/src/services/discounts.py.

defineRouteMeta({
  openAPI: {
    tags: ['discounts'],
    summary: 'List published, non-100% discounts',
    responses: {
      200: {
        description: 'Active discounts',
        content: {
          'application/json': {
            schema: { type: 'array', items: { $ref: '#/components/schemas/DiscountPublic' } },
          },
        },
      },
      500: { $ref: '#/components/responses/BadRequest' },
    },
    $global: {
      components: {
        schemas: {
          DiscountPublic: {
            type: 'object',
            required: ['id', 'name', 'code', 'amount', 'amount_type', 'duration', 'status'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              code: { type: 'string' },
              amount: { type: 'integer' },
              amount_type: { type: 'string', description: '"percent" or "fixed"' },
              expires_at: { type: 'string', format: 'date-time', nullable: true },
              duration: { type: 'string', description: '"once", "repeating", or "forever"' },
              duration_in_months: { type: 'integer', nullable: true },
              status: { type: 'string', description: '"published" or "draft"' },
            },
          },
        },
      },
    },
  },
})

type DiscountAttributes = {
  store_id?: number
  name?: string
  code?: string
  amount?: number
  amount_type?: 'percent' | 'fixed'
  status?: 'published' | 'draft'
  duration?: 'once' | 'repeating' | 'forever'
  duration_in_months?: number | null
  expires_at?: string | null
}

type DiscountRow = { id: string, attributes?: DiscountAttributes }

const PAGE_SIZE = 100

export default defineEventHandler(async () => {
  const { storeId } = useLemonSqueezy()
  const out: Array<Record<string, unknown>> = []

  for (let page = 1; ; page++) {
    const { data, error } = await listDiscounts({
      filter: { storeId },
      page: { number: page, size: PAGE_SIZE },
    })
    if (error || !data) {
 break
}

    const rows = (data.data ?? []) as DiscountRow[]
    for (const row of rows) {
      const a = row.attributes
      if (!a) {
 continue
}
      if (a.status !== 'published') {
 continue
}
      // Drop 100% percentage discounts — same gate Python applies.
      if (a.amount_type === 'percent' && (a.amount ?? 0) >= 100) {
 continue
}

      out.push({
        id: String(row.id ?? ''),
        name: a.name ?? '',
        code: a.code ?? '',
        amount: a.amount ?? 0,
        amount_type: a.amount_type ?? '',
        expires_at: a.expires_at ?? null,
        duration: a.duration ?? '',
        duration_in_months: a.duration_in_months ?? null,
        status: a.status ?? '',
      })
    }

    const hasNext = Boolean((data.links as Record<string, unknown> | undefined)?.next)
    if (!hasNext || rows.length < PAGE_SIZE) {
 break
}
  }

  return out
})
