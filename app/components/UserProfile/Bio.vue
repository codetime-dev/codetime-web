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
      <div v-if="bio" class="border-primary/40 bg-surface-variant-1/15 py-3.5 pl-4 pr-2 border-l-2">
        <p class="text-[13px] text-surface leading-[1.65] font-mono whitespace-pre-wrap break-words">
          {{ bio }}
        </p>
      </div>
      <div
        v-else
        class="text-surface-dimmed/60 border-surface-dimmed/20 text-[12.5px] tracking-[0.04em] font-mono py-4 border border-dashed flex gap-2 items-center justify-center"
      >
        <i class="i-tabler-quote-off text-base opacity-60" />
        <span>// {{ t.dashboard.profile.bio.empty }}</span>
      </div>
      <div v-if="canEdit" class="flex justify-end">
        <button
          type="button"
          class="border-surface-dimmed/30 hover:border-primary/60 text-[12px] text-surface-dimmed tracking-[0.12em] font-mono px-3 py-1.5 border inline-flex gap-1.5 uppercase transition-colors items-center hover:text-primary"
          @click="emit('startEdit')"
        >
          <i class="i-tabler-edit text-sm" />
          <span>{{ bio ? t.dashboard.profile.bio.edit : '+ BIO' }}</span>
        </button>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else class="space-y-3">
      <div class="border-surface-dimmed/30 focus-within:border-primary/60 border transition-colors relative">
        <textarea
          v-model="bioDraftModel"
          :maxlength="maxLength"
          rows="4"
          class="placeholder:text-surface-dimmed/40 text-[13px] text-surface leading-[1.65] font-mono p-3.5 pb-8 outline-none bg-transparent w-full block resize-none"
          :placeholder="t.dashboard.profile.bio.placeholder"
        />
        <div class="text-[11px] tracking-widest font-mono flex gap-1 bottom-2 right-3 absolute tabular-nums">
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
        <span v-if="overLimit" class="text-[11px] text-rose-500 tracking-[0.08em] font-mono mr-auto inline-flex gap-1 uppercase items-center">
          <i class="i-tabler-alert-triangle text-sm" />
          {{ t.dashboard.profile.bio.limitExceeded }}
        </span>
        <button
          type="button"
          class="border-surface-dimmed/30 hover:border-surface-dimmed/60 text-[12px] text-surface-dimmed tracking-[0.12em] font-mono px-3 py-1.5 border uppercase transition-colors"
          @click="emit('cancelEdit')"
        >
          {{ t.general.cancel }}
        </button>
        <button
          type="button"
          class="border-primary/60 bg-primary/10 hover:bg-primary/20 text-[12px] text-primary tracking-[0.12em] font-mono px-3 py-1.5 border inline-flex gap-1.5 uppercase transition-colors items-center disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="bioSaving || overLimit"
          @click="emit('save')"
        >
          <i v-if="bioSaving" class="i-tabler-loader text-sm animate-spin" />
          <i v-else class="i-tabler-device-floppy text-sm" />
          <span>{{ bioSaving ? t.dashboard.profile.bio.saving : t.dashboard.profile.bio.save }}</span>
        </button>
      </div>
    </div>

    <Transition name="up-fade">
      <div
        v-if="bioStatusMessage"
        class="text-[12px] tracking-[0.04em] font-mono px-3 py-2 border inline-flex gap-2 items-center"
        :class="bioStatus === 'error'
          ? 'border-rose-500/30 text-rose-500 bg-rose-500/5'
          : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'"
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
