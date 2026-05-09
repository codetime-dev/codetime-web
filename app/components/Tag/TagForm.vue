<script setup lang="ts">
import type { TagResponse } from '~/api/v3/types.gen'
import { Modal, Paper } from '@roku-ui/vue'
import { defineAsyncComponent } from 'vue'

type Props = {
  tag?: TagResponse | null
}

type Emits = {
  (e: 'save', data: { name: string, color: string, emoji?: string | null }): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const modelValue = defineModel<boolean>('modelValue', { required: true })

const t = useI18N()

const EmojiPicker = defineAsyncComponent(async () => {
  if (import.meta.server) {
    return { render: () => null }
  }
  const [{ default: Picker }] = await Promise.all([
    import('vue3-emoji-picker'),
    import('vue3-emoji-picker/css'),
  ])
  return Picker
})

const formData = reactive({
  name: props.tag?.name || '',
  color: props.tag?.color || '#3B82F6',
  emoji: props.tag?.emoji || null,
})

const showEmojiPicker = ref(false)
const isEditing = computed(() => !!props.tag)
const saving = ref(false)

watch(() => props.tag, (newTag) => {
  formData.name = newTag?.name || ''
  formData.color = newTag?.color || '#3B82F6'
  formData.emoji = newTag?.emoji || null
}, { immediate: true })

const presetColors = [
  '#3B82F6',
'#6366F1',
'#8B5CF6',
'#A855F7',
'#EC4899',
'#F43F5E',
  '#EF4444',
'#F97316',
'#F59E0B',
'#84CC16',
'#10B981',
'#14B8A6',
  '#06B6D4',
'#0284C7',
'#6B7280',
'#222222',
]

async function handleSave() {
  if (!formData.name.trim()) {
    return
  }
  try {
    saving.value = true
    const emojiValue = (formData.emoji === '' || formData.emoji === null) ? null : formData.emoji
    emit('save', {
      name: formData.name.trim(),
      color: formData.color,
      emoji: emojiValue,
    })
    modelValue.value = false
  }
  finally {
    saving.value = false
  }
}

function handleColorSelect(color: string) {
  formData.color = color
}

function handleClose() {
  modelValue.value = false
  showEmojiPicker.value = false
  emit('close')
}

function handleEmojiSelect(emoji: any) {
  formData.emoji = emoji.i
  showEmojiPicker.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.v3-emoji-picker') && !target.closest('.emoji-picker-trigger')) {
    showEmojiPicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

const colorHex = computed({
  get: () => formData.color.replace(/^#/, ''),
  set: (v: string) => {
    formData.color = `#${v.replace(/^#/, '')}`
  },
})
</script>

<template>
  <Modal v-model="modelValue">
    <Paper class="w-2xl" with-border>
      <div class="form-shell">
        <!-- Head -->
        <div class="form-head">
          <div class="form-eyebrow">
            <span class="form-eyebrow-bracket">[</span>
            <span class="form-eyebrow-num">{{ isEditing ? '·' : '+' }}</span>
            <span class="form-eyebrow-sep">/</span>
            <span>{{ isEditing ? 'edit · tag' : 'new · tag' }}</span>
            <span class="form-eyebrow-bracket">]</span>
          </div>
          <button
            type="button"
            class="form-close"
            :title="t.dashboard.tags.tagForm.cancel"
            @click="handleClose"
          >
            <i class="i-tabler-x text-base" />
          </button>
        </div>

        <h2 class="form-title">
          {{ isEditing ? t.dashboard.tags.tagForm.edit : t.dashboard.tags.tagForm.create }}
        </h2>

        <form class="form-body" @submit.prevent="handleSave">
          <!-- NAME -->
          <div class="form-row">
            <div class="form-row-label">
              <span class="form-label-num">a</span>
              <span>{{ t.dashboard.tags.tagForm.name }}</span>
            </div>
            <div class="form-row-control">
              <input
                v-model="formData.name"
                type="text"
                class="line-input"
                :placeholder="t.dashboard.tags.tagForm.namePlaceholder"
                autocomplete="off"
                spellcheck="false"
                required
              >
            </div>
          </div>

          <!-- COLOR -->
          <div class="form-row">
            <div class="form-row-label">
              <span class="form-label-num">b</span>
              <span>{{ t.dashboard.tags.tagForm.color }}</span>
            </div>
            <div class="form-row-control form-color-control">
              <div class="form-color-current">
                <label class="form-color-swatch" :style="{ background: formData.color }">
                  <input
                    v-model="formData.color"
                    type="color"
                    class="form-color-native"
                  >
                </label>
                <span class="form-color-hash">#</span>
                <input
                  v-model="colorHex"
                  class="line-input form-color-hex"
                  type="text"
                  :placeholder="t.dashboard.tags.tagForm.colorPlaceholder"
                  spellcheck="false"
                >
              </div>
              <div class="form-color-presets">
                <button
                  v-for="c in presetColors"
                  :key="c"
                  type="button"
                  class="form-color-preset"
                  :class="formData.color.toLowerCase() === c.toLowerCase() ? 'form-color-preset-active' : ''"
                  :style="{ background: c }"
                  :aria-label="c"
                  :title="c"
                  @click="handleColorSelect(c)"
                />
              </div>
            </div>
          </div>

          <!-- EMOJI -->
          <div class="form-row">
            <div class="form-row-label">
              <span class="form-label-num">c</span>
              <span>{{ t.dashboard.tags.tagForm.emoji }}</span>
              <span class="form-label-optional">{{ t.common.optional }}</span>
            </div>
            <div class="form-row-control">
              <div class="form-emoji-row">
                <button
                  type="button"
                  class="line-btn emoji-picker-trigger form-emoji-trigger"
                  @click="showEmojiPicker = !showEmojiPicker"
                >
                  <span v-if="formData.emoji" class="form-emoji-glyph">{{ formData.emoji }}</span>
                  <i v-else class="i-tabler-mood-smile text-sm" />
                  <span>{{ formData.emoji || t.dashboard.tags.tagForm.emojiPlaceholder }}</span>
                </button>
                <button
                  v-if="formData.emoji"
                  type="button"
                  class="line-btn line-btn-ghost form-emoji-clear"
                  :title="t.dashboard.tags.tagForm.cancel"
                  @click="formData.emoji = null"
                >
                  <i class="i-tabler-x text-sm" />
                </button>
              </div>
              <ClientOnly>
                <div v-if="showEmojiPicker" class="form-emoji-picker">
                  <EmojiPicker
                    theme="auto"
                    :native="true"
                    :display-recent="true"
                    :disable-skin-tones="false"
                    @select="handleEmojiSelect"
                  />
                </div>
              </ClientOnly>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="form-actions">
            <button
              type="button"
              class="line-btn"
              @click="handleClose"
            >
              {{ t.dashboard.tags.tagForm.cancel }}
            </button>
            <button
              type="submit"
              class="line-btn line-btn-primary"
              :disabled="!formData.name.trim() || saving"
            >
              <i v-if="saving" class="i-tabler-loader text-sm animate-spin" />
              <i v-else class="i-tabler-check text-sm" />
              <span>{{ isEditing ? t.dashboard.tags.tagForm.save : t.dashboard.tags.tagForm.create }}</span>
            </button>
          </div>
        </form>
      </div>
    </Paper>
  </Modal>
</template>

<style scoped>
.form-shell {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--color-primary-1);
}

.form-eyebrow-bracket,
.form-eyebrow-sep {
  opacity: 0.55;
}

.form-eyebrow-num {
  color: var(--r-surface-text-color);
  font-weight: 500;
}

.form-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
  transition: color 180ms ease, background-color 180ms ease;
}

.form-close:hover {
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--r-surface-text-color);
}

.form-body {
  display: flex;
  flex-direction: column;
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

/* Rows */
.form-row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  align-items: stretch;
  border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

.form-row-label {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 1rem 1rem 1rem 0.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--r-surface-text-color);
  opacity: 0.85;
  border-right: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

.form-label-num {
  color: var(--color-primary-1);
  font-weight: 500;
}

.form-label-optional {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: color-mix(in srgb, var(--r-surface-text-color) 40%, transparent);
}

.form-row-control {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  min-width: 0;
}

@media (max-width: 599px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  .form-row-label {
    border-right: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
    padding: 0.75rem 1rem;
  }
}

/* Color */
.form-color-control {
  gap: 0.85rem;
}

.form-color-current {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
}

.form-color-swatch {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--r-surface-border-color) 70%, transparent);
}

.form-color-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: 0;
  padding: 0;
}

.form-color-hash {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}

.form-color-hex {
  width: 9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.form-color-presets {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 0.4rem;
}

@media (max-width: 599px) {
  .form-color-presets {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.form-color-preset {
  height: 1.85rem;
  width: 100%;
  border: 0;
  cursor: pointer;
  position: relative;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--r-surface-border-color) 50%, transparent);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.form-color-preset:hover {
  transform: translateY(-1px);
}

.form-color-preset-active {
  box-shadow:
    inset 0 0 0 1px var(--r-surface-background-base-color),
    0 0 0 1px var(--color-primary-1);
}

/* Emoji */
.form-emoji-row {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.form-emoji-trigger {
  min-width: 12rem;
  justify-content: flex-start !important;
}

.form-emoji-glyph {
  font-size: 16px;
}

.form-emoji-clear {
  width: 2.25rem !important;
  padding: 0 !important;
  justify-content: center !important;
}

.form-emoji-picker {
  margin-top: 0.5rem;
  position: relative;
  z-index: 50;
}

/* Actions */
.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

/* Inputs */
.line-input {
  display: block;
  width: 100%;
  height: 2.25rem;
  padding: 0 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border: 0;
  outline: 0;
  transition: background-color 180ms ease, box-shadow 180ms ease;
}

.line-input:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.26);
}

.line-input:focus {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
  box-shadow: inset 0 -1px 0 var(--color-primary-1);
}

.line-input::placeholder {
  color: color-mix(in srgb, var(--r-surface-text-color) 35%, transparent);
}

/* Buttons */
.line-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.95rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border: 0;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease, opacity 180ms ease;
  white-space: nowrap;
}

.line-btn:hover:not(:disabled) {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.line-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.line-btn-primary {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

.line-btn-primary:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-primary-1) 24%, transparent);
}

.line-btn-ghost {
  background-color: transparent;
  color: color-mix(in srgb, var(--r-surface-text-color) 60%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--r-surface-border-color) 30%, transparent);
}

.line-btn-ghost:hover:not(:disabled) {
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.22);
}
</style>
