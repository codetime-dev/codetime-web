<script setup lang="ts">
import { v3GetWorkspaceFiles } from '~/api/v3'

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

const workspaceLRU = useLRU<string>('workspace-select', 5)

const historyWorkspaceNameList = computed(() => workspaceLRU.values.value)

watch(project, (newVal) => {
  if (newVal) {
    workspaceLRU.set(newVal.id, newVal.label)
    router.push({
      query: {
        project: newVal.id,
      },
    })
  }
})

const user = useUser()

const days = ref(user.value?.plan === 'pro' ? 365 * 100 : 28)

const { data, pending } = useAsyncData(async () => {
  if (!projectName.value) {
    return null
  }
  const resp = await v3GetWorkspaceFiles({
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
      title="PROJECT"
      :meta="projectName ? `SELECTED · ${projectName}` : 'NONE SELECTED'"
    >
      <template #icon>
        <i class="i-tabler-app-window text-surface-dimmed/70 text-[15px]" />
      </template>
      <ProjectSelect v-model="project" />
      <div v-if="historyWorkspaceNameList.length > 0" class="mt-3 flex flex-wrap gap-2">
        <PanelButton
          v-for="name in historyWorkspaceNameList"
          :key="name"
          size="sm"
          @click="project = { label: name ?? '', id: name ?? '' }"
        >
          <i class="i-tabler-history text-sm" />
          <span class="tracking-normal normal-case">{{ name }}</span>
        </PanelButton>
      </div>
    </PanelSection>

    <PanelSection num="02" title="RANGE" meta="TIME WINDOW">
      <template #icon>
        <i class="i-tabler-calendar text-surface-dimmed/70 text-[15px]" />
      </template>
      <DashboardDataRange v-model:days="days" />
    </PanelSection>

    <PanelSection
      num="03"
      :title="t.dashboard.workspace.flameGraph.title"
      meta="FILE · DISTRIBUTION"
    >
      <template #icon>
        <i class="i-tabler-flame text-surface-dimmed/70 text-[15px]" />
      </template>
      <div class="bg-surface-variant-1/15 px-2 py-3 min-h-64 relative">
        <DashboardFlameChart
          v-if="data && data.length > 0"
          :line-height="height"
          :data="data"
        />
        <div
          v-else-if="pending"
          class="bg-surface-variant-1/40 inset-0 absolute animate-pulse"
        />
        <div
          v-else
          class="text-surface-dimmed/60 text-[12.5px] tracking-[0.04em] font-mono py-12 text-center"
        >
          {{ projectName ? t.dashboard.workspace.noData : t.dashboard.workspace.select.prompt }}
        </div>
      </div>
    </PanelSection>

    <PanelSection
      v-if="data && data.length > 0"
      num="04"
      title="TOP BRANCH"
      :meta="`${gitBranchCountMap.length} BRANCHES`"
    >
      <template #icon>
        <i class="i-tabler-git-branch text-surface-dimmed/70 text-[15px]" />
      </template>
      <div class="space-y-2.5">
        <div
          v-for="([branch, count]) in gitBranchCountMap.slice(0, 5)"
          :key="branch"
          class="bg-surface-variant-1/20 px-3 py-2"
        >
          <div class="text-[12.5px] font-mono mb-1.5 flex gap-3 items-center justify-between">
            <span class="text-surface truncate">{{ branch }}</span>
            <span class="text-surface-dimmed shrink-0 tabular-nums">
              {{ getDurationString(count * 60 * 1000) }}
            </span>
          </div>
          <div class="bg-surface-variant-1/40 h-0.5 overflow-hidden">
            <div
              class="bg-primary h-full transition-all"
              :style="{ width: `${maxBranchCount ? count / maxBranchCount * 100 : 0}%` }"
            />
          </div>
        </div>
      </div>
    </PanelSection>
  </DashboardPageContent>
</template>
