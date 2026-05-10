<script setup lang="ts">
import type { TagResponse } from '~/api/v3/types.gen'
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
  <UModal
    v-model="modelValue"
    :title="isEditing ? t.dashboard.tags.tagForm.edit : t.dashboard.tags.tagForm.create"
    width="640px"
  >
    <form class="form-body" @submit.prevent="handleSave">
      <!-- NAME -->
      <div class="form-row">
        <label class="form-label">
          {{ t.dashboard.tags.tagForm.name }}
        </label>
        <div class="form-control">
          <UInput
            v-model="formData.name"
            :placeholder="t.dashboard.tags.tagForm.namePlaceholder"
            autocomplete="off"
            spellcheck="false"
          />
        </div>
      </div>

      <!-- COLOR -->
      <div class="form-row">
        <label class="form-label">
          {{ t.dashboard.tags.tagForm.color }}
        </label>
        <div class="form-control form-color-control">
          <div class="form-color-current">
            <label class="form-color-swatch" :style="{ background: formData.color }">
              <input
                v-model="formData.color"
                type="color"
                class="form-color-native"
              >
            </label>
            <span class="form-color-hash">#</span>
            <UInput v-model="colorHex" class="form-color-hex" :placeholder="t.dashboard.tags.tagForm.colorPlaceholder" />
          </div>
          <div class="form-color-presets">
            <button
              v-for="c in presetColors"
              :key="c"
              type="button"
              class="form-color-preset"
              :class="{ 'form-color-preset-active': formData.color.toLowerCase() === c.toLowerCase() }"
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
        <label class="form-label">
          {{ t.dashboard.tags.tagForm.emoji }}
          <span class="form-label-optional">{{ t.common.optional }}</span>
        </label>
        <div class="form-control">
          <div class="form-emoji-row">
            <UButton
              variant="secondary"
              size="md"
              class="emoji-picker-trigger form-emoji-trigger"
              type="button"
              @click="showEmojiPicker = !showEmojiPicker"
            >
              <span v-if="formData.emoji" class="form-emoji-glyph">{{ formData.emoji }}</span>
              <i v-else class="i-tabler-mood-smile" />
              <span>{{ formData.emoji || t.dashboard.tags.tagForm.emojiPlaceholder }}</span>
            </UButton>
            <UButton
              v-if="formData.emoji"
              variant="ghost"
              size="md"
              icon-left="i-tabler-x"
              :title="t.dashboard.tags.tagForm.cancel"
              type="button"
              @click="formData.emoji = null"
            />
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
    </form>

    <template #footer>
      <UButton variant="ghost" type="button" @click="handleClose">
        {{ t.dashboard.tags.tagForm.cancel }}
      </UButton>
      <UButton
        variant="primary"
        :loading="saving"
        :disabled="!formData.name.trim()"
        icon-left="i-tabler-check"
        @click="handleSave"
      >
        {{ isEditing ? t.dashboard.tags.tagForm.save : t.dashboard.tags.tagForm.create }}
      </UButton>
    </template>
  </UModal>
</template>

<style scoped>
.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: 16px;
  align-items: start;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ct-border-subtle);
}
.form-row:last-child { border-bottom: 0; padding-bottom: 0; }

.form-label {
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  padding-top: 8px;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}
.form-label-optional {
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  font-weight: var(--ct-weight-regular);
}

.form-control {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

@media (max-width: 599px) {
  .form-row { grid-template-columns: 1fr; gap: 8px; }
}

/* Color */
.form-color-current {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.form-color-swatch {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: var(--ct-radius-md);
  border: 1px solid var(--ct-border);
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
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-base);
  color: var(--ct-fg-subtle);
}
.form-color-hex { width: 9rem; }

.form-color-presets {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
}
@media (max-width: 599px) {
  .form-color-presets { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.form-color-preset {
  height: 28px;
  width: 100%;
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-md);
  cursor: pointer;
  transition: transform 160ms var(--ct-ease), box-shadow 160ms var(--ct-ease);
}
.form-color-preset:hover { transform: translateY(-1px); }
.form-color-preset-active {
  box-shadow: 0 0 0 2px var(--ct-bg), 0 0 0 4px var(--ct-primary);
}

/* Emoji */
.form-emoji-row { display: inline-flex; gap: 8px; align-items: center; }
.form-emoji-trigger { min-width: 12rem; justify-content: flex-start !important; }
.form-emoji-glyph { font-size: 16px; }
.form-emoji-picker {
  margin-top: 8px;
  position: relative;
  z-index: 50;
}
</style>
