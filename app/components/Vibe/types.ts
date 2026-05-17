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

export type VibeTokenBucket = {
  ts: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  modelCalls: number
  estimatedCostUsd: number
}

export type VibeHeatmapCell = {
  weekday: number // Mon=0..Sun=6
  hour: number // 0..23
  count: number
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
}

export type VibeToolRow = {
  tool: string
  calls: number
  failures: number
  totalDurationMs: number
  avgDurationMs: number
}

export type VibeDashboard = {
  range: { key: '24h' | '7d' | '30d' | 'all', since: string | null, until: string }
  bucket: 'hour' | 'day' | 'week'
  summary: VibeSummary
  overviewBuckets: VibeOverviewBucket[]
  tokenBuckets: VibeTokenBucket[]
  heatmap: VibeHeatmapCell[]
  projectTokens: VibeProjectRow[]
  modelCosts: VibeModelRow[]
  tools: VibeToolRow[]
}

// Common compact formatter used across KPI/table components. Returns
// the numeric portion separately from the unit so callers can style
// them differently (e.g. small unit suffix next to a big number).
export function compactParts(value: number): { value: string, unit?: string } {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) {
    return { value: (value / 1_000_000_000).toFixed(1), unit: 'B' }
  }
  if (abs >= 1_000_000) {
    return { value: (value / 1_000_000).toFixed(1), unit: 'M' }
  }
  if (abs >= 1000) {
    return { value: (value / 1000).toFixed(1), unit: 'k' }
  }
  return { value: Math.round(value).toString() }
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

export function fmtUsd(value: number): string {
  if (!Number.isFinite(value)) {
 return '$0.00'
}
  if (Math.abs(value) < 0.01 && value !== 0) {
    return `$${value.toFixed(4)}`
  }
  return `$${value.toFixed(2)}`
}

// Pretty-print a raw model id (e.g. `anthropic/claude-opus-4-7`) as
// human-readable text (`Claude Opus 4 7`). Lifted verbatim from
// agent-time/utils/format.ts so renames in their special-case table
// are easy to mirror here.
export function formatModelName(model: string): string {
  const name = model.includes('/') ? model.split('/').pop()! : model

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
