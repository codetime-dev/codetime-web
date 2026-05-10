<script setup lang="ts">
// Legacy URL — redirect to the new Widgets page (Badge tab).
definePageMeta({
  middleware: [
    (to) => {
      const locale = (to.params.locale as string) || 'en'
      return navigateTo(`/${locale}/dashboard/widgets?tab=badge`, { replace: true })
    },
  ],
})
</script>

<template>
  <div />
</template>
