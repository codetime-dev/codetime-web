<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { v3SearchWorkspaces } from '~/api/v3'

type ProjectOption = { label: string, id: string }

const modelValue = defineModel<ProjectOption | null>()
const t = useI18N()

const root = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const query = ref(modelValue.value?.label ?? '')
const debounced = refDebounced(query, 250)
const activeIdx = ref(0)

const { data } = await useAsyncData(async () => {
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

const options = computed<ProjectOption[]>(() => {
  return (data.value?.results ?? []).map(item => ({
    label: item.workspaceName,
    id: item.workspaceName,
  }))
})

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
        <span class="proj-option-label">{{ opt.label }}</span>
        <i v-if="modelValue?.id === opt.id" class="i-tabler-check text-sm text-primary" />
      </button>
    </div>
    <div v-else-if="open && debounced && options.length === 0" class="proj-popover proj-empty">
      {{ t.dashboard.projectSelector.noneText }}
    </div>
  </div>
</template>

<style scoped>
.proj-select {
  position: relative;
  width: 100%;
}

.line-input {
  display: block;
  width: 100%;
  height: 2.25rem;
  padding: 0 2rem 0 0.85rem;
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

.proj-clear,
.proj-caret {
  position: absolute;
  top: 50%;
  right: 0.6rem;
  transform: translateY(-50%);
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}

.proj-caret {
  pointer-events: none;
}

.proj-clear {
  background: transparent;
  border: 0;
  cursor: pointer;
  width: 1.4rem;
  height: 1.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 180ms ease, background-color 180ms ease;
}

.proj-clear:hover {
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.proj-popover {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 2px);
  z-index: 30;
  max-height: 14rem;
  overflow-y: auto;
  background-color: var(--r-surface-background-base-color);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--r-surface-border-color) 50%, transparent),
    0 12px 24px -8px rgb(0 0 0 / 0.35);
}

.proj-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.85rem;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: var(--r-surface-text-color);
  text-align: left;
  transition: background-color 140ms ease;
}

.proj-option-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.proj-option-active,
.proj-option:hover {
  background-color: color-mix(in srgb, var(--color-primary-1) 12%, transparent);
}

.proj-empty {
  padding: 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}
</style>
