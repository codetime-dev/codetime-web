<script setup lang="ts">
import autoAnimate from '@formkit/auto-animate'

const props = withDefaults(defineProps<{
  loading?: boolean
  data: TopData[] | null
  icon: string
  title: string
  filters?: FilterItem[]
  type: 'language' | 'workspace' | 'platform'
  num?: string
  flat?: boolean
}>(), {
  filters: () => [],
})
defineEmits<{
  clickItem: [field: string, type: 'language' | 'workspace' | 'platform']
}>()
const ani = ref()
onMounted(() => {
  nextTick(() => {
    autoAnimate(ani.value!)
  })
})
const maxMinutes = computed(() => {
  if (props.data === null) {
    return 0
  }
  return Math.max(...props.data.map(d => d.minutes))
})
</script>

<template>
  <component
    :is="flat ? 'div' : 'PanelSection'"
    v-bind="flat ? {} : { num: num ?? '00', title, meta: `TOP · ${type.toUpperCase()}` }"
  >
    <template v-if="!flat" #icon>
      <i :class="icon" class="text-surface-dimmed/70 text-[15px]" />
    </template>
    <div v-if="flat" class="top-flat px-4 py-3">
      <div class="text-[10.5px] text-primary tracking-[0.32em] font-mono mb-3 flex gap-2 uppercase items-center">
        <i :class="icon" class="text-surface-dimmed/70 text-sm" />
        <span class="text-surface tracking-[0.32em]">{{ title }}</span>
      </div>
      <div ref="ani" class="flex flex-col gap-1" :style="{ minHeight: '160px' }">
        <template v-if="loading && !data">
          <div
            v-for="i in 5"
            :key="i"
            class="flex flex-col gap-1"
            :style="{ opacity: 0.7 - 0.1 * i }"
          >
            <div class="flex gap-2 items-center justify-between">
              <div class="flex gap-2 items-center">
                <div class="bg-surface-variant-1/50 h-3 w-3 animate-pulse" />
                <div class="bg-surface-variant-1/50 h-3 w-20 animate-pulse" />
              </div>
              <div class="bg-surface-variant-1/50 h-3 w-12 animate-pulse" />
            </div>
            <div class="top-bar-track">
              <div class="bg-surface-variant-1/40 h-full w-full animate-pulse" />
            </div>
          </div>
        </template>
        <template v-else>
          <button
            v-for="(d, i) in data"
            :key="d.field"
            type="button"
            class="top-row group"
            :class="i === 0 ? 'top-row-lead' : ''"
            @click="$emit('clickItem', d.field, type)"
          >
            <div class="text-[12.5px] font-mono mb-1 flex gap-2 items-center justify-between">
              <span class="inline-flex gap-2 min-w-0 truncate items-center">
                <span class="text-surface-dimmed/60 text-[12px] text-right w-3 tabular-nums">{{ String(i + 1).padStart(2, '0') }}</span>
                <template v-if="d.icon">
                  <i
                    v-if="!d.icon.startsWith('i-vscode-icons')"
                    :class="d.icon"
                    class="text-sm shrink-0"
                  />
                  <img
                    v-else
                    :src="`/vscode-icons/vscode-icons_${d.icon.split('vscode-icons-')[1]}.svg`"
                    width="14"
                    height="14"
                    :alt="d.icon.split('vscode-icons-file-type-')[1]"
                    class="shrink-0"
                    loading="lazy"
                    decoding="async"
                  >
                </template>
                <span class="truncate" :class="i === 0 ? 'text-surface font-medium' : 'text-surface/85'">{{ type === 'language' ? getLanguageName(d.field) : d.field }}</span>
              </span>
              <span class="text-[11.5px] shrink-0 tabular-nums" :class="i === 0 ? 'text-primary' : 'text-surface-dimmed'">
                {{ getDurationString(d.minutes * 60 * 1000) }}
              </span>
            </div>
            <div class="top-bar-track">
              <div
                class="top-bar-fill"
                :class="i === 0 ? 'top-bar-fill-lead' : ''"
                :style="{ width: `${maxMinutes ? d.minutes / maxMinutes * 100 : 0}%` }"
              />
            </div>
          </button>
        </template>
      </div>
    </div>
    <div
      v-else
      ref="ani"
      class="flex flex-col gap-1.5 min-h-[176px]"
    >
      <template v-if="loading && !data">
        <div
          v-for="i in 5"
          :key="i"
          class="bg-surface-variant-1/20 px-2 py-1.5 flex justify-between"
          :style="{ opacity: 0.5 + 0.5 * (-i / 5) }"
        >
          <div class="flex gap-1">
            <div class="bg-surface-variant-1/55 h-3 w-3 animate-pulse" />
            <div class="bg-surface-variant-1/55 h-3 w-20 animate-pulse" />
          </div>
          <div class="bg-surface-variant-1/55 h-3 w-16 animate-pulse" />
        </div>
      </template>
      <template v-else>
        <button
          v-for="d in data"
          :key="d.field"
          type="button"
          class="px-2 py-1.5 text-left transition-colors"
          :class="filters?.find(f => f.key === type && f.value === d.field)
            ? 'bg-primary/15 text-primary'
            : 'bg-surface-variant-1/20 text-surface hover:bg-surface-variant-1/40'"
          @click="$emit('clickItem', d.field, type)"
        >
          <div class="text-[12.5px] font-mono mb-1 flex gap-2 items-center justify-between">
            <span class="inline-flex gap-1.5 min-w-0 truncate items-center">
              <template v-if="d.icon">
                <i
                  v-if="!d.icon.startsWith('i-vscode-icons')"
                  :class="d.icon"
                  class="text-sm shrink-0"
                />
                <img
                  v-else
                  :src="`/vscode-icons/vscode-icons_${d.icon.split('vscode-icons-')[1]}.svg`"
                  width="14"
                  height="14"
                  :alt="d.icon.split('vscode-icons-file-type-')[1]"
                  class="shrink-0"
                  loading="lazy"
                  decoding="async"
                >
              </template>
              <span class="truncate">{{ type === 'language' ? getLanguageName(d.field) : d.field }}</span>
            </span>
            <span class="text-[11.5px] text-surface-dimmed shrink-0 tabular-nums">
              {{ getDurationString(d.minutes * 60 * 1000) }}
            </span>
          </div>
          <div class="bg-surface-variant-1/40 h-0.5 overflow-hidden">
            <div
              class="bg-primary h-full transition-all"
              :style="{ width: `${maxMinutes ? d.minutes / maxMinutes * 100 : 0}%` }"
            />
          </div>
        </button>
      </template>
    </div>
  </component>
</template>

<style scoped>
.top-row {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.125rem 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: opacity 200ms ease;
}

.top-row:hover {
  opacity: 0.85;
}

.top-bar-track {
  position: relative;
  height: 2px;
  background: color-mix(in srgb, var(--r-surface-border-color) 35%, transparent);
  overflow: hidden;
}

.top-bar-fill {
  height: 100%;
  background: color-mix(in srgb, var(--color-primary-1) 55%, transparent);
  transition: width 320ms ease;
}

.top-bar-fill-lead {
  background: linear-gradient(90deg, var(--color-primary-1), color-mix(in srgb, var(--color-primary-1) 60%, transparent));
}

.top-row-lead .top-bar-track {
  height: 3px;
}
</style>
