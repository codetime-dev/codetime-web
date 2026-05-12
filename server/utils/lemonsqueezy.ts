import process from 'node:process'
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

// Initialise the LemonSqueezy SDK once per Nitro worker. The SDK module
// stores the apiKey on a singleton, so calling setup more than once just
// overwrites it; we still gate behind a flag to avoid spamming logs.

let ready = false
export function useLemonSqueezy() {
  if (!ready) {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY
    if (!apiKey) {
      throw new Error('LEMONSQUEEZY_API_KEY environment variable is required')
    }
    lemonSqueezySetup({
      apiKey,
      onError: error => console.error('[lemonsqueezy]', error),
    })
    ready = true
  }
  return { storeId: process.env.LEMONSQUEEZY_STORE_ID ?? '1' }
}
