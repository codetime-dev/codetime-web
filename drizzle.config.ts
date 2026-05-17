import process from 'node:process'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit config.
//
// Two regimes coexist:
//   * Legacy editor tables (event_logs, workspace_minutes_v2, etc.) were
//     created by Alembic and are stable in production. `drizzle-kit
//     generate` will diff them on first run — review the emitted SQL and
//     drop any redundant CREATE TABLE statements before applying.
//   * New tables (machines, projects, agent_*) are Drizzle-owned going
//     forward. Generate SQL with `pnpm drizzle-kit generate` and apply
//     via the files under `server/db/migrations/`.

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'postgres',
    ssl: false,
  },
})
