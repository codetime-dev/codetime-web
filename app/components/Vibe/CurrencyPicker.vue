<script setup lang="ts">
// Currency picker for the Vibe dashboard rangebar. Ported from
// agent-time/apps/web/src/components/CurrencyPicker.vue but restyled to
// match codetime's --ct-* design tokens and the rangebar's button
// language (matches DashboardPillSelect's pill radius / size).

import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useExchangeRate } from '~/composables/useExchangeRate'

const {
  currencyCode,
  currencyMeta,
  currencyData,
  isCustom,
  effectiveRate,
  fetching,
  setCurrency,
  setCustomRate,
  customRateValue,
  customLabel,
} = useExchangeRate()

const open = ref(false)
const search = ref('')
const customActive = ref(false)
const customInputRate = ref(isCustom.value ? customRateValue.value : 1)
const customInputLabel = ref(isCustom.value ? customLabel.value : 'CUSTOM')
const customError = ref<string | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

const filtered = computed(() => {
  if (!search.value) {
    return currencyData.value
  }
  const q = search.value.toUpperCase()
  return currencyData.value.filter(
    c => c.code.toUpperCase().includes(q) || c.name.toUpperCase().includes(q),
  )
})

const displayCode = computed(() => {
  if (isCustom.value) {
    return customLabel.value
  }
  return currencyCode.value
})

const displaySymbol = computed(() => currencyMeta.value.symbol)

function toggle(): void {
  open.value = !open.value
  if (open.value) {
    search.value = ''
    customActive.value = false
    customInputRate.value = isCustom.value ? customRateValue.value : 1
    customInputLabel.value = isCustom.value ? customLabel.value : 'CUSTOM'
    nextTick(() => searchRef.value?.focus())
  }
}

function select(code: string): void {
  setCurrency(code)
  open.value = false
}

function applyCustom(): void {
  const rate = Number(customInputRate.value)
  const label = customInputLabel.value.trim() || 'CUSTOM'
  if (!Number.isNaN(rate) && rate > 0) {
    customError.value = null
    setCustomRate(rate, label)
    open.value = false
  }
  else {
    customError.value = 'Enter a valid rate > 0'
  }
}

function handleClickOutside(e: MouseEvent): void {
  const target = e.target as HTMLElement
  if (!target.closest('.currency-picker')) {
    open.value = false
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && open.value) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

function fmtRate(rate: number): string {
  if (rate >= 100) {
    return rate.toFixed(0)
  }
  if (rate >= 1) {
    return rate.toFixed(4)
  }
  return rate.toFixed(6)
}
</script>

<template>
  <div class="currency-picker">
    <button
      type="button"
      class="trigger"
      :class="{ open }"
      :title="`Display currency · 1 USD = ${fmtRate(effectiveRate)} ${displayCode}`"
      @click="toggle"
    >
      <span v-if="fetching" class="i-tabler-loader-2 trigger-loading" />
      <span v-else class="trigger-symbol">{{ displaySymbol }}</span>
      <span class="trigger-code">{{ displayCode }}</span>
      <i class="i-tabler-chevron-down trigger-arrow" />
    </button>

    <div v-if="open" class="dropdown">
      <div class="search-wrap">
        <input
          ref="searchRef"
          v-model="search"
          type="text"
          class="search"
          placeholder="search currency…"
        >
      </div>

      <div class="preset-row">
        <button
          type="button"
          class="preset-btn"
          :class="{ active: !isCustom && currencyCode === 'USD' }"
          @click="select('USD')"
        >
          $ USD
        </button>
      </div>

      <div class="list">
        <button
          v-for="entry in filtered"
          :key="entry.code"
          type="button"
          class="item"
          :class="{ active: !isCustom && currencyCode === entry.code }"
          @click="select(entry.code)"
        >
          <span class="item-symbol">{{ entry.symbol }}</span>
          <span class="item-code">{{ entry.code }}</span>
          <span class="item-name">{{ entry.name }}</span>
          <span class="item-rate">{{ fmtRate(entry.rate) }}</span>
        </button>
        <div v-if="filtered.length === 0" class="no-match">
          no matches
        </div>
      </div>

      <div class="custom-section">
        <button
          type="button"
          class="custom-toggle"
          :class="{ active: isCustom || customActive }"
          @click="customActive = !customActive"
        >
          {{ customActive || isCustom ? '▾ custom rate' : '▸ custom rate' }}
        </button>
        <div v-if="customActive || isCustom" class="custom-form">
          <div class="custom-row">
            <label class="custom-lbl">1 USD =</label>
            <input
              v-model="customInputRate"
              type="number"
              step="any"
              min="0.000001"
              class="custom-input"
              placeholder="rate"
            >
          </div>
          <div class="custom-row">
            <label class="custom-lbl">label</label>
            <input
              v-model="customInputLabel"
              type="text"
              class="custom-input"
              placeholder="e.g. CNY"
              maxlength="10"
            >
          </div>
          <div v-if="customError" class="custom-error">
            {{ customError }}
          </div>
          <button type="button" class="custom-apply" @click="applyCustom">
            apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.currency-picker {
  position: relative;
  display: inline-block;
}

/* Trigger mirrors DashboardPillSelect's .ps-trigger so the rangebar
   reads as one cohesive row. Only the inner symbol/code spans keep
   currency-specific accents. */
.trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  font-family: inherit;
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-md);
  color: var(--ct-fg);
  cursor: pointer;
  transition: border-color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease),
              box-shadow var(--ct-duration-fast) var(--ct-ease);
}
.trigger:hover { background: var(--ct-surface-2); }
.trigger.open {
  border-color: var(--ct-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 14%, transparent);
}

.trigger-symbol {
  color: var(--ct-primary);
  min-width: 12px;
  text-align: center;
}
.trigger-loading {
  width: 14px;
  height: 14px;
  animation: ct-currency-spin 800ms linear infinite;
}
@keyframes ct-currency-spin {
  to { transform: rotate(360deg); }
}
.trigger-code {
  color: var(--ct-fg);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}
.trigger-arrow {
  display: block;
  width: 13px;
  height: 13px;
  font-size: 13px;
  line-height: 1;
  color: var(--ct-fg-subtle);
  transition: transform var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.trigger.open .trigger-arrow { transform: rotate(180deg); color: var(--ct-fg); }

.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 320px;
  max-height: 380px;
  display: flex;
  flex-direction: column;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-md);
  z-index: 100;
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.search-wrap { padding: 8px; }
.search {
  width: 100%;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 12.5px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ct-border-subtle);
  color: var(--ct-fg);
  outline: none;
  box-sizing: border-box;
}
.search:focus { border-bottom-color: var(--ct-primary); }
.search::placeholder { color: var(--ct-fg-subtle); }

.preset-row { padding: 4px 8px; }
.preset-btn {
  width: 100%;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 12.5px;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--ct-fg-muted);
  cursor: pointer;
  letter-spacing: 0.06em;
  border-radius: var(--ct-radius-sm);
}
.preset-btn:hover { color: var(--ct-primary); background: var(--ct-surface-1); }
.preset-btn.active {
  background: color-mix(in srgb, var(--ct-primary) 14%, transparent);
  color: var(--ct-primary);
}

.list {
  flex: 1;
  overflow-y: auto;
  border-bottom: 1px solid var(--ct-border-subtle);
}
.item {
  width: 100%;
  display: grid;
  grid-template-columns: 24px 56px 1fr 64px;
  gap: 6px;
  align-items: center;
  padding: 6px 10px;
  font-family: inherit;
  font-size: 12.5px;
  background: transparent;
  border: none;
  color: var(--ct-fg-muted);
  cursor: pointer;
  text-align: left;
}
.item:hover { background: var(--ct-surface-1); }
.item.active {
  background: color-mix(in srgb, var(--ct-primary) 14%, transparent);
  color: var(--ct-primary);
}
.item-symbol { color: var(--ct-fg-subtle); text-align: center; }
.item-code { color: var(--ct-fg); font-weight: 600; font-variant-numeric: tabular-nums; }
.item-name {
  color: var(--ct-fg-subtle);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-rate {
  color: var(--ct-fg-subtle);
  text-align: right;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}
.no-match {
  padding: 12px 8px;
  text-align: center;
  color: var(--ct-fg-subtle);
  font-size: 12px;
}

.custom-toggle {
  width: 100%;
  padding: 6px 10px;
  font-family: inherit;
  font-size: 12.5px;
  text-align: left;
  background: transparent;
  border: none;
  border-top: 1px solid var(--ct-border-subtle);
  color: var(--ct-fg-subtle);
  cursor: pointer;
  letter-spacing: 0.06em;
}
.custom-toggle:hover { color: var(--ct-fg); }
.custom-toggle.active { color: var(--ct-fg); }

.custom-form {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.custom-row { display: flex; align-items: center; gap: 8px; }
.custom-lbl {
  font-size: 12px;
  color: var(--ct-fg-subtle);
  letter-spacing: 0.06em;
  min-width: 56px;
}
.custom-input {
  flex: 1;
  padding: 5px 8px;
  font-family: inherit;
  font-size: 12.5px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ct-border-subtle);
  color: var(--ct-fg);
  outline: none;
}
.custom-input:focus { border-bottom-color: var(--ct-primary); }

.custom-apply {
  padding: 6px 14px;
  align-self: flex-end;
  font-family: inherit;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--ct-primary) 14%, transparent);
  border: 1px solid var(--ct-primary);
  color: var(--ct-primary);
  border-radius: var(--ct-radius-sm);
  cursor: pointer;
}
.custom-apply:hover {
  background: var(--ct-primary);
  color: var(--ct-bg);
}

.custom-error {
  padding: 4px 0;
  font-size: 11.5px;
  color: var(--ct-error, #d04848);
  letter-spacing: 0.04em;
}
</style>
