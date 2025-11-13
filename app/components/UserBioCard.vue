<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  bio?: string | null
  canEdit: boolean
  isEditing: boolean
  bioDraft: string
  bioRemaining: number
  bioSaving: boolean
  bioStatus: 'success' | 'error' | null
  bioStatusMessage: string
  maxLength: number
}>()

const emit = defineEmits<{
  (e: 'startEdit'): void
  (e: 'cancelEdit'): void
  (e: 'save'): void
  (e: 'update:bio-draft', value: string): void
}>()

const bioDraftModel = computed({
  get: () => props.bioDraft,
  set: value => emit('update:bio-draft', value),
})

const statusClass = computed(() => {
  if (props.bioStatus === 'error') {
    return 'text-rose-500'
  }
  if (props.bioStatus === 'success') {
    return 'text-emerald-500'
  }
  return 'text-surface'
})

const t = useI18N()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl font-bold">
          {{ t.dashboard.profile.bio.title }}
        </h2>
        <p class="text-sm text-surface-dimmed">
          {{ t.dashboard.profile.bio.subtitle }}
        </p>
      </div>
      <button
        v-if="canEdit && !isEditing"
        class="border-surface-dimmed/60 text-sm px-4 py-2 border rounded-full inline-flex gap-2 transition-colors items-center hover:text-primary hover:border-primary"
        type="button"
        @click="emit('startEdit')"
      >
        <i class="i-tabler-edit" />
        <span>{{ t.dashboard.profile.bio.edit }}</span>
      </button>
    </div>

    <div v-if="isEditing" class="space-y-3">
      <textarea
        v-model="bioDraftModel"
        :maxlength="maxLength"
        rows="4"
        class="border-surface-dimmed/60 bg-surface-variant-1/30 text-sm p-4 outline-none border rounded-2xl w-full focus:border-primary"
        :placeholder="t.dashboard.profile.bio.placeholder"
      />
      <div class="text-xs text-surface-dimmed flex items-center justify-between">
        <span>{{ bioDraft.length }} / {{ maxLength }}</span>
        <span v-if="bioRemaining < 0" class="text-rose-500">
          {{ t.dashboard.profile.bio.limitExceeded }}
        </span>
      </div>
      <div class="flex flex-wrap gap-3 justify-end">
        <button
          class="border-surface-dimmed/60 text-sm px-4 py-2 border rounded-full"
          type="button"
          @click="emit('cancelEdit')"
        >
          {{ t.general.cancel }}
        </button>
        <button
          class="text-sm text-white font-semibold px-5 py-2 rounded-full bg-primary transition-opacity disabled:opacity-50"
          type="button"
          :disabled="bioSaving || bioRemaining < 0"
          @click="emit('save')"
        >
          <span v-if="bioSaving">{{ t.dashboard.profile.bio.saving }}</span>
          <span v-else>{{ t.dashboard.profile.bio.save }}</span>
        </button>
      </div>
    </div>
    <div v-else class="text-base text-surface leading-relaxed">
      <p v-if="bio">
        {{ bio }}
      </p>
      <p v-else class="text-surface-dimmed italic">
        {{ t.dashboard.profile.bio.empty }}
      </p>
    </div>

    <div
      v-if="bioStatusMessage"
      class="text-sm" :class="[statusClass]"
    >
      {{ bioStatusMessage }}
    </div>
  </div>
</template>
