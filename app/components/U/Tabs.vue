<script setup lang="ts" generic="T extends string">
// Unified Tabs primitive used across the app.
// variant 'underline' for navigation/section tabs (dashboard topbar, widgets sub-tabs).
// variant 'segmented' for selection groups (pricing variant picker).

type Item = {
  id: T
  label: string
  icon?: string
  to?: string
  meta?: string
  metaClass?: string
}

const props = withDefaults(
  defineProps<{
    items: Item[]
    variant?: 'underline' | 'segmented'
    activeId?: T
    ariaLabel?: string
  }>(),
  { variant: 'underline' },
)

const model = defineModel<T>()

function isActive(item: Item) {
  if (props.activeId !== undefined) {
    return props.activeId === item.id
  }
  return model.value === item.id
}

function onSelect(item: Item) {
  model.value = item.id
}
</script>

<template>
  <nav
    class="u-tabs"
    :class="`u-tabs-${variant}`"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <template v-for="item in items" :key="item.id">
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        class="u-tab"
        :class="{ 'u-tab-active': isActive(item) }"
        role="tab"
        :aria-selected="isActive(item)"
      >
        <i v-if="item.icon" :class="item.icon" class="u-tab-icon" />
        <span class="u-tab-label">{{ item.label }}</span>
        <span v-if="item.meta || $slots.meta" class="u-tab-meta" :class="item.metaClass">
          <slot name="meta" :item="item">{{ item.meta }}</slot>
        </span>
      </NuxtLink>
      <button
        v-else
        type="button"
        class="u-tab"
        :class="{ 'u-tab-active': isActive(item) }"
        role="tab"
        :aria-selected="isActive(item)"
        @click="onSelect(item)"
      >
        <i v-if="item.icon" :class="item.icon" class="u-tab-icon" />
        <span class="u-tab-label">{{ item.label }}</span>
        <span v-if="item.meta || $slots.meta" class="u-tab-meta" :class="item.metaClass">
          <slot name="meta" :item="item">{{ item.meta }}</slot>
        </span>
      </button>
    </template>
  </nav>
</template>

<style scoped>
.u-tabs {
  display: flex;
  flex-wrap: wrap;
}

.u-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  background: transparent;
  border: 0;
  color: var(--ct-fg-muted);
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  text-decoration: none;
  transition:
    color var(--ct-duration-fast, 160ms) var(--ct-ease, ease),
    background-color var(--ct-duration-fast, 160ms) var(--ct-ease, ease),
    border-color var(--ct-duration-fast, 160ms) var(--ct-ease, ease);
}
.u-tab-icon { font-size: 15px; }

/* underline variant — used by dashboard topbar and widgets sub-tabs */
.u-tabs-underline {
  gap: 4px;
  padding: 0 24px;
  border-bottom: 1px solid var(--ct-border-subtle);
}
.u-tabs-underline .u-tab {
  position: relative;
  padding: 10px 14px;
  border-bottom: 2px solid transparent;
}
.u-tabs-underline .u-tab:hover {
  color: var(--ct-fg);
  background: var(--ct-surface-1);
}
.u-tabs-underline .u-tab-active {
  color: var(--ct-primary);
  border-bottom-color: var(--ct-primary);
}

/* segmented variant — used by pricing variant picker */
.u-tabs-segmented {
  display: inline-flex;
  padding: 6px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: 999px;
  gap: 4px;
}
.u-tabs-segmented .u-tab {
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 28px;
  min-width: 140px;
  border-radius: 999px;
  transition:
    background-color 200ms ease,
    color 200ms ease,
    transform 200ms ease;
}
.u-tabs-segmented .u-tab .u-tab-label {
  font-weight: var(--ct-weight-semibold);
  font-size: 15px;
  letter-spacing: 0.01em;
}
.u-tabs-segmented .u-tab .u-tab-meta {
  font-size: 11px;
  color: var(--ct-fg-subtle);
  font-family: var(--ct-font-mono);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.u-tabs-segmented .u-tab:hover {
  color: var(--ct-fg);
  background: var(--ct-surface-2);
}
.u-tabs-segmented .u-tab-active {
  background: var(--ct-surface);
  color: var(--ct-fg);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}
.u-tabs-segmented .u-tab-active:hover {
  background: var(--ct-surface);
  color: var(--ct-fg);
}
.u-tabs-segmented .u-tab-active .u-tab-meta { color: var(--ct-primary); }

@media (max-width: 640px) {
  .u-tabs-segmented { width: 100%; }
  .u-tabs-segmented .u-tab {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
  }
  .u-tabs-segmented .u-tab .u-tab-label { font-size: 13px; }
}
</style>
