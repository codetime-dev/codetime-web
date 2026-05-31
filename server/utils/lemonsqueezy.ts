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

// Map our site UI locale (the `[locale]` route param) onto a LemonSqueezy
// checkout language code so the hosted checkout matches the language the
// user is already browsing in, instead of LemonSqueezy's unreliable
// browser/IP auto-detection. Returns undefined for anything we can't map,
// which lets LemonSqueezy fall back to its store default.
// Supported LS codes: https://docs.lemonsqueezy.com/help/online-store/customization
const SITE_TO_LS_LOCALE: Record<string, string> = {
  'en': 'en',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-CN', // LemonSqueezy has no Traditional Chinese; Simplified is the closest
  'ja': 'ja',
  'pt-BR': 'pt',
  'it': 'it',
  'ms': 'ms',
  'ru': 'ru',
  'ua': 'en', // LemonSqueezy has no Ukrainian; fall back to English rather than Russian
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
}

export function siteLocaleToLemonSqueezy(locale?: string | null): string | undefined {
  if (!locale) {
    return undefined
  }
  return SITE_TO_LS_LOCALE[locale]
}
