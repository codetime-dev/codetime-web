<script setup lang="ts">
import { computed } from 'vue'
import SurfaceButton from './SurfaceButton.vue'

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

const t = useI18N()

const bioDraftModel = computed({
  get: () => props.bioDraft,
  set: value => emit('update:bio-draft', value),
})

const overLimit = computed(() => props.bioRemaining < 0)
const nearLimit = computed(() => props.bioRemaining >= 0 && props.bioRemaining < 20)
</script>

<template>
  <div class="space-y-4">
    <!-- View mode -->
    <div v-if="!isEditing" class="space-y-3">
      <div v-if="bio" class="bg-surface-variant-1/25 px-4 py-3.5">
        <p class="text-[14px] text-surface leading-[1.65] font-mono whitespace-pre-wrap break-words">
          {{ bio }}
        </p>
      </div>
      <div
        v-else
        class="bg-surface-variant-1/15 text-surface-dimmed/60 text-[12.5px] tracking-[0.04em] font-mono py-4 flex gap-2 items-center justify-center"
      >
        <i class="i-tabler-quote-off text-base opacity-60" />
        <span>{{ t.dashboard.profile.bio.empty }}</span>
      </div>
      <div v-if="canEdit" class="flex justify-end">
        <SurfaceButton @click="emit('startEdit')">
          <i class="i-tabler-edit text-sm" />
          <span>{{ bio ? t.dashboard.profile.bio.edit : '+ BIO' }}</span>
        </SurfaceButton>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else class="space-y-3">
      <div class="bg-surface-variant-1/25 focus-within:bg-surface-variant-1/40 transition-colors relative">
        <textarea
          v-model="bioDraftModel"
          :maxlength="maxLength"
          rows="4"
          class="placeholder:text-surface-dimmed/40 text-[14px] text-surface leading-[1.65] font-mono p-3.5 pb-8 outline-none bg-transparent w-full block resize-none"
          :placeholder="t.dashboard.profile.bio.placeholder"
        />
        <div class="text-[12px] tracking-widest font-mono flex gap-1 bottom-2 right-3 absolute tabular-nums">
          <span
            :class="{
              'text-rose-500': overLimit,
              'text-amber-500': nearLimit,
              'text-surface-dimmed/60': !overLimit && !nearLimit,
            }"
          >
            {{ bioRemaining }}
          </span>
          <span class="text-surface-dimmed/30">/ {{ maxLength }}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 items-center justify-end">
        <span v-if="overLimit" class="text-[12px] text-rose-500 tracking-[0.08em] font-mono mr-auto inline-flex gap-1 uppercase items-center">
          <i class="i-tabler-alert-triangle text-sm" />
          {{ t.dashboard.profile.bio.limitExceeded }}
        </span>
        <SurfaceButton variant="ghost" @click="emit('cancelEdit')">
          {{ t.general.cancel }}
        </SurfaceButton>
        <SurfaceButton
          variant="primary"
          :disabled="bioSaving || overLimit"
          @click="emit('save')"
        >
          <i v-if="bioSaving" class="i-tabler-loader text-sm animate-spin" />
          <i v-else class="i-tabler-device-floppy text-sm" />
          <span>{{ bioSaving ? t.dashboard.profile.bio.saving : t.dashboard.profile.bio.save }}</span>
        </SurfaceButton>
      </div>
    </div>

    <Transition name="up-fade">
      <div
        v-if="bioStatusMessage"
        class="text-[12px] tracking-[0.04em] font-mono px-3 py-2 inline-flex gap-2 items-center"
        :class="bioStatus === 'error'
          ? 'text-rose-500 bg-rose-500/10'
          : 'text-emerald-600 bg-emerald-500/10'"
      >
        <i
          :class="{
            'i-tabler-check': bioStatus === 'success',
            'i-tabler-alert-circle': bioStatus === 'error',
          }"
          class="text-sm shrink-0"
        />
        <span>{{ bioStatusMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.up-fade-enter-active,
.up-fade-leave-active {
  transition: all 180ms ease;
}
.up-fade-enter-from,
.up-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
