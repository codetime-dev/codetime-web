<script setup lang="ts">
import { v3RecentWorkspaces, v3SearchWorkspaces } from '~/api/v3'

type ProjectOption = { label: string, id: string }

const modelValue = defineModel<ProjectOption | null>()
const t = useI18N()

const root = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const query = ref(modelValue.value?.label ?? '')
const debounced = refDebounced(query, 250)
const activeIdx = ref(0)

const { data } = await useAsyncData('project-search', async () => {
  if (!debounced.value) {
    return null
  }
  const resp = await v3SearchWorkspaces({
    query: {
      limit: 10,
      q: debounced.value,
    },
  })
  return resp.data
}, {
  server: false,
  watch: [debounced],
})

const { data: recentData } = await useAsyncData('project-recent', async () => {
  const resp = await v3RecentWorkspaces({
    query: { limit: 15 },
  })
  return resp.data ?? null
}, {
  server: false,
})

const recentOptions = computed<ProjectOption[]>(() => {
  return (recentData.value?.results ?? []).map(r => ({
    label: r.workspaceName,
    id: r.workspaceName,
  }))
})

const options = computed<ProjectOption[]>(() => {
  if (!debounced.value) {
    return recentOptions.value
  }
  return (data.value?.results ?? []).map(item => ({
    label: item.workspaceName,
    id: item.workspaceName,
  }))
})

const isShowingRecent = computed(() => !debounced.value && recentOptions.value.length > 0)

watch(modelValue, (v) => {
  if (v) {
    query.value = v.label
  }
})

function selectOption(opt: ProjectOption) {
  modelValue.value = opt
  query.value = opt.label
  open.value = false
}

function clearSelection() {
  modelValue.value = null
  query.value = ''
  open.value = true
  inputEl.value?.focus()
}

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  query.value = v
  open.value = true
  activeIdx.value = 0
  if (modelValue.value && modelValue.value.label !== v) {
    modelValue.value = null
  }
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
  <div ref="root" class="proj-select">
    <input
      ref="inputEl"
      :value="query"
      type="text"
      class="line-input"
      :placeholder="t.dashboard.badge.placeholder.project"
      autocomplete="off"
      spellcheck="false"
      @input="onInput"
      @focus="open = true"
      @keydown="onKeydown"
    >
    <button
      v-if="query"
      type="button"
      class="proj-clear"
      aria-label="clear"
      @click="clearSelection"
    >
      <i class="i-tabler-x" />
    </button>
    <i v-else class="i-tabler-chevron-down proj-caret" />

    <div v-if="open && options.length > 0" class="proj-popover">
      <button
        v-for="(opt, idx) in options"
        :key="opt.id"
        type="button"
        class="proj-option"
        :class="idx === activeIdx ? 'proj-option-active' : ''"
        @mouseenter="activeIdx = idx"
        @click="selectOption(opt)"
      >
        <i v-if="isShowingRecent" class="i-tabler-history proj-option-icon" />
        <span class="proj-option-label">{{ opt.label }}</span>
        <i v-if="modelValue?.id === opt.id" class="i-tabler-check text-primary text-sm" />
      </button>
    </div>
    <div v-else-if="open && debounced && options.length === 0" class="proj-popover proj-empty">
      {{ t.dashboard.projectSelector.noneText }}
    </div>
  </div>
</template>

<style scoped>
.proj-select { position: relative; width: 100%; }

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

.proj-clear,
.proj-caret {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  color: var(--ct-fg-subtle);
}
.proj-caret { pointer-events: none; }
.proj-clear {
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
.proj-clear:hover { color: var(--ct-fg); background: var(--ct-surface-2); }

.proj-popover {
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
.proj-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.proj-option-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1 1 auto; min-width: 0; }
.proj-option-icon { color: var(--ct-fg-subtle); font-size: 14px; flex-shrink: 0; }
.proj-option:hover { background: var(--ct-surface-1); color: var(--ct-fg); }
.proj-option-active {
  background: var(--ct-primary-soft);
  color: var(--ct-primary);
}
.proj-option-active:hover {
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
  color: var(--ct-primary);
}

.proj-empty {
  padding: 14px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-subtle);
}
</style>
