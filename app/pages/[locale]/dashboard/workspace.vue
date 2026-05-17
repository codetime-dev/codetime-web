<script setup lang="ts">
import { getV3UsersSelfWorkspace, getV3UsersSelfWorkspacesRecent } from '~/api/v3'

definePageMeta({
  layout: 'dashboard',
})
const t = useI18N()
const route = useRoute()
const project = ref<{
  label: string
  id: string
} | null>(route.query.project
  ? {
      label: route.query.project as string,
      id: route.query.project as string,
    }
  : null)
const router = useRouter()
const projectName = computed(() => project.value?.label)

const { data: recentWorkspacesData } = useAsyncData('workspace-recent', async () => {
  const resp = await getV3UsersSelfWorkspacesRecent({ query: { limit: 6 } })
  return resp.data?.results?.map(r => r.workspaceName) ?? []
}, { server: false, default: () => [] })

const recentWorkspaceNameList = computed(() => {
  const list = recentWorkspacesData.value ?? []
  return list.filter(name => name !== projectName.value).slice(0, 5)
})

watch(project, (newVal) => {
  if (newVal) {
    router.push({
      query: {
        project: newVal.id,
      },
    })
  }
})

const user = useUser()

const days = ref(user.value?.plan === 'pro' ? 365 * 100 : 28)

const { data, pending } = useAsyncData('workspace-files', async () => {
  if (!projectName.value) {
    return null
  }
  const resp = await getV3UsersSelfWorkspace({
    query: {
      project: projectName.value,
      days: days.value,
    },
  })
  return resp.data ?? []
}, {
  server: false,
  watch: [projectName, days],
})

function normalizeMinutes(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const gitBranchCountMap = computed(() => {
  const map = new Map<string, number>()
  if (data.value) {
    for (const d of data.value) {
      const branch = d.gitBranch || 'Unknown'
      const duration = normalizeMinutes(d.minutes)
      if (map.has(branch)) {
        map.set(branch, map.get(branch)! + duration)
      }
      else {
        map.set(branch, duration)
      }
    }
  }
  return [...map].toSorted((a, b) => b[1] - a[1])
})
const maxBranchCount = computed(() => {
  const counts = gitBranchCountMap.value.map(([, count]) => count)
  return counts.length > 0 ? Math.max(...counts) : 0
})
const height = 26
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.workspace"
    :description="t.dashboard.pageHeader.description.workspace"
  />
  <DashboardPageContent>
    <PanelSection
      num="01"
      :title="t.dashboard.workspace.project"
      :meta="projectName ? `selected · ${projectName}` : 'none selected'"
    >
      <template #icon>
        <i class="i-tabler-app-window ws-icon" />
      </template>
      <ProjectSelect v-model="project" />
      <div v-if="recentWorkspaceNameList.length > 0" class="ws-history">
        <UButton
          v-for="name in recentWorkspaceNameList"
          :key="name"
          variant="secondary"
          size="md"
          icon-left="i-tabler-history"
          @click="project = { label: name, id: name }"
        >
          {{ name }}
        </UButton>
      </div>
    </PanelSection>

    <PanelSection num="02" :title="t.dashboard.workspace.range" :meta="t.dashboard.workspace.range">
      <template #icon>
        <i class="i-tabler-calendar ws-icon" />
      </template>
      <DashboardDataRange v-model:days="days" />
    </PanelSection>

    <PanelSection
      num="03"
      :title="t.dashboard.workspace.flameGraph.title"
    >
      <template #icon>
        <i class="i-tabler-flame ws-icon" />
      </template>
      <div class="ws-flame">
        <DashboardFlameChart
          v-if="data && data.length > 0"
          :line-height="height"
          :data="data"
        />
        <div v-else-if="pending" class="ws-flame-skel" />
        <div v-else class="ws-flame-empty">
          {{ projectName ? t.dashboard.workspace.noData : t.dashboard.workspace.select.prompt }}
        </div>
      </div>
    </PanelSection>

    <PanelSection
      v-if="data && data.length > 0"
      num="04"
      :title="t.dashboard.workspace.topBranch"
      :meta="`${gitBranchCountMap.length}`"
    >
      <template #icon>
        <i class="i-tabler-git-branch ws-icon" />
      </template>
      <div class="ws-branch-list">
        <div
          v-for="([branch, count]) in gitBranchCountMap.slice(0, 5)"
          :key="branch"
          class="ws-branch"
        >
          <div class="ws-branch-head">
            <span class="ws-branch-name truncate">{{ branch }}</span>
            <span class="ws-branch-val tabular-nums">
              {{ getDurationString(count * 60 * 1000) }}
            </span>
          </div>
          <div class="ws-branch-track">
            <div
              class="ws-branch-fill"
              :style="{ width: `${maxBranchCount ? count / maxBranchCount * 100 : 0}%` }"
            />
          </div>
        </div>
      </div>
    </PanelSection>
  </DashboardPageContent>
</template>

<style scoped>
.ws-icon { color: var(--ct-fg-subtle); font-size: 15px; }
.ws-history { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }

.ws-flame { min-height: 16rem; position: relative; }
.ws-flame-skel { position: absolute; inset: 0; background: var(--ct-surface-1); animation: ws-pulse 1.4s ease-in-out infinite; }
.ws-flame-empty { padding: 48px 16px; text-align: center; font-size: var(--ct-text-sm); color: var(--ct-fg-subtle); }

.ws-branch-list {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--ct-border-subtle);
}
.ws-branch { padding: 12px 0; }
.ws-branch + .ws-branch { border-top: 1px solid var(--ct-border-subtle); }
.ws-branch-head {
  display: flex; gap: 12px; align-items: center; justify-content: space-between;
  margin-bottom: 8px; font-size: var(--ct-text-sm);
}
.ws-branch-name {
  color: var(--ct-fg);
  font-weight: var(--ct-weight-medium);
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-branch-val { color: var(--ct-fg-subtle); flex-shrink: 0; white-space: nowrap; }
.ws-branch-track { height: 2px; background: var(--ct-surface-2); overflow: hidden; }
.ws-branch-fill { height: 100%; background: var(--ct-primary); transition: width 320ms var(--ct-ease); }
@keyframes ws-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
</style>
