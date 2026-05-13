<script setup lang="ts">
import { v3RecentWorkspaces, v3SearchWorkspaces } from '~/api/v3'

type ProjectOption = { label: string, id: string, isRecent?: boolean }

const modelValue = defineModel<ProjectOption | null>()
const t = useI18N()

// Lazy memo for the recent list — fetched at most once per mount so an
// empty-query reopen does not refetch.
let recentPromise: Promise<ProjectOption[]> | null = null
async function getRecent(): Promise<ProjectOption[]> {
  if (!recentPromise) {
    recentPromise = (async () => {
      const resp = await v3RecentWorkspaces({ query: { limit: 15 } })
      return (resp.data?.results ?? []).map(r => ({
        label: r.workspaceName,
        id: r.workspaceName,
        isRecent: true,
      }))
    })()
  }
  return recentPromise
}

async function loader(q: string): Promise<ProjectOption[]> {
  if (!q) {
    return getRecent()
  }
  const resp = await v3SearchWorkspaces({ query: { q, limit: 10 } })
  return (resp.data?.results ?? []).map(item => ({
    label: item.workspaceName,
    id: item.workspaceName,
  }))
}
</script>

<template>
  <WidgetEntitySelect
    v-model="modelValue"
    :loader="loader"
    :placeholder="t.dashboard.badge.placeholder.project"
    :empty-text="t.dashboard.projectSelector.noneText"
  >
    <template #option="{ option, selected }">
      <i v-if="option.isRecent" class="i-tabler-history proj-option-icon" />
      <span class="entity-option-label">{{ option.label }}</span>
      <i v-if="selected" class="i-tabler-check text-primary text-sm" />
    </template>
  </WidgetEntitySelect>
</template>

<style scoped>
.proj-option-icon { color: var(--ct-fg-subtle); font-size: 14px; flex-shrink: 0; }
.entity-option-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1 1 auto;
  min-width: 0;
}
</style>
