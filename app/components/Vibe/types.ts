// Shared types for the Vibe dashboard page. These mirror the JSON
// returned by GET /v3/agent/dashboard. The SDK regenerates from
// OpenAPI on `pnpm openapi`, so the canonical shape lives in the
// route handler — but the SDK only types the response loosely (the
// handler uses inline `type: object` schemas to keep the file
// self-contained), so we keep narrow companion types here for the
// component props.

export type VibeSummary = {
  totalSessions: number
  totalEvents: number
  totalProjects: number
  totalToolCalls: number
  totalCommandCalls: number
  totalInputTokens: number
  totalCachedInputTokens: number
  totalOutputTokens: number
  totalReasoningOutputTokens: number
  totalTokens: number
  totalDurationMs: number
  totalLinesAdded: number
  totalLinesRemoved: number
}

export type VibeOverviewBucket = {
  ts: string
  activity: number
  sessions: number
  tokens: number
  linesChanged: number
  estimatedCostUsd: number
}

export type VibeTokenBucketSource = {
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  modelCalls: number
  estimatedCostUsd: number
}

export type VibeTokenBucket = VibeTokenBucketSource & {
  ts: string
  // bySource: agent source ('codex' / 'claude-code' / 'opencode' / 'pi' /
  // unknown) → its share of this bucket's totals. Used to render the
  // cost timeline as a stacked bar chart, one colour per agent.
  bySource: Record<string, VibeTokenBucketSource>
}

export type VibeHeatmapCell = {
  weekday: number // Mon=0..Sun=6
  hour: number // 0..23
  count: number
  estimatedCostUsd: number
}

export type VibeProjectSourceSegment = {
  source: string
  estimatedCostUsd: number
}

export type VibeProjectRow = {
  project: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  modelCalls: number
  sessions: number
  agentDurationMs: number
  estimatedCostUsd: number
  // Sorted descending by cost. Used by ProjectTokens to render the bar
  // as stacked agent-source segments — codex/claude-code/opencode/pi
  // each get their own slice so users can read which agent dominates
  // a project at a glance.
  sourceSegments: VibeProjectSourceSegment[]
}

export type VibeModelPricing = {
  displayName?: string
  source: 'openrouter' | 'fallback' | 'missing'
  inputPerMillion: number
  cacheCreationInputPerMillion: number
  cacheReadInputPerMillion: number
  cachedInputPerMillion: number
  outputPerMillion: number
}

export type VibeModelRow = {
  model: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  modelCalls: number
  durationMs: number
  estimatedCostUsd: number
  pricing: VibeModelPricing
}

export type VibeToolRow = {
  tool: string
  calls: number
  failures: number
  totalDurationMs: number
  avgDurationMs: number
}

export type VibeAgentModelSegment = {
  model: string
  estimatedCostUsd: number
}

// Per-agent-source leaderboard row. Mirrors VibeProjectRow but the
// stacked bar slices by model instead of by source — picks up the
// "which model dominates this agent" angle that the projects table
// can't show because it already uses source as its segment axis.
export type VibeAgentRow = {
  source: string
  sessions: number
  modelCalls: number
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  agentDurationMs: number
  estimatedCostUsd: number
  // Sorted descending by cost. Frontend renders this as a stacked
  // horizontal bar so users can see at a glance which model is doing
  // the heavy lifting under each agent.
  modelSegments: VibeAgentModelSegment[]
}

export type VibeDashboard = {
  range: { key: '24h' | '7d' | '30d' | 'all' | 'custom', since: string | null, until: string }
  bucket: 'hour' | 'day' | 'week'
  summary: VibeSummary
  overviewBuckets: VibeOverviewBucket[]
  tokenBuckets: VibeTokenBucket[]
  heatmap: VibeHeatmapCell[]
  projectTokens: VibeProjectRow[]
  modelCosts: VibeModelRow[]
  agentCosts: VibeAgentRow[]
  tools: VibeToolRow[]
  // Distinct agent sources the user has ingested, scoped to the
  // current machine + time window. Powers the source dropdown so the
  // user can scope the dashboard to one agent (claude-code / codex /
  // opencode / pi / …) without the picker shrinking to just the
  // currently selected value.
  availableSources: string[]
}

// Common compact formatter used across KPI/table components. Returns
// the numeric portion separately from the unit so callers can style
// them differently (e.g. small unit suffix next to a big number).
//
// Mirrors agent-time/utils/format.ts so the two dashboards print the
// same numbers — note the asymmetric 1e3/1e4 thresholds: numbers
// under 10k get two decimals (1.23k) while numbers above 10k get one
// (12.3k) so the result column stays consistent in width.
export function compactParts(value: number): { value: string, unit?: string } {
  const abs = Math.abs(value)
  if (abs >= 1e9) {
    return { value: (value / 1e9).toFixed(2), unit: 'B' }
  }
  if (abs >= 1e6) {
    return { value: (value / 1e6).toFixed(1), unit: 'M' }
  }
  if (abs >= 1e4) {
    return { value: (value / 1e3).toFixed(1), unit: 'k' }
  }
  if (abs >= 1e3) {
    return { value: (value / 1e3).toFixed(2), unit: 'k' }
  }
  return { value: value.toLocaleString() }
}

export function fmtDurationParts(ms: number): { value: string, unit?: string } {
  if (ms <= 0) {
    return { value: '—' }
  }
  const seconds = ms / 1000
  if (seconds < 60) {
    return { value: Math.round(seconds).toString(), unit: 's' }
  }
  const minutes = seconds / 60
  if (minutes < 60) {
    return { value: minutes.toFixed(1), unit: 'min' }
  }
  const hours = minutes / 60
  return { value: hours.toFixed(1), unit: 'h' }
}

// Money formatter — always two decimal places with thousands
// separators so every cost cell aligns vertically and you can compare
// rows without doing decimal-place math. Micro values still render
// (`$0.00` becomes the floor) — use `fmtUsdMicro` if you need to keep
// sub-cent precision visible.
export function fmtUsd(value: number): string {
  if (!Number.isFinite(value)) {
    return '$0.00'
  }
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Variant that keeps sub-cent precision visible. Use sparingly — most
// table columns want fmtUsd for vertical alignment.
export function fmtUsdMicro(value: number): string {
  if (!Number.isFinite(value)) {
    return '$0.00'
  }
  const abs = Math.abs(value)
  if (abs > 0 && abs < 0.01) {
    return `$${value.toFixed(6)}`
  }
  return fmtUsd(value)
}

// Compact money formatter — for KPI tiles where the number lives in a
// narrow column and the decimal tail is noise. Reuses the compactParts
// thresholds (k/M/B) but stays in dollars; sub-thousand values fall
// through to the standard two-decimal form so precision is consistent
// across rows.
export function fmtUsdCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return '$0.00'
  }
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e9) {
    return `${sign}$${(abs / 1e9).toFixed(2)}B`
  }
  if (abs >= 1e6) {
    return `${sign}$${(abs / 1e6).toFixed(2)}M`
  }
  if (abs >= 1e3) {
    return `${sign}$${(abs / 1e3).toFixed(2)}k`
  }
  return fmtUsd(value)
}

// Compact integer formatter — same thresholds as compactParts but
// returns a single string so leaderboards can put the unit in the
// same span as the value. Matches agent-time/utils/format.ts::compact.
export function compact(value: number): string {
  const parts = compactParts(value)
  return parts.unit ? `${parts.value}${parts.unit}` : parts.value
}

// Pretty-print a raw model id (e.g. `anthropic/claude-opus-4-7`) as
// human-readable text (`Claude Opus 4 7`). Lifted verbatim from
// agent-time/utils/format.ts so renames in their special-case table
// are easy to mirror here.
export function formatModelName(model: string): string {
  const bare = model.includes('/') ? model.split('/').pop()! : model
  // Collapse dashes *between version digits* into dots so `claude-opus-4-8`
  // renders as `Claude Opus 4.8` rather than `Claude Opus 4 8`. The
  // lookahead keeps an 8-digit release date (`...-4-5-20251001`) intact.
  const name = bare.replaceAll(/(\d+)-(\d+)(?=-|$)/g, '$1.$2')

  const special: Record<string, string> = {
    gpt: 'GPT',
    claude: 'Claude',
    opus: 'Opus',
    sonnet: 'Sonnet',
    haiku: 'Haiku',
    deepseek: 'DeepSeek',
    codex: 'Codex',
    gemini: 'Gemini',
    nova: 'Nova',
    llama: 'LLaMA',
    qwen: 'Qwen',
    mistral: 'Mistral',
    codestral: 'Codestral',
    glm: 'GLM',
  }

  return name.split('-').map((part) => {
    const lower = part.toLowerCase()
    if (special[lower]) {
      return special[lower]
    }
    if (/^v\d/.test(lower)) {
      return `V${part.slice(1)}`
    }
    if (/^\d{4,}$/.test(lower)) {
      return part
    }
    if (/^[\d.]+$/.test(lower)) {
      return part
    }
    return part.charAt(0).toUpperCase() + part.slice(1)
  }).join(' ')
}

// Map an OpenRouter `name` field ("Anthropic: Claude Opus 4.7") or a
// bare codetime model id ("claude-opus-4-7") into a provider icon class
// plus a clean display name with the provider stripped. The provider
// icon lets the table render `<icon> Claude Opus 4.7` instead of the
// noisier `Anthropic: Claude Opus 4.7`.
const PROVIDER_ICON: Record<string, string> = {
  'anthropic': 'i-simple-icons-anthropic',
  'openai': 'i-simple-icons-openai',
  'google': 'i-simple-icons-google',
  'deepseek': 'i-simple-icons-deepseek',
  'meta': 'i-simple-icons-meta',
  'meta-llama': 'i-simple-icons-meta',
  'mistral': 'i-simple-icons-mistralai',
  'mistralai': 'i-simple-icons-mistralai',
  'xai': 'i-simple-icons-x',
  'x-ai': 'i-simple-icons-x',
  'qwen': 'i-simple-icons-alibabacloud',
  'alibaba': 'i-simple-icons-alibabacloud',
  // Z.ai has no entry in simple-icons (zai / z both 404), so providers
  // matching `z-ai` / `glm-*` fall through to the generic cube glyph
  // ModelCosts uses for unknown providers.
}

// Family-prefix → provider for codetime's bare ids. Matches the vendor
// inference table in `server/utils/agent-pricing.ts` so the icon picks
// up even when OpenRouter pricing didn't match (no `displayName`).
const FAMILY_TO_PROVIDER: Array<{ test: (n: string) => boolean, provider: string }> = [
  { test: n => n.startsWith('claude-'), provider: 'anthropic' },
  { test: n => n.startsWith('gpt-') || /^o[134]-/.test(n), provider: 'openai' },
  { test: n => n.startsWith('deepseek-'), provider: 'deepseek' },
  { test: n => n.startsWith('gemini-'), provider: 'google' },
  { test: n => n.startsWith('llama-'), provider: 'meta-llama' },
  { test: n => n.startsWith('qwen'), provider: 'qwen' },
  { test: n => n.startsWith('mistral-') || n.startsWith('codestral-'), provider: 'mistral' },
  { test: n => n.startsWith('grok-'), provider: 'x-ai' },
  { test: n => n.startsWith('glm-'), provider: 'z-ai' },
]

// Strip trailing "Fast" / "(Fast)" / "[Fast]" markers from a display
// name and return whether one was present. The marker comes from
// OpenRouter (parenthesised) or our fallback pricing table (bare
// suffix, see agent-time/apps/api/src/pricing.ts), so callers can
// render it as a tag instead of inline noise.
function extractFastTag(name: string): { name: string, fast: boolean } {
  // Match trailing " Fast", "-Fast", "_Fast" or "(Fast)" markers without
  // a backtracking-prone regex — strip the suffix manually.
  let stripped = name.trimEnd()
  if (stripped.endsWith(')') || stripped.endsWith(']')) {
    stripped = stripped.slice(0, -1).trimEnd()
  }
  const lower = stripped.toLowerCase()
  if (!lower.endsWith('fast')) {
    return { name, fast: false }
  }
  let head = stripped.slice(0, -4).trimEnd()
  // Drop the opening bracket and the connector character so we don't
  // leave behind a dangling "(", "-", or "_".
  if (head.endsWith('(') || head.endsWith('[')) {
    head = head.slice(0, -1).trimEnd()
  }
  if (head.endsWith('-') || head.endsWith('_')) {
    head = head.slice(0, -1).trimEnd()
  }
  if (head.length === 0) {
    return { name, fast: false }
  }
  return { name: head, fast: true }
}

export function providerInfoFor(
  rawModel: string,
  displayName: string | undefined,
): { icon: string | undefined, name: string, provider: string | undefined, fast: boolean } {
  // Fast tag may live in either the bare model id (`claude-opus-4-7-fast`)
  // or the OpenRouter display name ("Claude Opus 4.7 (Fast)"); detect on
  // the id first so the flag is set even when displayName is absent.
  const bareModel = rawModel.includes('/') ? rawModel.split('/').pop()! : rawModel
  const idFast = /(?:^|-)fast$/i.test(bareModel)

  // OpenRouter formats `name` as "Provider: Pretty Model Name" (with
  // optional trailing tags like "(Fast)"). Split on the first colon and
  // hand back both halves so the caller can render them independently.
  if (displayName && displayName.includes(':')) {
    const [providerRaw, ...rest] = displayName.split(':')
    const provider = providerRaw!.trim()
    const cleanRaw = rest.join(':').trim() || displayName
    const { name: cleanName, fast: nameFast } = extractFastTag(cleanRaw)
    const icon = PROVIDER_ICON[provider.toLowerCase()]
    return { icon, name: cleanName, provider, fast: idFast || nameFast }
  }

  // No OpenRouter `name` — fall back to inferring the provider from the
  // bare codetime model id's family prefix.
  const lower = bareModel.toLowerCase()
  const rawName = displayName ?? formatModelName(rawModel)
  const { name: cleanName, fast: nameFast } = extractFastTag(rawName)
  for (const { test, provider } of FAMILY_TO_PROVIDER) {
    if (test(lower)) {
      return {
        icon: PROVIDER_ICON[provider],
        name: cleanName,
        provider,
        fast: idFast || nameFast,
      }
    }
  }

  return { icon: undefined, name: cleanName, provider: undefined, fast: idFast || nameFast }
}

// Canonical categorical palette — same colours agent-time uses for
// charts and source coloring. Kept light/dark-theme-agnostic by design:
// the hues are muted enough to read on both.
export const VIBE_PALETTE = [
  '#6fa3c4', // steel blue
  '#c49a6f', // warm copper
  '#7aad6a', // sage green
  '#c47a8a', // rose
  '#9a8ac4', // lavender
  '#6ab8a8', // teal
  '#c9a84c', // amber
  '#8a8a8a', // neutral gray
] as const

const AGENT_COLOR_MAP: Record<string, string> = {
  'opencode': VIBE_PALETTE[4]!, // lavender
  'claude-code': VIBE_PALETTE[1]!, // warm copper
  'codex': VIBE_PALETTE[0]!, // steel blue
  'pi': VIBE_PALETTE[5]!, // teal
}

function hashSource(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = Math.trunc(hash * 31 + name.charCodeAt(i))
  }
  return Math.abs(hash) % VIBE_PALETTE.length
}

// Pick the colour for a given agent source. Mirrors agent-time/utils/
// agentColor.ts so the same agent renders in the same hue across the
// two dashboards.
export function agentColor(name: string): string {
  if (!name) {
    return VIBE_PALETTE[0]!
  }
  const key = name.toLowerCase()
  return AGENT_COLOR_MAP[key] ?? VIBE_PALETTE[hashSource(key)]!
}

// Stable hue for a model id — used by the segmented PROJECTS bar so the
// same model maps to the same colour across every project row. Family
// hints (gpt / claude / opus / sonnet / haiku / deepseek / gemini /
// llama / qwen / mistral) get fixed slots so "anthropic/claude-opus-4"
// and "claude-opus-4-7" land on the same colour even though their hash
// differs.
const MODEL_FAMILY_COLOR: { test: RegExp, color: string }[] = [
  { test: /opus/, color: VIBE_PALETTE[1]! }, // copper
  { test: /sonnet/, color: VIBE_PALETTE[2]! }, // sage
  { test: /haiku/, color: VIBE_PALETTE[5]! }, // teal
  { test: /claude/, color: VIBE_PALETTE[3]! }, // rose
  { test: /codex/, color: VIBE_PALETTE[0]! }, // steel
  { test: /gpt-5/, color: VIBE_PALETTE[4]! }, // lavender
  { test: /deepseek/, color: VIBE_PALETTE[6]! }, // amber
  { test: /gemini/, color: VIBE_PALETTE[2]! }, // sage
  { test: /qwen/, color: VIBE_PALETTE[5]! }, // teal
  { test: /(llama|mistral)/, color: VIBE_PALETTE[6]! }, // amber
]

export function modelColor(model: string): string {
  if (!model) {
    return VIBE_PALETTE[7]! // neutral gray
  }
  const key = model.toLowerCase()
  for (const { test, color } of MODEL_FAMILY_COLOR) {
    if (test.test(key)) {
      return color
    }
  }
  return VIBE_PALETTE[hashSource(key)]!
}

// Display metadata for an agent source id (claude-code / codex / …).
// Shared between the source dropdown and the AgentCosts leaderboard so
// new agents only need to be added in one place.
export function agentSourceMeta(id: string): { label: string, icon: string } {
  const key = id.toLowerCase()
  switch (key) {
    case 'claude':
    case 'claude-code': {
      return { label: 'Claude Code', icon: 'i-simple-icons-anthropic' }
    }
    case 'codex': {
      return { label: 'Codex', icon: 'i-simple-icons-openai' }
    }
    case 'opencode': {
      return { label: 'OpenCode', icon: 'i-brand-opencode' }
    }
    case 'pi': {
      return { label: 'Pi', icon: 'i-brand-pi' }
    }
    default: {
      const label = id.length > 0 ? id.charAt(0).toUpperCase() + id.slice(1) : id
      return { label, icon: 'i-tabler-terminal-2' }
    }
  }
}

export function fmtDurationShort(ms: number): string {
  if (ms <= 0) {
 return '—'
}
  const totalMinutes = Math.round(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) {
 return `${minutes}m`
}
  if (minutes === 0) {
 return `${hours}h`
}
  return `${hours}h ${minutes}m`
}
