import { postV3PaymentsCheckout } from '~/api/v3'

export function useCheckoutLink(isAnuual: Ref<boolean>, isOneTime: Ref<boolean>) {
  const user = useUser()
  // Current site UI locale, forwarded so the hosted checkout renders in the
  // same language instead of LemonSqueezy's flaky browser/IP detection.
  const locale = useLocale()

  // Errors are swallowed deliberately: the SDK is configured with
  // throwOnError, but this helper is awaited at the top of User.vue's
  // setup script. If the checkout API hiccups (LemonSqueezy 5xx,
  // unconfigured variant, transient auth), an unhandled reject crashes
  // the whole settings page through <Suspense> and renders a 500 — the
  // subscribe button isn't load-bearing enough to take the page down.
  const getCheckoutLink = async () => {
    if (!user.value) {
      return null
    }
    if (user.value.plan === 'pro') {
      return null
    }

    try {
      const resp = await postV3PaymentsCheckout({
        body: {
          type: isAnuual.value ? 'yearly' : 'monthly',
          product: isOneTime.value ? 'onetime' : 'subscription',
          locale: locale.value,
        },
      })
      return resp.data?.checkoutUrl ?? null
    }
    catch (error) {
      console.error('Failed to create checkout link:', error)
      return null
    }
  }

  return {
    getCheckoutLink,
  }
}
