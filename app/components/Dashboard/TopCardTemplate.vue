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
      <i :class="icon" style="color: var(--ct-fg-subtle); font-size: 15px" />
    </template>
    <div v-if="flat" class="top-flat">
      <div class="top-flat-head">
        <i :class="icon" class="top-flat-icon" />
        <span class="top-flat-title">{{ title }}</span>
      </div>
      <div ref="ani" class="flex flex-col gap-1" :style="{ minHeight: '160px' }">
        <template v-if="loading && !data">
          <!-- Skeleton rows mirror the real .top-row layout exactly
               (paddings, rank slot, head row, bar track) so the
               vertical rhythm and per-row height match the loaded
               state — preventing the shift users saw when the
               skeleton's compact rows expanded into the real
               14px-text rows. -->
          <div
            v-for="i in 5"
            :key="i"
            class="top-row"
            :style="{ opacity: 0.7 - 0.1 * (i - 1) }"
          >
            <div class="top-row-head">
              <span class="inline-flex gap-2 min-w-0 items-center">
                <span class="top-row-rank tabular-nums">{{ String(i).padStart(2, '0') }}</span>
                <div class="top-skel top-skel-icon" />
                <div class="top-skel top-skel-name" />
              </span>
              <div class="top-skel top-skel-val" />
            </div>
            <div class="top-bar-track">
              <div class="top-skel top-bar-fill-skel" />
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
            <div class="top-row-head">
              <span class="inline-flex gap-2 min-w-0 truncate items-center">
                <span class="top-row-rank tabular-nums">{{ String(i + 1).padStart(2, '0') }}</span>
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
                <span class="truncate" :class="i === 0 ? 'top-row-name top-row-name-lead' : 'top-row-name'">{{ type === 'language' ? getLanguageName(d.field) : d.field }}</span>
              </span>
              <span class="top-row-val tabular-nums" :class="i === 0 ? 'top-row-val-lead' : ''">
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
          class="top-skel-row"
          :style="{ opacity: 0.5 + 0.5 * (-i / 5) }"
        >
          <div class="flex gap-1">
            <div class="top-skel top-skel-icon" />
            <div class="top-skel top-skel-name" />
          </div>
          <div class="top-skel top-skel-val" />
        </div>
      </template>
      <template v-else>
        <button
          v-for="d in data"
          :key="d.field"
          type="button"
          class="top-cell"
          :class="{ 'top-cell-active': filters?.find(f => f.key === type && f.value === d.field) }"
          @click="$emit('clickItem', d.field, type)"
        >
          <div class="top-row-head">
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
              <span class="top-row-name truncate">{{ type === 'language' ? getLanguageName(d.field) : d.field }}</span>
            </span>
            <span class="top-row-val tabular-nums">
              {{ getDurationString(d.minutes * 60 * 1000) }}
            </span>
          </div>
          <div class="top-bar-track">
            <div
              class="top-bar-fill"
              :style="{ width: `${maxMinutes ? d.minutes / maxMinutes * 100 : 0}%` }"
            />
          </div>
        </button>
      </template>
    </div>
  </component>
</template>

<style scoped>
.top-flat {
  padding: 14px 16px;
  /* Without these, a long workspace path or language name can paint past
     the grid cell and push the dashboard wider than the viewport on
     narrow phones. */
  min-width: 0;
  overflow: hidden;
}
.top-flat-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.top-flat-icon { color: var(--ct-fg-subtle); font-size: 14px; }
.top-flat-title {
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  letter-spacing: var(--ct-tracking-wide);
}

.top-row {
  display: block;
  width: 100%;
  text-align: left;
  padding: 4px 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  border-radius: var(--ct-radius-md);
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
}
.top-row:hover { background: var(--ct-surface-1); }

.top-row-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-size: var(--ct-text-sm);
  margin-bottom: 4px;
  padding: 0 4px;
}
.top-row-rank {
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  width: 14px;
  text-align: right;
}
.top-row-name { color: var(--ct-fg-muted); }
.top-row-name-lead { color: var(--ct-fg); font-weight: var(--ct-weight-medium); }
.top-row-val {
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  flex-shrink: 0;
  white-space: nowrap;
}
.top-row-val-lead { color: var(--ct-primary); font-weight: var(--ct-weight-medium); }

.top-bar-track {
  position: relative;
  height: 2px;
  background: var(--ct-surface-2);
  overflow: hidden;
  border-radius: 2px;
  margin: 0 4px;
}
.top-bar-fill {
  height: 100%;
  background: var(--ct-primary);
  transition: width 320ms var(--ct-ease);
}
.top-row-lead .top-bar-track { height: 3px; }

.top-cell {
  padding: 8px 10px;
  text-align: left;
  background: transparent;
  border: 1px solid var(--ct-border-subtle);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              border-color var(--ct-duration-fast) var(--ct-ease);
}
.top-cell:hover { background: var(--ct-surface-1); }
.top-cell-active {
  background: var(--ct-primary-soft);
  border-color: color-mix(in srgb, var(--ct-primary) 40%, transparent);
}
.top-cell-active:hover {
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
  border-color: color-mix(in srgb, var(--ct-primary) 50%, transparent);
}
.top-cell-active .top-row-name { color: var(--ct-primary); }

.top-skel-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
}
.top-skel { background: var(--ct-surface-2); animation: top-pulse 1.4s ease-in-out infinite; }
.top-skel-icon { width: 12px; height: 12px; }
.top-skel-name { width: 80px; height: 12px; }
.top-skel-val { width: 60px; height: 12px; }
.top-bar-fill-skel { height: 100%; width: 100%; }
@keyframes top-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}
</style>
