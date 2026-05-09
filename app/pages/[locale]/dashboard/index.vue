<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})

const t = useI18N()
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.overview"
    :description="t.dashboard.pageHeader.description.overview"
  />
  <DashboardPageContent>
    <UnifiedUserDashboard
      :show-user-info="false"
      :show-controls="true"
      layout="dashboard"
    />
  </DashboardPageContent>
</template>
