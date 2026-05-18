// Client-side currency conversion. Mirrors agent-time's useExchangeRate
// composable so the Vibe dashboard can re-render every USD figure in
// whatever currency the user picks. Rates come from open.er-api.com
// (USD base, cached 1h in localStorage) plus an optional custom rate.
//
// SSR note: every storage / network access is client-only; on the
// server we expose USD defaults so the first render stays deterministic
// and matches what the client hydrates to before the rate cache loads.

import { computed, ref } from 'vue'

const STORAGE_PREFIX = 'codetime-web:'

const CURRENCY_KEY = `${STORAGE_PREFIX}currency`
const RATES_KEY = `${STORAGE_PREFIX}exchange-rates`
const RATES_TS_KEY = `${STORAGE_PREFIX}exchange-rates-ts`
const CUSTOM_RATE_KEY = `${STORAGE_PREFIX}custom-rate`
const CUSTOM_LABEL_KEY = `${STORAGE_PREFIX}custom-label`

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export const CUSTOM_CODE = '__CUSTOM__'

type CurrencyEntry = {
  code: string
  rate: number
  symbol: string
  name: string
}

function isClient(): boolean {
  return globalThis.window !== undefined
}

function readStorage<T>(key: string, fallback: T): T {
  if (!isClient()) {
    return fallback
  }
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      return JSON.parse(raw) as T
    }
  }
  catch {
    // unavailable
  }
  return fallback
}

function writeStorage(key: string, value: unknown): void {
  if (!isClient()) {
    return
  }
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // unavailable
  }
}

const locale = 'en'

function getCurrencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).formatToParts(0)
    return parts.find(p => p.type === 'currency')?.value ?? code
  }
  catch {
    return code
  }
}

function getCurrencyName(code: string): string {
  try {
    const name = new Intl.DisplayNames(locale, { type: 'currency' }).of(code)
    return name ?? code
  }
  catch {
    return code
  }
}

// Module-level singleton — Nuxt auto-imports the composable; reusing
// refs across components keeps the picker and every cost cell in sync
// without prop-drilling.
const currencyCode = ref<string>(readStorage(CURRENCY_KEY, 'USD'))
const rates = ref<Record<string, number>>({ USD: 1 })
const customRateValue = ref<number>(readStorage(CUSTOM_RATE_KEY, 1))
const customLabel = ref<string>(readStorage(CUSTOM_LABEL_KEY, 'CUSTOM'))
const fetching = ref(false)
let initialized = false

const isCustom = computed(() => currencyCode.value === CUSTOM_CODE)

const effectiveRate = computed(() => {
  if (isCustom.value) {
    return customRateValue.value
  }
  return rates.value[currencyCode.value] ?? 1
})

const currencyMeta = computed(() => {
  if (isCustom.value) {
    return { code: customLabel.value, symbol: customLabel.value, name: 'Custom' }
  }
  const code = currencyCode.value
  return {
    code,
    symbol: getCurrencySymbol(code),
    name: getCurrencyName(code),
  }
})

const currencyData = computed<CurrencyEntry[]>(() =>
  Object.entries(rates.value)
    .filter(([code]) => code !== 'USD')
    .map(([code, rate]) => ({
      code,
      rate,
      symbol: getCurrencySymbol(code),
      name: getCurrencyName(code),
    }))
    .sort((a, b) => a.code.localeCompare(b.code)),
)

function convert(usdAmount: number): number {
  return usdAmount * effectiveRate.value
}

// Standard format — two decimals once the converted value is small,
// thousands-separated and no decimals once it's large. The custom-label
// case prefixes with the label + space because a free-form label like
// "RMB" reads weirdly when butted up against the digits.
function format(usdAmount: number): string {
  if (!Number.isFinite(usdAmount)) {
    return formatWithSymbol(0)
  }
  return formatWithSymbol(convert(usdAmount))
}

function formatWithSymbol(value: number): string {
  const sym = currencyMeta.value.symbol
  const sep = isCustom.value ? ' ' : ''
  if (Math.abs(value) >= 1000) {
    return `${sym}${sep}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
  if (value > 0 && value < 0.01) {
    return `${sym}${sep}${value.toFixed(6)}`
  }
  return `${sym}${sep}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Compact form for KPI tiles — k/M/B suffixes once the converted
// value crosses each threshold, mirroring fmtUsdCompact's behaviour.
function formatCompact(usdAmount: number): string {
  if (!Number.isFinite(usdAmount)) {
    return formatWithSymbol(0)
  }
  return formatCompactWithSymbol(convert(usdAmount))
}

function formatCompactWithSymbol(value: number): string {
  const sym = currencyMeta.value.symbol
  const sep = isCustom.value ? ' ' : ''
  const num = formatCompactNumberValue(value)
  return `${num.sign}${sym}${sep}${num.body}`
}

function formatCompactNumberValue(value: number): { sign: string, body: string } {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e9) {
    return { sign, body: `${(abs / 1e9).toFixed(2)}B` }
  }
  if (abs >= 1e6) {
    return { sign, body: `${(abs / 1e6).toFixed(2)}M` }
  }
  if (abs >= 1e3) {
    return { sign, body: `${(abs / 1e3).toFixed(2)}k` }
  }
  return {
    sign,
    body: abs.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  }
}

// KPI tiles render the symbol in a separate span (so it can be styled
// as an accent), so they need the numeric portion without the leading
// currency symbol.
function formatCompactNumber(usdAmount: number): string {
  if (!Number.isFinite(usdAmount)) {
    return '0.00'
  }
  const value = convert(usdAmount)
  const num = formatCompactNumberValue(value)
  return `${num.sign}${num.body}`
}

function setCurrency(code: string): void {
  currencyCode.value = code
  writeStorage(CURRENCY_KEY, code)
}

function setCustomRate(rate: number, label: string): void {
  customRateValue.value = rate
  customLabel.value = label
  currencyCode.value = CUSTOM_CODE
  writeStorage(CUSTOM_RATE_KEY, rate)
  writeStorage(CUSTOM_LABEL_KEY, label)
  writeStorage(CURRENCY_KEY, CUSTOM_CODE)
}

async function fetchRates(): Promise<void> {
  if (!isClient() || fetching.value) {
    return
  }
  fetching.value = true
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = (await response.json()) as { rates?: Record<string, number> }
    if (data.rates) {
      rates.value = { USD: 1, ...data.rates }
      writeStorage(RATES_KEY, rates.value)
      writeStorage(RATES_TS_KEY, Date.now())
    }
  }
  catch {
    const cached = readStorage<Record<string, number> | null>(RATES_KEY, null)
    if (cached) {
      rates.value = cached
    }
  }
  finally {
    fetching.value = false
  }
}

function init(): void {
  if (initialized || !isClient()) {
    return
  }
  initialized = true
  // Re-hydrate after SSR so storage-backed values overwrite the USD
  // defaults the server rendered with.
  currencyCode.value = readStorage(CURRENCY_KEY, 'USD')
  customRateValue.value = readStorage(CUSTOM_RATE_KEY, 1)
  customLabel.value = readStorage(CUSTOM_LABEL_KEY, 'CUSTOM')
  const cached = readStorage<Record<string, number> | null>(RATES_KEY, null)
  const cachedTs = readStorage<number | null>(RATES_TS_KEY, null)
  if (cached) {
    rates.value = cached
  }
  const needsFetch = !cachedTs || Date.now() - cachedTs > CACHE_TTL_MS
  if (needsFetch) {
    void fetchRates()
  }
}

export function useExchangeRate() {
  init()
  return {
    currencyCode,
    currencyMeta,
    currencyData,
    isCustom,
    effectiveRate,
    fetching,
    convert,
    format,
    formatCompact,
    formatCompactNumber,
    setCurrency,
    setCustomRate,
    customRateValue,
    customLabel,
    refresh: fetchRates,
  }
}
