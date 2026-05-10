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
        <div class="bio-icon">
          <i class="i-tabler-quote" />
        </div>
        <div>
          <h2 class="bio-title">
            {{ t.dashboard.profile.bio.title }}
          </h2>
          <p class="bio-subtitle">
            {{ t.dashboard.profile.bio.subtitle }}
          </p>
        </div>
      </div>
      <UButton
        v-if="canEdit && !isEditing"
        variant="secondary"
        icon-left="i-tabler-edit"
        type="button"
        @click="emit('startEdit')"
      >
        {{ t.dashboard.profile.bio.edit }}
      </UButton>
    </div>

    <!-- Edit mode -->
    <div v-if="isEditing" class="space-y-4">
      <div class="bio-textarea-wrap">
        <textarea
          v-model="bioDraftModel"
          :maxlength="maxLength"
          rows="4"
          class="bio-textarea"
          :placeholder="t.dashboard.profile.bio.placeholder"
        />
        <div class="bio-counter">
          <span
            class="font-mono tabular-nums"
            :class="{
              'text-rose-500': bioRemaining < 0,
              'text-amber-500': bioRemaining >= 0 && bioRemaining < 20,
            }"
          >
            {{ bioRemaining }}
          </span>
          <span class="bio-counter-sep">/ {{ maxLength }}</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="bio-progress">
        <div
          class="bio-progress-fill"
          :class="[progressColor]"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <div class="flex flex-wrap gap-3 items-center justify-between">
        <span
          v-if="bioRemaining < 0"
          class="bio-warn"
        >
          <i class="i-tabler-alert-triangle" />
          {{ t.dashboard.profile.bio.limitExceeded }}
        </span>
        <span v-else />

        <div class="flex gap-2">
          <UButton variant="ghost" type="button" @click="emit('cancelEdit')">
            {{ t.general.cancel }}
          </UButton>
          <UButton
            variant="primary"
            type="button"
            :loading="bioSaving"
            :disabled="bioSaving || bioRemaining < 0"
            icon-left="i-tabler-device-floppy"
            @click="emit('save')"
          >
            {{ bioSaving ? t.dashboard.profile.bio.saving : t.dashboard.profile.bio.save }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- View mode -->
    <div v-else>
      <div v-if="bio" class="bio-view">
        <p class="whitespace-pre-wrap break-words">
          {{ bio }}
        </p>
      </div>
      <div v-else class="bio-empty">
        <i class="i-tabler-message-circle bio-empty-icon" />
        <p class="bio-empty-text">
          {{ t.dashboard.profile.bio.empty }}
        </p>
        <button
          v-if="canEdit"
          class="bio-empty-cta"
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
        class="bio-status"
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
.bio-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--ct-primary-soft);
  color: var(--ct-primary);
  font-size: 22px;
  border-radius: var(--ct-radius-md);
}
.bio-title { font-size: var(--ct-text-xl); font-weight: var(--ct-weight-semibold); color: var(--ct-fg); }
.bio-subtitle { font-size: var(--ct-text-sm); color: var(--ct-fg-muted); margin-top: 2px; }

.bio-textarea-wrap { position: relative; }
.bio-textarea {
  width: 100%;
  resize: none;
  padding: 14px 14px 36px;
  font-size: var(--ct-text-base);
  color: var(--ct-fg);
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  outline: 0;
  font-family: var(--ct-font-sans);
  transition: border-color var(--ct-duration-fast) var(--ct-ease),
              box-shadow var(--ct-duration-fast) var(--ct-ease);
}
.bio-textarea:focus {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
.bio-textarea::placeholder { color: var(--ct-fg-subtle); }
.bio-counter {
  position: absolute;
  bottom: 10px;
  right: 14px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-muted);
  display: inline-flex;
  gap: 4px;
}
.bio-counter-sep { color: var(--ct-fg-disabled); }

.bio-progress { width: 100%; height: 4px; background: var(--ct-surface-2); overflow: hidden; }
.bio-progress-fill { height: 100%; transition: width 300ms var(--ct-ease); }
.bio-warn {
  font-size: var(--ct-text-xs);
  color: var(--ct-danger);
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.bio-view {
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-left: 3px solid var(--ct-primary);
  padding: 18px 20px;
  font-size: var(--ct-text-base);
  line-height: 1.6;
  color: var(--ct-fg);
}
.bio-empty {
  border: 1px dashed var(--ct-border);
  padding: 40px 16px;
  text-align: center;
}
.bio-empty-icon { font-size: 28px; color: var(--ct-fg-subtle); }
.bio-empty-text { font-size: var(--ct-text-sm); color: var(--ct-fg-subtle); margin: 6px 0 12px; }
.bio-empty-cta {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: var(--ct-text-sm);
  color: var(--ct-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.bio-empty-cta:hover { text-decoration: underline; }

.bio-status {
  font-size: var(--ct-text-sm);
  padding: 10px 14px;
  border: 1px solid var(--ct-border);
  display: flex;
  gap: 8px;
  align-items: center;
}

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from { opacity: 0; transform: translateY(-8px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
