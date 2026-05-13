<script setup lang="ts" generic="O extends { label: string, id: string }">
// Generic single-select with text-filter input, popover list, keyboard
// navigation, and a clearable selection. Callers supply a `loader(query)`
// that returns options for the current (debounced) query — synchronous
// for in-memory lists, async for remote search.
//
// Use the `option` scoped slot to render each row. Slot props expose the
// option, its active/selected state, and the current debounced query so
// callers can switch UI between "recent" and "search" affordances.

const props = defineProps<{
  placeholder?: string
  loader: (query: string) => O[] | Promise<O[]>
  debounceMs?: number
  emptyText?: string
}>()

const modelValue = defineModel<O | null>()

const root = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const query = ref(modelValue.value?.label ?? '')
const debounced = refDebounced(query, props.debounceMs ?? 250)
const activeIdx = ref(0)
const options = shallowRef<O[]>([])

async function refresh() {
  const r = await props.loader(debounced.value)
  options.value = r ?? []
}
watch(debounced, refresh, { immediate: true })

watch(modelValue, (v) => {
  if (v) {
    query.value = v.label
  }
})

function selectOption(opt: O) {
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
  <div ref="root" class="entity-select">
    <input
      ref="inputEl"
      :value="query"
      type="text"
      class="line-input"
      :placeholder="placeholder"
      autocomplete="off"
      spellcheck="false"
      @input="onInput"
      @focus="open = true"
      @keydown="onKeydown"
    >
    <button
      v-if="query"
      type="button"
      class="entity-clear"
      aria-label="clear"
      @click="clearSelection"
    >
      <i class="i-tabler-x" />
    </button>
    <i v-else class="i-tabler-chevron-down entity-caret" />

    <div v-if="open && options.length > 0" class="entity-popover">
      <button
        v-for="(opt, idx) in options"
        :key="opt.id"
        type="button"
        class="entity-option"
        :class="idx === activeIdx ? 'entity-option-active' : ''"
        @mouseenter="activeIdx = idx"
        @click="selectOption(opt)"
      >
        <slot
          name="option"
          :option="opt"
          :active="idx === activeIdx"
          :selected="modelValue?.id === opt.id"
          :query="debounced"
        >
          <span class="entity-option-label">{{ opt.label }}</span>
          <i v-if="modelValue?.id === opt.id" class="i-tabler-check text-primary text-sm" />
        </slot>
      </button>
    </div>
    <div v-else-if="open && debounced && options.length === 0" class="entity-popover entity-empty">
      {{ emptyText ?? '—' }}
    </div>
  </div>
</template>

<style scoped>
.entity-select { position: relative; width: 100%; }

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

.entity-clear,
.entity-caret {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  color: var(--ct-fg-subtle);
}
.entity-caret { pointer-events: none; }
.entity-clear {
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
.entity-clear:hover { color: var(--ct-fg); background: var(--ct-surface-2); }

.entity-popover {
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
.entity-option {
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
.entity-option-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1 1 auto; min-width: 0; }
.entity-option:hover { background: var(--ct-surface-1); color: var(--ct-fg); }
.entity-option-active {
  background: var(--ct-primary-soft);
  color: var(--ct-primary);
}
.entity-option-active:hover {
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
  color: var(--ct-primary);
}
.entity-empty {
  padding: 14px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-subtle);
}
</style>
