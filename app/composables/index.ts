import { postV3PaymentsCheckout } from '~/api/v3'

export function useCheckoutLink(isAnuual: Ref<boolean>, isOneTime: Ref<boolean>) {
  const user = useUser()

  const getCheckoutLink = async () => {
    if (!user.value) {
      return null
    }
    if (user.value.plan === 'pro') {
      return null
    }

    const resp = await postV3PaymentsCheckout({
      body: {
        type: isAnuual.value ? 'yearly' : 'monthly',
        product: isOneTime.value ? 'onetime' : 'subscription',
      },
    })

    const checkoutUrl = resp.data?.checkoutUrl
    return checkoutUrl
  }

  return {
    getCheckoutLink,
  }
}
