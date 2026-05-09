<script setup lang="ts">
import { useCS } from '@roku-ui/vue'
import { computed } from 'vue'

defineProps<{
  title?: string
  description?: string
  loading?: boolean
}>()

const borderCS = useCS({
  type: 'border',
  color: 'surface',
  index: { dark: 7, light: 4 },
})

const containerCS = useCS({
  type: 'bg',
  color: 'surface',
  index: { dark: 9, light: 1 },
})
const cs = computed(() => ({
  style: {
    ...borderCS.value.style,
    ...containerCS.value.style,
  },
  class: [borderCS.value.class, containerCS.value.class],
}))
</script>

<template>
  <div
    class="pt-6 border-b flex"
    v-bind="cs"
  >
    <div class="mx-auto my-8 px-7 max-w-6xl w-6xl">
      <div
        v-if="loading"
        class="text-3xl mb-4 bg-surface-variant-1 bg-op50 h-36px w-40 animate-pulse"
      />
      <div
        v-else
        class="text-3xl mb-4"
      >
        {{ title }}
      </div>
      <div
        v-if="loading"
        class="text-sm bg-surface-variant-1 bg-op50 h-20px w-60 animate-pulse"
      />
      <div
        v-else
        class="text-sm op75"
      >
        {{ description }}
      </div>
    </div>
  </div>
</template>
