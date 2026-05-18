import { defineConfig, presetIcons, presetWind4 } from 'unocss'

// In-house brand icons that no iconify collection ships. Inlined as
// raw SVG strings (presetIcons / @iconify/utils' custom loader expects
// a string here — returning IconifyIcon objects crashes with
// "result.indexOf is not a function"). Inlining also avoids a
// readFileSync round-trip that was finicky under vite-node HMR.
// New icons: add a `<svg>` string below and reference as
// `i-brand-<name>` from a template (or add it to `safelist` if the
// class is only ever interpolated at runtime).
const BRAND_ICONS: Record<string, string> = {
  // opencode.ai favicon — frame (rectangle outline with the "screen"
  // hole) plus the inner detail block. The original favicon also
  // ships a full-canvas background rect; we drop it so the icon
  // renders as a clean monochrome mask rather than a solid square.
  opencode: '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M384 416H128V96H384V416ZM320 160H192V352H320V160Z"/><path fill="currentColor" d="M320 224V352H192V224Z"/></svg>',
  // Pi (inflection.ai) mark — stylised lowercase π plus its detached
  // terminal block. Both paths use currentColor so the icon tints to
  // the surrounding text colour.
  pi: '<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" fill-rule="evenodd" d="M165.29 165.29H517.36V400H400V517.36H282.65V634.72H165.29ZM282.65 282.65V400H400V282.65Z"/><path fill="currentColor" d="M517.36 400H634.72V634.72H517.36Z"/></svg>',
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
        brand: Object.fromEntries(
          Object.entries(BRAND_ICONS).map(([name, svg]) => [name, () => svg]),
        ),
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
    // Provider icons rendered next to model names in Vibe ModelCosts.
    // Same dynamic-class issue — explicit listing keeps them in the
    // production CSS even when no template references them statically.
    'i-simple-icons-google',
    'i-simple-icons-deepseek',
    'i-simple-icons-meta',
    'i-simple-icons-mistralai',
    'i-simple-icons-x',
    'i-simple-icons-alibabacloud',
    'i-mdi-cube-outline',
  ],
})
