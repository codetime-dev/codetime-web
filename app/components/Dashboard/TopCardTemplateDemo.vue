<script setup lang="ts">
const data = [
  {
    field: 'python',
    minutes: 68_763,
    icon: 'i-vscode-icons-file-type-python',
  },
  {
    field: 'vue',
    minutes: 40_113,
    icon: 'i-vscode-icons-file-type-vue',
  },
  {
    field: 'typescript',
    minutes: 38_538,
    icon: 'i-vscode-icons-file-type-typescript',
  },
  {
    field: 'typescriptreact',
    minutes: 29_848,
    icon: 'i-vscode-icons-file-type-reactts',
  },
  {
    field: 'go',
    minutes: 21_171,
    icon: 'i-vscode-icons-file-type-go',
  },
]
const t = useI18N()
</script>

<template>
  <PanelSection num="01" :title="t.dashboard.overview.topTitle" flush>
    <template #icon>
      <i class="i-tabler-medal text-[15px] text-ct-fg-muted" />
    </template>
    <div class="top-demo-pad">
      <DashboardTopCardTemplate
        flat
        :data="data"
        icon="i-tabler-braces"
        :filters="[]"
        :title="t.dashboard.overview.top.language"
        type="language"
      />
    </div>
  </PanelSection>
</template>

<style scoped>
.top-demo-pad { padding: 6px 10px 14px; }
</style>
