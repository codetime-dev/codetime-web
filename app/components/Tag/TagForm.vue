<script setup lang="ts">
import type { TagResponse } from '~/api/v3/types.gen'
import { Btn, ColorInput, Modal, Paper, TextField } from '@roku-ui/vue'
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

// 当 tag 改变时重置表单数据
watch(() => props.tag, (newTag) => {
  formData.name = newTag?.name || ''
  formData.color = newTag?.color || '#3B82F6'
  formData.emoji = newTag?.emoji || null
}, { immediate: true })

// 预设颜色调色板
const presetColors = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#EC4899', // pink
  '#6B7280', // gray
  '#14B8A6', // teal
  '#F43F5E', // rose
]

async function handleSave() {
  if (!formData.name.trim()) {
    return
  }

  try {
    saving.value = true
    // 确保 null 和空字符串都被处理为 null
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

// 点击外部关闭 emoji picker
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
</script>

<template>
  <Modal v-model="modelValue">
    <Paper class="p-6 w-800px" with-border>
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-semibold">
          {{ isEditing ? t.dashboard.tags.tagForm.edit : t.dashboard.tags.tagForm.create }}
        </h2>
        <Btn
          variant="subtle"
          color="surface"
          icon
          @click="handleClose"
        >
          <template #leftSection>
            <i class="i-tabler-x" />
          </template>
        </Btn>
      </div>

      <form class="space-y-4" @submit.prevent="handleSave">
        <!-- 标签名称 -->
        <div>
          <label class="text-sm font-medium mb-2 block">
            {{ t.dashboard.tags.tagForm.name }}
          </label>
          <TextField
            v-model="formData.name"
            :placeholder="t.dashboard.tags.tagForm.namePlaceholder"
            required
          />
        </div>

        <!-- 颜色选择 -->
        <div>
          <label class="text-sm font-medium mb-2 block">
            {{ t.dashboard.tags.tagForm.color }}
          </label>

          <!-- 当前颜色预览 -->
          <div class="bg-surface-variant mb-4 rounded-lg items-center">
            <ColorInput
              v-model="formData.color"
              :placeholder="t.dashboard.tags.tagForm.colorPlaceholder"
            />
          </div>

          <!-- 预设颜色选择 -->
          <div class="gap-3 grid grid-cols-6">
            <button
              v-for="color in presetColors"
              :key="color"
              type="button"
              class="border-2 rounded-lg h-10 w-10 shadow-sm transition-all"
              :class="{
                'border-primary shadow-md': formData.color === color,
                'border-transparent': formData.color !== color,
              }"
              :style="{
                backgroundColor: color,
                filter: formData.color === color ? 'brightness(1.1)' : 'none',
              }"
              @click="handleColorSelect(color)"
            />
          </div>
        </div>

        <!-- Emoji 输入 (可选) -->
        <div>
          <label class="text-sm font-medium mb-2 block">
            {{ t.dashboard.tags.tagForm.emoji }} <span class="text-xs text-surface-dimmed">({{ t.common.optional }})</span>
          </label>
          <div class="relative">
            <div class="flex gap-2">
              <Btn
                type="button"
                variant="subtle"
                class="emoji-picker-trigger justify-start"
                @click="showEmojiPicker = !showEmojiPicker"
              >
                {{ formData.emoji || t.dashboard.tags.tagForm.emojiPlaceholder }}
              </Btn>
              <Btn
                v-if="formData.emoji"
                type="button"
                variant="subtle"
                color="surface"
                icon
                @click="formData.emoji = null"
              >
                <template #leftSection>
                  <i class="i-tabler-x" />
                </template>
              </Btn>
            </div>
            <ClientOnly>
              <div v-if="showEmojiPicker" class="mt-2 absolute z-50">
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

        <!-- 按钮组 -->
        <div class="pt-4 flex gap-3">
          <Btn
            type="button"
            variant="default"
            class="flex-1"
            @click="handleClose"
          >
            {{ t.dashboard.tags.tagForm.cancel }}
          </Btn>
          <Btn
            type="submit"
            class="flex-1"
            variant="filled"
            :disabled="!formData.name.trim() || saving"
          >
            <template v-if="saving" #leftSection>
              <i class="i-tabler-loader animate-spin" />
            </template>
            {{ isEditing ? t.dashboard.tags.tagForm.save : t.dashboard.tags.tagForm.create }}
          </Btn>
        </div>
      </form>
    </Paper>
  </Modal>
</template>
