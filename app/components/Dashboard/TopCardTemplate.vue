<script setup lang="ts">
import autoAnimate from '@formkit/auto-animate'
import { useContainerDefaultVariantCS, useContainerFilledCS } from '@roku-ui/vue'

const props = withDefaults(defineProps<{
  loading?: boolean
  data: TopData[] | null
  icon: string
  title: string
  filters?: FilterItem[]
  type: 'language' | 'workspace' | 'platform'
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
const filledCS = useContainerFilledCS('primary')
const surfaceVariantCS = useContainerDefaultVariantCS()
</script>

<template>
  <CardBase
    :loading="loading"
    style="width: -webkit-fill-available;"
    class="h-232px max-w-[calc(100vw-0.5rem)]"
  >
    <div
      ref="ani"
      class="flex flex-col gap-2"
    >
      <div class="flex gap-2 items-center">
        <i
          :class="icon"
        />
        <div class="text-lg">
          {{ title }}
        </div>
      </div>
      <template v-if="loading && !data">
        <div
          v-for="i in 5"
          :key="i"
          class="py-1 flex justify-between"
          :style="{
            opacity: 0.5 + 0.5 * (-i / 5),
          }"
        >
          <div class="flex gap-1">
            <div
              class="bg-surface-variant-1 h-20px w-20px animate-pulse"
            />
            <div
              class="bg-surface-variant-1 h-20px w-20 animate-pulse"
            />
          </div>
          <div
            class="bg-surface-variant-1 h-20px w-30 animate-pulse"
          />
        </div>
      </template>
      <template v-else>
        <div
          v-for="d in data"
          :key="d.field"
        >
          <div
            class="text-sm flex gap-2 cursor-pointer justify-between"
            :class="filters?.find(f => f.key === type && f.value === d.field) ? 'text-primary-on' : ''"
            @click="$emit('clickItem', d.field, type)"
          >
            <div class="text-nowrap truncate overflow-hidden">
              <template v-if="d.icon">
                <i
                  v-if="!d.icon.startsWith('i-vscode-icons')"
                  :class="d.icon"
                  class="mb-0.5 mr-1 h-14px w-14px inline-block"
                />
                <img
                  v-else
                  :src="`/vscode-icons/vscode-icons_${d.icon.split('vscode-icons-')[1]}.svg`"
                  class="mb-0.5 mr-1 inline-block"
                  width="14"
                  height="14"
                  :alt="d.icon.split('vscode-icons-file-type-')[1]"
                  loading="lazy"
                  decoding="async"
                >
              </template>
              {{ type === 'language' ? getLanguageName(d.field) : d.field }}
            </div>
            <div class="flex-shrink-0">
              {{ getDurationString(d.minutes * 60 * 1000) }}
            </div>
          </div>
          <div
            v-bind="surfaceVariantCS"
            class="my-0.5 rounded-xl h-0.5 overflow-hidden"
          >
            <div
              v-bind="filledCS"
              class="h-full"
              :style="{ width: `${d.minutes / maxMinutes * 100}%` }"
            />
          </div>
        </div>
      </template>
    </div>
  </CardBase>
</template>
