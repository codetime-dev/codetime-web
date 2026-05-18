// Model pricing pulled from OpenRouter's models API.
// Source: https://openrouter.ai/api/v1/models
// Falls back to a small built-in subset if the network is unavailable.
//
// Ported verbatim from agent-time/apps/api/src/pricing.ts so the Vibe
// dashboard renders the same cost figures as the agent-time UI. Keep
// the FALLBACK table in sync when agent-time updates its prices.

const SOURCE_URL = 'https://openrouter.ai/api/v1/models'

const REFRESH_MS = 24 * 60 * 60 * 1000

export type ModelPrice = {
  displayName?: string
  inputCostPerToken: number
  cacheCreationInputCostPerToken: number
  cacheReadInputCostPerToken: number
  cachedInputCostPerToken: number
  outputCostPerToken: number
  source: 'openrouter' | 'fallback' | 'missing'
}

type CatalogState = {
  loadedAt: number
  status: 'ready' | 'stale' | 'missing'
  table: Record<string, ModelPrice>
  raw: Map<string, ModelPrice>
  source: 'openrouter' | 'fallback'
}

const FALLBACK: Record<string, ModelPrice> = {
  'gpt-5': fbPrice('GPT-5', 1.25e-6, 1.25e-7, 1e-5),
  'gpt-5-codex': fbPrice('GPT-5 Codex', 1.25e-6, 1.25e-7, 1e-5),
  'gpt-5.1': fbPrice('GPT-5.1', 1.25e-6, 1.25e-7, 1e-5),
  'gpt-5.1-codex': fbPrice('GPT-5.1 Codex', 1.25e-6, 1.25e-7, 1e-5),
  'gpt-5.1-codex-max': fbPrice('GPT-5.1 Codex Max', 1.25e-6, 1.25e-7, 1e-5),
  'gpt-5.1-codex-mini': fbPrice('GPT-5.1 Codex Mini', 2.5e-7, 2.5e-8, 2e-6),
  'gpt-5.2-codex': fbPrice('GPT-5.2 Codex', 1.75e-6, 1.75e-7, 1.4e-5),
  'gpt-5.3-codex': fbPrice('GPT-5.3 Codex', 1.75e-6, 1.75e-7, 1.4e-5),
  'gpt-5.4': fbPrice('GPT-5.4', 2.5e-6, 2.5e-7, 1.5e-5),
  'gpt-5.4-mini': fbPrice('GPT-5.4 Mini', 7.5e-7, 7.5e-8, 4.5e-6),
  'gpt-5.5': fbPrice('GPT-5.5', 5e-6, 5e-7, 3e-5),
  'gpt-5-mini': fbPrice('GPT-5 Mini', 2.5e-7, 2.5e-8, 2e-6),
  'gpt-5-nano': fbPrice('GPT-5 Nano', 5e-8, 5e-9, 4e-7),
  'claude-sonnet-4-6': fbPrice('Claude Sonnet 4.6', 3e-6, 3e-7, 1.5e-5, 3.75e-6),
  'claude-opus-4-6': fbPrice('Claude Opus 4.6', 5e-6, 5e-7, 25e-6, 6.25e-6),
  'claude-opus-4-7': fbPrice('Claude Opus 4.7', 5e-6, 5e-7, 25e-6, 6.25e-6),
  'claude-haiku-4-5': fbPrice('Claude Haiku 4.5', 1e-6, 1e-7, 5e-6, 1.25e-6),
  'deepseek-chat': fbPrice('DeepSeek Chat', 2.8e-7, 2.8e-8, 4.2e-7),
  'deepseek-reasoner': fbPrice('DeepSeek Reasoner', 2.8e-7, 2.8e-8, 4.2e-7),
  'deepseek-v4-flash': fbPrice('DeepSeek V4 Flash', 1.4e-7, 2.8e-9, 2.8e-7),
  'deepseek-v4-pro': fbPrice('DeepSeek V4 Pro', 4.35e-7, 3.625e-9, 8.7e-7),
}

function fbPrice(
  displayName: string,
  input: number,
  cachedRead: number,
  output: number,
  cacheCreation = cachedRead,
): ModelPrice {
  return {
    displayName,
    inputCostPerToken: input,
    cacheCreationInputCostPerToken: cacheCreation,
    cacheReadInputCostPerToken: cachedRead,
    cachedInputCostPerToken: cachedRead,
    outputCostPerToken: output,
    source: 'fallback',
  }
}

let state: CatalogState = {
  loadedAt: 0,
  status: 'missing',
  table: { ...FALLBACK },
  raw: new Map(),
  source: 'fallback',
}

let inflight: Promise<void> | null = null

async function loadCatalog(): Promise<void> {
  try {
    const response = await fetch(SOURCE_URL, { headers: { accept: 'application/json' } })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const json = (await response.json()) as { data: Array<Record<string, unknown>> }
    const models = json.data ?? []
    const map = new Map<string, ModelPrice>()
    for (const model of models) {
      const id = model.id
      if (!id || typeof id !== 'string') {
        continue
      }
      const pricing = model.pricing as Record<string, unknown> | undefined
      if (!pricing || typeof pricing !== 'object') {
        continue
      }
      const input = Number.parseFloat(String(pricing.prompt ?? ''))
      const output = Number.parseFloat(String(pricing.completion ?? ''))
      if (!Number.isFinite(input) || !Number.isFinite(output)) {
        continue
      }
      // Read both cache-read and cache-write from OpenRouter. They are
      // distinct on Claude (cache_write ≈ 1.25× input, cache_read ≈ 0.1× input)
      // — reusing the cache_read rate for creation would under-charge cache
      // creation by ~12.5×. Fall back to cache_read when write is absent
      // (most OpenAI/DeepSeek entries have no input_cache_write).
      const cacheRead = Number.parseFloat(String(pricing.input_cache_read ?? '')) || input * 0.1
      const cacheWrite = Number.parseFloat(String(pricing.input_cache_write ?? '')) || cacheRead
      map.set(id.toLowerCase(), {
        displayName: typeof model.name === 'string' ? model.name : undefined,
        inputCostPerToken: input,
        cacheCreationInputCostPerToken: cacheWrite,
        cacheReadInputCostPerToken: cacheRead,
        cachedInputCostPerToken: cacheRead,
        outputCostPerToken: output,
        source: 'openrouter',
      })
    }
    state = {
      loadedAt: Date.now(),
      status: 'ready',
      table: { ...FALLBACK },
      raw: map,
      source: 'openrouter',
    }
  }
  catch (error) {
    state = {
      loadedAt: Date.now(),
      status: state.status === 'ready' ? 'stale' : 'missing',
      table: { ...FALLBACK },
      raw: state.raw,
      source: 'fallback',
    }
    console.warn('[pricing] OpenRouter fetch failed, fallback to built-in table:', (error as Error).message)
  }
}

export function ensurePricingLoaded(): Promise<void> {
  if (state.status === 'ready' && Date.now() - state.loadedAt < REFRESH_MS) {
    return Promise.resolve()
  }
  if (!inflight) {
    inflight = loadCatalog().finally(() => {
      inflight = null
    })
  }
  return inflight
}

// Build lookup candidates from a codetime-emitted model name. The CLI's
// naming scheme uses dashes between version digits (`claude-opus-4-7`)
// and sometimes appends a release date (`claude-haiku-4-5-20251001`),
// while OpenRouter ids use dots and no date (`anthropic/claude-opus-4.7`).
// We try the literal name first, then progressively normalized variants.
// Family → OpenRouter vendor prefix lookup. OpenRouter ids carry a
// mandatory `vendor/` prefix that codetime CLI strips, so we infer it
// back from the bare model name.
const VENDOR_PREFIX_BY_FAMILY: Array<{ test: (name: string) => boolean, prefix: string }> = [
  { test: (n) => n.startsWith('claude-'), prefix: 'anthropic/' },
  { test: (n) => n.startsWith('gpt-') || n.startsWith('o1-') || n.startsWith('o3-') || n.startsWith('o4-'), prefix: 'openai/' },
  { test: (n) => n.startsWith('deepseek-'), prefix: 'deepseek/' },
  { test: (n) => n.startsWith('glm-'), prefix: 'z-ai/' },
  { test: (n) => n.startsWith('grok-'), prefix: 'x-ai/' },
  { test: (n) => n.startsWith('gemini-'), prefix: 'google/' },
  { test: (n) => n.startsWith('llama-'), prefix: 'meta-llama/' },
  { test: (n) => n.startsWith('qwen'), prefix: 'qwen/' },
  { test: (n) => n.startsWith('mistral-') || n.startsWith('codestral-'), prefix: 'mistralai/' },
]

function pricingCandidates(model: string): string[] {
  const set = new Set<string>()
  const add = (s: string): void => {
    if (!s) {
      return
    }
    set.add(s)
    // Drop any `vendor/` prefix the caller may have supplied so that the
    // raw model name is still a candidate on its own.
    const stripped = s.replace(/^[^/]+\//, '')
    set.add(stripped)
    // Infer the vendor prefix from the model family.
    for (const { test, prefix } of VENDOR_PREFIX_BY_FAMILY) {
      if (test(stripped)) {
        set.add(`${prefix}${stripped}`)
      }
    }
  }
  const base = model.toLowerCase()
  add(base)
  // `claude-opus-4-7` → `claude-opus-4.7`, `claude-haiku-4-5-20251001` →
  // `claude-haiku-4.5-20251001`. Lookahead keeps the regex from chewing
  // through 8-digit date suffixes.
  const dotted = base.replace(/(\D)(\d+)-(\d+)(?=-|$)/g, '$1$2.$3')
  if (dotted !== base) {
    add(dotted)
  }
  // Strip a trailing `-YYYYMMDD` release tag so `claude-haiku-4-5-20251001`
  // can fall back to `claude-haiku-4-5` / `anthropic/claude-haiku-4.5`.
  const undated = base.replace(/-\d{8}$/, '')
  if (undated !== base) {
    add(undated)
    const undatedDotted = undated.replace(/(\D)(\d+)-(\d+)(?=-|$)/g, '$1$2.$3')
    if (undatedDotted !== undated) {
      add(undatedDotted)
    }
  }
  return [...set]
}

export function getPriceFor(model: string): ModelPrice | null {
  if (!model) {
    return null
  }
  const candidates = pricingCandidates(model)
  for (const candidate of candidates) {
    const fromRaw = state.raw.get(candidate)
    if (fromRaw) {
      return fromRaw
    }
  }
  for (const candidate of candidates) {
    const fallback = state.table[candidate]
    if (fallback) {
      return fallback
    }
  }
  return null
}

export function estimateCostUsd(args: {
  model: string
  inputTokens: number
  cachedInputTokens: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
  outputTokens: number
  reasoningOutputTokens: number
}): { cost: number, pricing: ModelPrice | null } {
  const pricing = getPriceFor(args.model)
  if (!pricing) {
    return { cost: 0, pricing: null }
  }
  const cacheCreation = Math.max(0, args.cacheCreationInputTokens ?? 0)
  const cacheRead = Math.max(0, args.cacheReadInputTokens ?? Math.max(0, args.cachedInputTokens - cacheCreation))
  const fresh = Math.max(0, args.inputTokens - cacheCreation - cacheRead)
  const cost
    = fresh * pricing.inputCostPerToken
    + cacheCreation * pricing.cacheCreationInputCostPerToken
    + cacheRead * pricing.cacheReadInputCostPerToken
    + (args.outputTokens + args.reasoningOutputTokens) * pricing.outputCostPerToken
  return { cost, pricing }
}

export function pricingState(): { status: CatalogState['status'], loadedAt: number, source: CatalogState['source'], size: number } {
  return { status: state.status, loadedAt: state.loadedAt, source: state.source, size: state.raw.size }
}
