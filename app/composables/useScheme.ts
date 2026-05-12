// Lightweight color-scheme accessor. Replaces @roku-ui/vue's
// useSchemeString/RokuProvider so the landing bundle no longer pulls in the
// entire Roku Vue runtime.
//
// Source of truth on the client is the `data-scheme` attribute on <html>,
// driven by app/plugins/scheme.client.ts. CSS in app/assets/tokens.css keys
// off `html[data-scheme="light"]` / `html[data-scheme="dark"]`. The user
// preference is persisted in localStorage under `scheme` (matches the legacy
// Roku key for migration safety).

export type SchemeString = 'light' | 'dark' | 'system'

export function useSchemeString() {
  return useState<SchemeString>('app-scheme', () => 'system')
}
