import { defineConfig } from 'unocss'

// Codetime design tokens are declared in app/assets/tokens.css.
// The theme below exposes them to UnoCSS utilities so authoring stays
// short (e.g. `bg-ct-surface`, `text-ct-fg`, `rounded-ct-lg`).
export default defineConfig({
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
  ],
})
