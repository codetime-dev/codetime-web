import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, presetIcons, presetWind4 } from 'unocss'

// In-house brand icons that no iconify collection ships. Add new files
// to `app/assets/icons/<name>.svg`, then reference as `i-brand-<name>`.
const brandIconsDir = fileURLToPath(new URL('app/assets/icons/', import.meta.url))
function loadBrand(name: string): string {
  return readFileSync(`${brandIconsDir}${name}.svg`, 'utf8')
}

// Codetime design tokens are declared in app/assets/tokens.css.
// The theme below exposes them to UnoCSS utilities so authoring stays
// short (e.g. `bg-ct-surface`, `text-ct-fg`, `rounded-ct-lg`).
export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      collections: {
        brand: {
          opencode: () => loadBrand('opencode'),
          pi: () => loadBrand('pi'),
        },
      },
    }),
  ],
  theme: {
    colors: {
      ct: {
        'primary': 'var(--ct-primary)',
        'primary-hover': 'var(--ct-primary-hover)',
        'primary-active': 'var(--ct-primary-active)',
        'on-primary': 'var(--ct-on-primary)',
        'bg': 'var(--ct-bg)',
        'surface': 'var(--ct-surface)',
        'surface-1': 'var(--ct-surface-1)',
        'surface-2': 'var(--ct-surface-2)',
        'surface-3': 'var(--ct-surface-3)',
        'border': 'var(--ct-border)',
        'border-strong': 'var(--ct-border-strong)',
        'border-subtle': 'var(--ct-border-subtle)',
        'fg': 'var(--ct-fg)',
        'fg-muted': 'var(--ct-fg-muted)',
        'fg-subtle': 'var(--ct-fg-subtle)',
        'fg-disabled': 'var(--ct-fg-disabled)',
        'success': 'var(--ct-success)',
        'warning': 'var(--ct-warning)',
        'danger': 'var(--ct-danger)',
        'info': 'var(--ct-info)',
      },
    },
    borderRadius: {
      'ct-xs': 'var(--ct-radius-xs)',
      'ct-sm': 'var(--ct-radius-sm)',
      'ct-md': 'var(--ct-radius-md)',
      'ct-lg': 'var(--ct-radius-lg)',
      'ct-xl': 'var(--ct-radius-xl)',
      'ct-2xl': 'var(--ct-radius-2xl)',
    },
    fontFamily: {
      sans: 'var(--ct-font-sans)',
      mono: 'var(--ct-font-mono)',
    },
    boxShadow: {
      'ct-sm': 'var(--ct-shadow-sm)',
      'ct-md': 'var(--ct-shadow-md)',
      'ct-lg': 'var(--ct-shadow-lg)',
    },
  },
  safelist: [
    'i-mdi-apple',
    'i-mdi-microsoft-windows',
    'i-codicon-terminal-linux',
    'i-mdi-desktop-classic',
    // Supported AI agents shown as chips in DashboardAgentGuide —
    // icon classes are interpolated at runtime so UnoCSS can't
    // statically discover them.
    'i-simple-icons-anthropic',
    'i-simple-icons-openai',
    'i-brand-opencode',
    'i-brand-pi',
  ],
})
