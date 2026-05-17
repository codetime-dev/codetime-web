# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Codetime Web V3 is a Nuxt.js web application for code time analytics, running at <https://codetime.dev>. This is the third iteration, evolved from Vue SPA to Next.js and now to Nuxt.js, with visualization switched from ECharts to Observable Plot.

## Development Commands

- **Install dependencies:** `pnpm install` (preferred package manager)
- **Development server:** `pnpm run dev` (binds port 3002 with .env.dev;
  production PM2 holds 3001)
- **Build for production:** `pnpm run build`
- **Lint and fix:** `pnpm run lint` (uses @jannchie/eslint-config with UnoCSS support)
- **Generate static site:** `pnpm run generate`
- **Preview production build:** `pnpm run preview`
- **Update API SDK:** `pnpm openapi` (regenerates from OpenAPI spec at test.codetime.dev)
- **Deploy:** `pnpm deploy` (updates API, builds, and starts with PM2)

## Architecture

### Framework Stack

- **Frontend:** Nuxt.js 4 with Vue 3 and TypeScript
- **Styling:** UnoCSS with design tokens declared in `app/assets/tokens.css` and exposed via the `ct-*` theme block in `uno.config.ts`
- **API:** Auto-generated TypeScript SDK from OpenAPI spec
- **Backend:** Nuxt/Nitro routes under `server/routes/v3/...` own every
  `/v3/*` endpoint. The legacy Python service (`codetime-server-v3`,
  still reachable at `api.codetime.dev`) survives only for the VSCode
  plugin's event-log uploads and the LemonSqueezy webhook, until edge
  routing proxies them across. Drizzle ORM over the same Postgres.
- **Deployment:** PM2 cluster mode with health checks
- **Visualization:** Observable Plot for charts and data visualization

### Directory Structure

- `app/` - Main application code (Nuxt 4 app directory structure)
  - `api/v3/` - Auto-generated API client (ignored by ESLint)
  - `components/` - Vue components organized by feature
  - `composables/` - Shared reactive logic
  - `i18n/` - Internationalization with support for 12+ languages
  - `layouts/` - Page layouts (default, dashboard, landing, user)
  - `pages/` - File-based routing with locale support
  - `utils/` - Helper functions and data formatters
- `public/` - Static assets including VSCode icons
- `server/` - Nitro server: middleware, routes, and the **owner of every
  `/v3/*` endpoint** (see `server/CLAUDE.md`)
- `shared/` - Code visible to both app and server (empty after the
  Python → Nuxt cutover removed `migrated-routes.ts`)

### Key Patterns

- **Routing:** File-based with locale parameter `[locale]/dashboard/workspace.vue`
- **State Management:** Vue's ref/computed + composables (no Vuex/Pinia)
- **Data Fetching:** `useAsyncData` composable with API client
- **Internationalization:** Translation keys via `useI18N()` composable
- **LRU Cache:** Custom `useLRU` composable for recent selections
- **Type Safety:** Strict TypeScript with `@typescript-eslint/consistent-type-definitions`

### Component Organization

- `Badge/` - Badge and card components
- `Dashboard/` - Dashboard-specific components (calendar, stats, filters)
- `Landing/` - Landing page components
- `Polt/` - Observable Plot chart wrappers
- `Tag/` - Tag management and statistics
- `R/` - Reusable UI components (buttons, inputs, etc.)

### API Integration

- Auto-generated SDK from OpenAPI spec at `https://codetime.dev/v3/docs/openapi.json`
- Client configured in `app/app.vue` with `credentials: 'include'` and a
  same-origin base URL — every request lands on the Nuxt backend that
  serves the current page.
- The curated OpenAPI surface at `/v3/docs/openapi.json` is built from
  each route's `defineRouteMeta` block (server/routes/v3/docs/openapi.json.ts)
  and rendered through Scalar at `/docs/api`.

### Backend (`server/`)

Conventions for `/v3/*` handlers — auth, Drizzle, error shape, OpenAPI
metadata, and the things to deliberately NOT do — live in
`server/CLAUDE.md`. Read it before touching anything under `server/`.

### Styling Conventions

- UnoCSS utility-first approach driven by `ct-*` theme tokens
- Safelist includes platform icons (`i-mdi-apple`, `i-mdi-microsoft-windows`, etc.)
- Font stack: Inter for Latin, HarmonyOS Sans for CJK languages
- VSCode file type icons available in `public/vscode-icons/`

### Deployment Configuration

- PM2 cluster mode with 2 instances
- Health checks on port 3000 at `/en` endpoint
- Memory limit: 500MB with automatic restart
- Production server runs on port 3001 (dev server uses 3002)
- Postgres credentials (`POSTGRES_*` env) must be present at runtime —
  the Nuxt backend connects to the same DB as the Python service

## Development Guidelines

### Code Quality

- ESLint with strict TypeScript rules enforced
- Type definitions prefer `type` over `interface`
- Auto-generated API code excluded from linting
- Binary operators indentation rule disabled for readability

### Internationalization

- Support for 12+ languages (en, zh-CN, zh-TW, ja, de, es, fr, it, ru, ua, ms, pt-BR)
- All UI text must use translation keys
- Locale-aware routing with `[locale]` parameter

### Data Visualization

- Observable Plot for charts (daily distribution, language stats, flame charts)
- Custom plot components in `components/Polt/`
- D3.js available for advanced visualizations

### Performance

- UnoCSS for optimized CSS
- Nuxt image optimization enabled
- Auto-imports for composables and utilities
- Code splitting via Nuxt's built-in features
