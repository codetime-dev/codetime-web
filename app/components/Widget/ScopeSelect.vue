<script setup lang="ts">
import { getV3Tags, getV3UsersSelfWorkspacesRecent, getV3UsersSelfWorkspacesSearch } from '~/api/v3'

// Combined picker that surfaces both user tags and workspaces in one
// dropdown. The selected option carries its `kind` so callers can route
// to the right backend filter (`tag` vs `project`).

export type ScopeOption = {
  label: string
  id: string
  kind: 'tag' | 'workspace'
  color?: string | null
  emoji?: string | null
  isRecent?: boolean
}

const modelValue = defineModel<ScopeOption | null>()
const t = useI18N()

// Tags are a small per-user list — fetch once and filter in memory.
const { data: tagData } = await useAsyncData('badge-scope-tags', async () => {
  const resp = await getV3Tags()
  return resp.data ?? []
}, {
  server: false,
})

const tagOptions = computed<ScopeOption[]>(() => {
  return (tagData.value ?? []).map(tag => ({
    label: tag.name,
    id: `tag:${tag.name}`,
    kind: 'tag' as const,
    color: tag.color,
    emoji: tag.emoji,
  }))
})

// Workspaces use the existing recent / search endpoints. Memoize recent
// so a re-open with an empty query does not refetch.
let recentPromise: Promise<ScopeOption[]> | null = null
async function getRecentWorkspaces(): Promise<ScopeOption[]> {
  if (!recentPromise) {
    recentPromise = (async () => {
      const resp = await getV3UsersSelfWorkspacesRecent({ query: { limit: 10 } })
      return (resp.data?.results ?? []).map(r => ({
        label: r.workspaceName,
        id: `workspace:${r.workspaceName}`,
        kind: 'workspace' as const,
        isRecent: true,
      }))
    })()
  }
  return recentPromise
}

async function loader(q: string): Promise<ScopeOption[]> {
  const trimmed = q.trim().toLowerCase()
  if (!trimmed) {
    const recent = await getRecentWorkspaces()
    return [...tagOptions.value, ...recent]
  }
  const matchedTags = tagOptions.value.filter(o => o.label.toLowerCase().includes(trimmed))
  const resp = await getV3UsersSelfWorkspacesSearch({ query: { q, limit: 10 } })
  const workspaces: ScopeOption[] = (resp.data?.results ?? []).map(item => ({
    label: item.workspaceName,
    id: `workspace:${item.workspaceName}`,
    kind: 'workspace',
  }))
  return [...matchedTags, ...workspaces]
}
</script>

<template>
  <WidgetEntitySelect
    v-model="modelValue"
    :loader="loader"
    :placeholder="t.dashboard.badge.placeholder.scope"
    :empty-text="t.dashboard.projectSelector.noneText"
  >
    <template #option="{ option, selected }">
      <span v-if="option.kind === 'tag' && option.color" class="scope-swatch" :style="{ background: option.color }" />
      <i v-else-if="option.isRecent" class="i-tabler-history scope-icon" />
      <i v-else-if="option.kind === 'workspace'" class="i-tabler-folder scope-icon" />
      <span class="scope-label">
        <span v-if="option.emoji" class="scope-emoji">{{ option.emoji }}</span>
        {{ option.label }}
      </span>
      <span class="scope-kind">{{ option.kind === 'tag' ? t.dashboard.badge.scope.tag : t.dashboard.badge.scope.workspace }}</span>
      <i v-if="selected" class="i-tabler-check text-primary text-sm" />
    </template>
  </WidgetEntitySelect>
</template>

<style scoped>
.scope-swatch {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 18%, transparent);
}
.scope-icon { color: var(--ct-fg-subtle); font-size: 14px; flex-shrink: 0; }
.scope-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1 1 auto;
  min-width: 0;
}
.scope-emoji { font-size: 14px; }
.scope-kind {
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}
</style>
