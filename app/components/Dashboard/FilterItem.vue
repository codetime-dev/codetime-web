<script setup lang="ts">
const props = defineProps<{
  filter: {
    key: string
    value: string
  }
}>()
const t = useI18N()

const filters = inject<FilterItem[]>('filters')

function onClickFilterItem(key: string, value: string) {
  if (filters) {
    const filter = {
      value,
      key,
    }
    if (filters.some(f => f.key === key && f.value === value)) {
      filters.splice(filters.findIndex(f => f.key === key && f.value === value), 1)
    }
    else {
      filters.push(filter)
    }
  }
}
const k = computed(() => {
  switch (props.filter.key) {
    case 'language': {
      return t.value.dashboard.overview.top.language
    }
    case 'project': {
      return t.value.dashboard.overview.top.project
    }
    case 'platform': {
      return t.value.dashboard.overview.top.platform
    }
    default: {
      return props.filter.key
    }
  }
})

const filterItemRef = ref<HTMLSpanElement | null>(null)
const pos = ref({ x: 0, y: 0 })
watchEffect(() => {
  pos.value.x = filterItemRef.value?.offsetLeft ?? 0
  pos.value.y = filterItemRef.value?.offsetTop ?? 0
})

const observer = new MutationObserver(() => {
  pos.value.x = filterItemRef.value?.offsetLeft ?? 0
  pos.value.y = filterItemRef.value?.offsetTop ?? 0
})

onMounted(() => {
  nextTick(() => {
    const targetElement = filterItemRef.value!
    const config = { attributes: true, childList: true, subtree: true }
    observer.observe(targetElement, config)
  })
})
onUnmounted(() => {
  observer.disconnect()
})
</script>

<template>
  <span
    ref="filterItemRef"
    :key="filter.key + filter.value"
    :style="{
      top: `${pos.y}px`,
      left: `${pos.x}px`,
    }"
    class="filter-pill"
  >
    <div>
      {{ k }}: {{ filter.key === 'language' ? getLanguageName(filter.value) : filter.value }}
    </div>
    <button
      class="filter-pill-close"
      @click="onClickFilterItem(filter.key, filter.value)"
    >
      <i class="i-tabler-x" />
    </button>
  </span>
</template>

<style scoped>
.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 10px;
  border-radius: var(--ct-radius-full);
  background: var(--ct-primary-soft);
  color: var(--ct-primary);
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
}
.filter-pill-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--ct-radius-full);
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
}
.filter-pill-close:hover {
  background: color-mix(in srgb, var(--ct-primary) 22%, transparent);
}
</style>
