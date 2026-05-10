// Shared theme tokens & helpers for codetime-generated SVG widgets.
// Keep palette aligned with the web app's CSS tokens (see app/theme).

export type WidgetTheme = 'light' | 'dark'

export type ThemeTokens = {
  bg: string
  surface: string
  border: string
  fg: string
  fgMuted: string
  fgSubtle: string
  primary: string
  accent: string
  pulse: string
}

const LIGHT: ThemeTokens = {
  bg: '#ffffff',
  surface: '#f7f7f8',
  border: '#e5e7eb',
  fg: '#111827',
  fgMuted: '#374151',
  fgSubtle: '#6b7280',
  primary: '#0284c7',
  accent: '#0ea5e9',
  pulse: '#10b981',
}

const DARK: ThemeTokens = {
  bg: '#0b0d10',
  surface: '#14171c',
  border: '#262b33',
  fg: '#f3f4f6',
  fgMuted: '#cbd5e1',
  fgSubtle: '#94a3b8',
  primary: '#38bdf8',
  accent: '#0ea5e9',
  pulse: '#34d399',
}

export function getTheme(name?: string | null): ThemeTokens {
  return name === 'dark' ? DARK : LIGHT
}

export function escapeXml(input: string | number | null | undefined): string {
  if (input === null || input === undefined) {
    return ''
  }
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

// Stable, distinct palette used when no language-specific color is supplied.
export const CATEGORICAL_PALETTE: string[] = [
  '#0284c7',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#6366f1',
  '#14b8a6',
  '#ec4899',
  '#f97316',
  '#22c55e',
]

export function pickColor(index: number, override?: string | null): string {
  if (override) {
    return override
  }
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]!
}

// Common font-stack — keep platform-safe, no external font loads.
// IMPORTANT: use single quotes around multi-word names so the string can be
// safely interpolated inside double-quoted SVG attributes.
export const FONT_SANS = `ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
export const FONT_MONO = `ui-monospace, SFMono-Regular, Menlo, 'JetBrains Mono', Consolas, monospace`

export function formatMinutes(min: number): string {
  if (!min) {
    return '0m'
  }
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h <= 0) {
    return `${m}m`
  }
  if (m === 0) {
    return `${h}h`
  }
  return `${h}h ${m}m`
}
