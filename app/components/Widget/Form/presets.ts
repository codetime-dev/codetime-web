// Shared color palettes for the customisable widget tabs (Status,
// Usage, anything else that exposes accent + background pickers).

export type ColorPreset = { hex: string, label: string }

export const ACCENT_PRESETS: ColorPreset[] = [
  { hex: '#10b981', label: 'emerald' },
  { hex: '#0ea5e9', label: 'sky' },
  { hex: '#6366f1', label: 'indigo' },
  { hex: '#f59e0b', label: 'amber' },
  { hex: '#ef4444', label: 'red' },
  { hex: '#a855f7', label: 'violet' },
]

export const BG_PRESETS: ColorPreset[] = [
  { hex: '#ffffff', label: 'white' },
  { hex: '#f7f7f8', label: 'paper' },
  { hex: '#0b0d10', label: 'ink' },
  { hex: '#14171c', label: 'graphite' },
  { hex: '#1e293b', label: 'slate' },
  { hex: '#0f172a', label: 'midnight' },
]

const HEX_RE = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function isValidHex(v: string): boolean {
  return HEX_RE.test(v.trim())
}

export function stripHash(v: string): string {
  return v.trim().replace(/^#/, '')
}
