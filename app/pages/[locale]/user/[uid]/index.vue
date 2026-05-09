<script setup lang="ts">
definePageMeta({
  middleware: ['i18n'],
})

const route = useRoute()

const uid = computed(() => Number(route.params.uid))
</script>

<template>
  <NuxtLayout name="user">
    <UserProfile :user-id="uid" />
  </NuxtLayout>
</template>
