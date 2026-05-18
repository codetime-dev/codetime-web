<script setup lang="ts" generic="T extends string">
// Compact pill-style single-select with keyboard navigation. Designed
// to read as a sibling of the DataRange picker, used by the agent
// dashboard for the "machine" and "agent source" filters.
//
// The selected value is a plain string (or `null` to mean "no filter").
// Callers build the option list themselves and pass it in via `items`;
// the first option is rendered as a sentinel "all" row when its `id`
// is null.

type Item = {
  id: T | null
  label: string
  icon?: string
}

const props = withDefaults(defineProps<{
  items: Item[]
  // Optional fallback text when there is exactly one synthetic option
  // (e.g. "no machines yet"). Mainly used to make the disabled state
  // legible via the trigger's title attribute.
  emptyTitle?: string
}>(), {
  emptyTitle: '',
})

const modelValue = defineModel<T | null>({ default: null })

const open = ref(false)
const trigger = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const activeIdx = ref(0)

const selected = computed(() => props.items.find(it => it.id === modelValue.value) ?? null)
const disabled = computed(() => props.items.filter(it => it.id !== null).length === 0)

// Render the trigger from the matching item; fall back to the leading
// "all" sentinel (id === null) when nothing is selected so the chip
// always has a label without callers having to special-case it.
const triggerItem = computed<Item | null>(() => {
  if (selected.value) {
    return selected.value
  }
  const all = props.items.find(it => it.id === null)
  return all ?? null
})

function toggle() {
  if (disabled.value) {
    return
  }
  open.value = !open.value
  if (open.value) {
    const idx = props.items.findIndex(it => it.id === modelValue.value)
    activeIdx.value = Math.max(idx, 0)
  }
}

function pick(id: T | null) {
  modelValue.value = id
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
    return
  }
  switch (e.key) {
    case 'ArrowDown': {
      e.preventDefault()
      activeIdx.value = Math.min(activeIdx.value + 1, props.items.length - 1)
      break
    }
    case 'ArrowUp': {
      e.preventDefault()
      activeIdx.value = Math.max(activeIdx.value - 1, 0)
      break
    }
    case 'Enter': {
      e.preventDefault()
      const it = props.items[activeIdx.value]
      if (it) {
        pick(it.id)
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

function onDocClick(e: MouseEvent) {
  if (!open.value) {
    return
  }
  const target = e.target as Node
  if (trigger.value?.contains(target) || popover.value?.contains(target)) {
    return
  }
  open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
})
</script>

<template>
  <div
    ref="trigger"
    class="ps-shell"
    :class="{ open, disabled, selected: !!selected }"
  >
    <button
      type="button"
      class="ps-trigger"
      :disabled="disabled"
      :aria-expanded="open"
      :aria-haspopup="true"
      :title="disabled ? emptyTitle : triggerItem?.label"
      @click="toggle"
      @keydown="onKeydown"
    >
      <i v-if="triggerItem?.icon" class="ps-icon" :class="triggerItem.icon" />
      <span class="ps-text">{{ triggerItem?.label ?? '—' }}</span>
      <i class="ps-caret i-tabler-chevron-down" />
    </button>

    <Transition name="ps-fade">
      <div v-if="open" ref="popover" class="ps-popover" role="listbox">
        <button
          v-for="(it, idx) in items"
          :key="it.id ?? '__all'"
          type="button"
          class="ps-option"
          :class="{
            'ps-option-active': idx === activeIdx,
            'ps-option-selected': it.id === modelValue,
          }"
          role="option"
          :aria-selected="it.id === modelValue"
          @mouseenter="activeIdx = idx"
          @click="pick(it.id)"
        >
          <i v-if="it.icon" class="ps-option-icon" :class="it.icon" />
          <span v-else class="ps-option-icon-spacer" aria-hidden="true" />
          <span class="ps-option-label">{{ it.label }}</span>
          <i v-if="it.id === modelValue" class="ps-option-check i-tabler-check" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ps-shell {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ps-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-md);
  color: var(--ct-fg);
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  cursor: pointer;
  transition: border-color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease),
              box-shadow var(--ct-duration-fast) var(--ct-ease);
}
.ps-trigger:hover:not(:disabled) { background: var(--ct-surface-2); }
.ps-shell.open .ps-trigger {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 14%, transparent);
}
.ps-shell.disabled .ps-trigger {
  opacity: 0.55;
  cursor: not-allowed;
}

.ps-icon {
  display: block;
  width: 14px;
  height: 14px;
  font-size: 14px;
  line-height: 1;
  color: var(--ct-fg-subtle);
  transition: color var(--ct-duration-fast) var(--ct-ease);
}
.ps-shell.selected .ps-icon { color: var(--ct-primary); }

.ps-text {
  min-width: 7ch;
  max-width: 22ch;
  text-align: left;
  /* Keep enough vertical room for descenders (g, p, y). With
     line-height: 1 the line box matches the font's cap-to-baseline
     range, and `overflow: hidden` then clips anything below the
     baseline. Use 1.4 to restore a normal line box. */
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ps-caret {
  display: block;
  width: 13px;
  height: 13px;
  font-size: 13px;
  line-height: 1;
  color: var(--ct-fg-subtle);
  transition: transform var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.ps-shell.open .ps-caret { transform: rotate(180deg); color: var(--ct-fg); }

.ps-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 40;
  min-width: 100%;
  max-width: 320px;
  max-height: 18rem;
  overflow-y: auto;
  padding: 4px;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  box-shadow: var(--ct-shadow-lg);
}

.ps-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: 0;
  border-radius: var(--ct-radius-md);
  color: var(--ct-fg);
  font-size: var(--ct-text-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.ps-option-icon,
.ps-option-icon-spacer {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  font-size: 14px;
}
.ps-option-icon { color: var(--ct-fg-subtle); }
.ps-option-label {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ps-option-check {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  font-size: 14px;
  color: var(--ct-primary);
}
.ps-option:hover { background: var(--ct-surface-1); }
.ps-option-active {
  background: var(--ct-primary-soft);
  color: var(--ct-fg);
}
.ps-option-active:hover {
  background: color-mix(in srgb, var(--ct-primary) 16%, transparent);
}
.ps-option-selected .ps-option-icon { color: var(--ct-primary); }

.ps-fade-enter-active,
.ps-fade-leave-active {
  transition: opacity 120ms var(--ct-ease), transform 120ms var(--ct-ease);
  transform-origin: top left;
}
.ps-fade-enter-from,
.ps-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
