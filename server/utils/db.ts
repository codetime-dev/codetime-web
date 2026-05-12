import process from 'node:process'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

// Drizzle ORM over postgres-js. Connects to the SAME Postgres the Python
// service uses — see codetime-server-v3/src/db.py for env conventions.
// Alembic owns DDL; this layer only reads/writes data.

let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (db) {
 return db
}
  const sql = postgres({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'postgres',
    max: Number(process.env.POSTGRES_POOL_MAX ?? 10),
    idle_timeout: 30,
    connect_timeout: 10,
  })
  db = drizzle(sql, { schema })
  return db
}

export * as schema from '../db/schema'
