<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { v3RecentLanguages } from '~/api/v3'

const modelValue = defineModel<string>({ default: '' })
const t = useI18N()

const root = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const query = ref(modelValue.value ?? '')
const activeIdx = ref(0)

const { data: recentData } = await useAsyncData('event-language-recent', async () => {
  const resp = await v3RecentLanguages({
    query: { limit: 15 },
  })
  return resp.data ?? []
}, {
  server: false,
  default: () => [] as string[],
})

const recentList = computed<string[]>(() => recentData.value ?? [])

const options = computed<string[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) {
    return recentList.value
  }
  return recentList.value.filter(l => l.toLowerCase().includes(q))
})

const isShowingRecent = computed(() => !query.value.trim())

watch(modelValue, (v) => {
  if (v !== query.value) {
    query.value = v ?? ''
  }
})

function selectOption(opt: string) {
  modelValue.value = opt
  query.value = opt
  open.value = false
}

function clearSelection() {
  modelValue.value = ''
  query.value = ''
  open.value = true
  inputEl.value?.focus()
}

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  query.value = v
  modelValue.value = v
  open.value = true
  activeIdx.value = 0
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value && (e.key === 'ArrowDown' || e.key === 'Enter')) {
    open.value = true
    return
  }
  switch (e.key) {
  case 'ArrowDown': {
    e.preventDefault()
    activeIdx.value = Math.min(activeIdx.value + 1, options.value.length - 1)

  break
  }
  case 'ArrowUp': {
    e.preventDefault()
    activeIdx.value = Math.max(activeIdx.value - 1, 0)

  break
  }
  case 'Enter': {
    e.preventDefault()
    const opt = options.value[activeIdx.value]
    if (opt) {
      selectOption(opt)
    }

  break
  }
  case 'Escape': {
    open.value = false

  break
  }
  // No default
  }
}

onClickOutside(root, () => {
  open.value = false
})
</script>

<template>
  <div ref="root" class="ev-lang-select">
    <input
      ref="inputEl"
      :value="query"
      type="text"
      class="line-input"
      :placeholder="t.dashboard.badge.placeholder.language"
      autocomplete="off"
      spellcheck="false"
      @input="onInput"
      @focus="open = true"
      @keydown="onKeydown"
    >
    <button
      v-if="query"
      type="button"
      class="ev-lang-clear"
      aria-label="clear"
      @click="clearSelection"
    >
      <i class="i-tabler-x" />
    </button>
    <i v-else class="i-tabler-chevron-down ev-lang-caret" />

    <div v-if="open && options.length > 0" class="ev-lang-popover">
      <button
        v-for="(opt, idx) in options"
        :key="opt"
        type="button"
        class="ev-lang-option"
        :class="idx === activeIdx ? 'ev-lang-option-active' : ''"
        @mouseenter="activeIdx = idx"
        @click="selectOption(opt)"
      >
        <i v-if="isShowingRecent" class="i-tabler-history ev-lang-option-icon" />
        <span class="ev-lang-option-label">{{ opt }}</span>
        <i v-if="modelValue === opt" class="i-tabler-check text-primary text-sm" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.ev-lang-select { position: relative; width: 100%; }

.line-input {
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 32px 0 12px;
  font-size: var(--ct-text-base);
  color: var(--ct-fg);
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  outline: 0;
  transition: border-color var(--ct-duration-fast) var(--ct-ease),
              box-shadow var(--ct-duration-fast) var(--ct-ease);
}
.line-input:hover { border-color: var(--ct-border-strong); }
.line-input:focus {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
.line-input::placeholder { color: var(--ct-fg-subtle); }

.ev-lang-clear,
.ev-lang-caret {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  color: var(--ct-fg-subtle);
}
.ev-lang-caret { pointer-events: none; }
.ev-lang-clear {
  background: transparent;
  border: 0;
  cursor: pointer;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ct-radius-md);
  transition: color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.ev-lang-clear:hover { color: var(--ct-fg); background: var(--ct-surface-2); }

.ev-lang-popover {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 30;
  max-height: 14rem;
  overflow-y: auto;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  box-shadow: var(--ct-shadow-lg);
  padding: 4px;
}
.ev-lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: 0;
  border-radius: var(--ct-radius-md);
  cursor: pointer;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg);
  text-align: left;
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
}
.ev-lang-option-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1 1 auto; min-width: 0; }
.ev-lang-option-icon { color: var(--ct-fg-subtle); font-size: 14px; flex-shrink: 0; }
.ev-lang-option:hover { background: var(--ct-surface-1); color: var(--ct-fg); }
.ev-lang-option-active {
  background: var(--ct-primary-soft);
  color: var(--ct-primary);
}
.ev-lang-option-active:hover {
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
  color: var(--ct-primary);
}
</style>
