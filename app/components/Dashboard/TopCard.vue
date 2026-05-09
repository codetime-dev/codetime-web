<script setup lang="ts">
const props = withDefaults(defineProps<{
  icon: string
  title: string
  type: 'language' | 'workspace' | 'platform'
  filters?: FilterItem[]
  days: number
  num?: string
  flat?: boolean
}>(), {
  filters: () => [],
})

const transform = computed(() => {
  switch (props.type) {
    case 'language': {
      return transformTopLanguageData
    }
    case 'platform': {
      return transformTopPlatformData
    }
  }
  return ''
})
const minutes = computed(() => props.days * 24 * 60)

const { status, data: rawData } = fetchTop(props.type, minutes, 5, props.filters, { transform: transform.value })

const isLoading = computed(() => unref(status) === 'pending')
const data = computed(() => unref(rawData) ?? null)
const filters = inject<FilterItem[]>('filters')

function onClickItem(field: string, type: 'language' | 'workspace' | 'platform') {
  if (filters) {
    const filter = {
      value: field,
      key: type,
    }
    if (filters.some(f => f.key === type && f.value === field)) {
      filters.splice(filters.findIndex(f => f.key === type && f.value === field), 1)
    }
    else {
      filters.push(filter)
    }
  }
}
</script>

<template>
  <DashboardTopCardTemplate
    :loading="isLoading"
    :data="data"
    :icon="icon"
    :title="title"
    :filters="filters"
    :type="type"
    :num="num"
    :flat="flat"
    @click-item="onClickItem"
  />
</template>
