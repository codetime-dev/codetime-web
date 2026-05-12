import process from 'node:process'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit config for INTROSPECTING the existing Python-owned schema.
// We do NOT run `drizzle-kit push` or generate migrations here — alembic in
// codetime-server-v3 is the source of truth. Use `drizzle-kit introspect`
// (or `pull`) when extending server/db/schema.ts with new tables.

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
