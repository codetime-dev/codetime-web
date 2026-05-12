import { defineEventHandler } from 'h3'

// Mirrors GET /v3/payments/products. Python's PaymentService.get_products
// returns a hard-coded array (the LemonSqueezy fetch is documented as
// "mock" / not yet wired up). We mirror the exact byte-for-byte output.

defineRouteMeta({
  openAPI: {
    tags: ['payments'],
    summary: 'List available products',
    responses: {
      200: {
        description: 'Products',
        content: {
          'application/json': {
            schema: { type: 'array', items: { $ref: '#/components/schemas/ProductPublic' } },
          },
        },
      },
    },
    $global: {
      components: {
        schemas: {
          ProductPublic: {
            type: 'object',
            required: ['id', 'name', 'description', 'price', 'currency'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'integer', description: 'Price in cents' },
              currency: { type: 'string' },
              interval: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  },
})

const PRODUCTS = [
  {
    id: '1',
    name: 'CodeTime Pro Monthly',
    description: 'Professional plan with unlimited tracking',
    price: 999,
    currency: 'USD',
    interval: 'month',
  },
  {
    id: '2',
    name: 'CodeTime Pro Yearly',
    description: 'Professional plan with unlimited tracking (yearly)',
    price: 9999,
    currency: 'USD',
    interval: 'year',
  },
]

export default defineEventHandler(() => PRODUCTS)
