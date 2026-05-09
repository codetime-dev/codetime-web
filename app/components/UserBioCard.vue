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

const progressPercent = computed(() => {
  if (props.bioDraft.length === 0) {
    return 0
  }
  return Math.min(100, Math.round((props.bioDraft.length / props.maxLength) * 100))
})

const progressColor = computed(() => {
  if (props.bioRemaining < 0) {
    return 'bg-rose-500'
  }
  if (progressPercent.value > 90) {
    return 'bg-amber-500'
  }
  if (progressPercent.value > 70) {
    return 'bg-primary'
  }
  return 'bg-emerald-500'
})

const statusClass = computed(() => {
  if (props.bioStatus === 'error') {
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
  }
  if (props.bioStatus === 'success') {
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  }
  return ''
})

const t = useI18N()
</script>

<template>
  <div class="space-y-5">
    <!-- Header row -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex gap-3 items-center">
        <div class="bg-primary/10 text-primary rounded-xl flex h-10 w-10 items-center justify-center">
          <i class="i-tabler-quote text-xl" />
        </div>
        <div>
          <h2 class="text-xl font-bold">
            {{ t.dashboard.profile.bio.title }}
          </h2>
          <p class="text-sm text-surface-dimmed">
            {{ t.dashboard.profile.bio.subtitle }}
          </p>
        </div>
      </div>
      <button
        v-if="canEdit && !isEditing"
        class="border-surface-dimmed/40 bg-surface-variant-1/30 hover:border-primary/50 hover:bg-primary/5 text-sm px-4 py-2 border rounded-xl inline-flex gap-2 transition-all duration-200 items-center hover:text-primary hover:shadow-sm active:scale-97"
        type="button"
        @click="emit('startEdit')"
      >
        <i class="i-tabler-edit text-base" />
        <span>{{ t.dashboard.profile.bio.edit }}</span>
      </button>
    </div>

    <!-- Edit mode -->
    <div v-if="isEditing" class="space-y-4">
      <div class="relative">
        <textarea
          v-model="bioDraftModel"
          :maxlength="maxLength"
          rows="4"
          class="border-surface-dimmed/50 bg-surface-variant-1/20 placeholder:text-surface-dimmed/50 focus:border-primary/60 focus:bg-surface-variant-1/40 text-sm p-4 pb-10 outline-none border rounded-2xl w-full resize-none transition-all duration-200 focus:shadow-sm"
          :placeholder="t.dashboard.profile.bio.placeholder"
        />
        <!-- Char count inside the textarea -->
        <div class="text-xs text-surface-dimmed flex gap-1 items-center bottom-3 right-3 absolute">
          <span
            class="font-mono tabular-nums"
            :class="{
              'text-rose-500': bioRemaining < 0,
              'text-amber-500': bioRemaining >= 0 && bioRemaining < 20,
            }"
          >
            {{ bioRemaining }}
          </span>
          <span class="text-surface-dimmed/40">/ {{ maxLength }}</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="bg-surface-dimmed/30 rounded-full h-1 w-full overflow-hidden">
        <div
          class="rounded-full h-full transition-all duration-300 ease-out"
          :class="[progressColor]"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <div class="flex flex-wrap gap-3 items-center justify-between">
        <span
          v-if="bioRemaining < 0"
          class="text-xs text-rose-500 flex gap-1 items-center"
        >
          <i class="i-tabler-alert-triangle text-sm" />
          {{ t.dashboard.profile.bio.limitExceeded }}
        </span>
        <span v-else class="text-xs text-surface-dimmed" />

        <div class="flex gap-3">
          <button
            class="border-surface-dimmed/40 hover:bg-surface-variant-1/50 hover:border-surface-dimmed/60 text-sm px-5 py-2.5 border rounded-xl transition-all duration-200 active:scale-97"
            type="button"
            @click="emit('cancelEdit')"
          >
            {{ t.general.cancel }}
          </button>
          <button
            class="hover:shadow-primary/20 text-sm text-white font-semibold px-6 py-2.5 rounded-xl bg-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md active:scale-97"
            type="button"
            :disabled="bioSaving || bioRemaining < 0"
            @click="emit('save')"
          >
            <span v-if="bioSaving" class="inline-flex gap-2 items-center">
              <i class="i-tabler-loader animate-spin" />
              {{ t.dashboard.profile.bio.saving }}
            </span>
            <span v-else class="inline-flex gap-2 items-center">
              <i class="i-tabler-device-floppy" />
              {{ t.dashboard.profile.bio.save }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- View mode -->
    <div v-else>
      <div
        v-if="bio"
        class="bg-surface-variant-1/20 border-surface-dimmed/20 border-l-primary/40 text-base text-surface leading-relaxed p-5 border-l-3 rounded-r-2xl"
      >
        <p class="whitespace-pre-wrap break-words">
          {{ bio }}
        </p>
      </div>
      <div
        v-else
        class="border-surface-dimmed/20 py-10 text-center border rounded-2xl border-dashed"
      >
        <i class="i-tabler-message-circle text-surface-dimmed/30 text-3xl mx-auto mb-2 block" />
        <p class="text-surface-dimmed/60 text-sm">
          {{ t.dashboard.profile.bio.empty }}
        </p>
        <button
          v-if="canEdit"
          class="text-primary/70 text-sm mt-3 inline-flex gap-1 transition-colors items-center hover:text-primary"
          type="button"
          @click="emit('startEdit')"
        >
          <i class="i-tabler-plus" />
          {{ t.dashboard.profile.bio.edit }}
        </button>
      </div>
    </div>

    <!-- Status message with animation -->
    <Transition name="slide-fade">
      <div
        v-if="bioStatusMessage"
        class="text-sm px-4 py-2.5 border rounded-xl flex gap-2 items-center"
        :class="[statusClass]"
      >
        <i
          :class="{
            'i-tabler-check': bioStatus === 'success',
            'i-tabler-alert-circle': bioStatus === 'error',
          }"
          class="text-base shrink-0"
        />
        <span>{{ bioStatusMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.active\:scale-97:active {
  transform: scale(0.97);
}
</style>
