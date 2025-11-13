# Repository Guidelines

## Project Structure & Module Organization
Codetime Web V3 is a Nuxt 4 + TypeScript app. Feature UI lives in `app/` (pages, components, layouts, middleware, i18n, theme, shared utilities). `app/api/v3` is generated from `openapi-ts.config.ts`, so never hand-edit those files. Server logic resides in `server/`, static assets in `public/`, and build output in `dist/`. Root configs (`nuxt.config.ts`, `uno.config.ts`, `eslint.config.js`, `ecosystem.config.cjs`) drive runtime, styling, linting, and PM2 deployment.

## Build, Test, and Development Commands
Use `pnpm` for every workflow:
```
pnpm dev            # Nuxt dev server on :3001 with .env.dev
pnpm build          # Production bundle (checks env + type safety)
pnpm preview        # Serve the built bundle locally
pnpm lint           # ESLint with @jannchie/eslint-config
pnpm typecheck      # nuxi typecheck for Vue/TS contracts
pnpm generate       # Static site output when needed
pnpm openapi        # Regenerate API SDK before touching app/api/v3
pnpm deploy         # openapi → build → pm2 start via ecosystem.config.cjs
```
## Coding Style & Naming Conventions
Author components and composables in TypeScript using `<script setup>` or TSX when necessary. Stick to 2-space indentation, kebab-case filenames for pages/layouts, and `useX` prefixes for composables (`app/composables/useSession.ts`). Keep shared constants in `app/utils` and prefer composables over direct store mutations. UnoCSS, Roku UI, and ESLint enforce most formatting; let `pnpm lint --fix` apply structural fixes, but review generated changes. Keep generated types isolated under `app/api/v3` to avoid circular imports.

## Testing Guidelines
Until a shared Vitest suite lands, linting, type-checking, and Nuxt smoke tests are mandatory. For logic-heavy utilities or composables, add `*.spec.ts` beside the source (or under `tests/` once created) and run them locally with Vitest before opening a PR. Name tests after scenario plus expectation (example: `useSession.spec.ts` / `should refresh token when clock skews`) and mention any coverage gaps in the PR description.

## Commit & Pull Request Guidelines
History follows Conventional Commits (`type(scope): summary`), so match that style (`feat(leaderboard): add loading skeleton`). Each PR needs a short summary, linked issue, UI screenshots when visuals change, and confirmation that `pnpm lint`, `pnpm typecheck`, and `pnpm build` succeeded. Highlight regenerated assets (OpenAPI SDK, UnoCSS snapshots) and keep PRs scoped to one feature or fix.

## Security & Configuration Tips
Use `.env.dev` for local secrets when running `pnpm dev`, and never commit `.env.*`. Manage Sentry, SEO, and analytics keys through environment variables consumed in `nuxt.config.ts`. When touching deployment code, keep `ecosystem.config.cjs`, PM2 process names, and server middleware changes synchronized.
