// Lightweight color-scheme accessor.
//
// Source of truth on the client is the `data-scheme` attribute on <html>,
// driven by app/plugins/scheme.client.ts. CSS in app/assets/tokens.css keys
// off `html[data-scheme="light"]` / `html[data-scheme="dark"]`. The user
// preference is persisted in localStorage under `scheme`.

export type SchemeString = 'light' | 'dark' | 'system'

export function useSchemeString() {
  return useState<SchemeString>('app-scheme', () => 'system')
}
