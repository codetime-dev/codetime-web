<script setup lang="ts">
// Global promo banner for the currently-active LemonSqueezy discount. Lives on
// its own (not inside the lazily-hydrated pricing table) so the discount is
// fetched as soon as the page mounts instead of only once the user scrolls the
// pricing section into view. Renders a Teleport into <body> so it sits at the
// very top of the page it's mounted on.
const user = useUser()
const { discountText } = useActiveDiscount()

const discountRef = ref()
watchEffect(() => {
  if (discountRef.value) {
    try {
      const dom = discountRef.value
      const body = document.querySelector('body')
      body?.insertBefore(dom, body.firstChild)
    }
    catch (error) {
      console.error(error)
    }
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="user && user.plan !== 'pro' && discountText"
      ref="discountRef"
      class="text-sm text-white px-1 py-2 bg-sky-900 flex min-h-2em w-full items-center justify-center relative z-110"
    >
      {{ discountText }}
    </div>
  </Teleport>
</template>
