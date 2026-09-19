import { parseEnv } from "@neon/env"
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import neonConfig from "@/neon"

import * as schema from "./schema"

type Database = NodePgDatabase<typeof schema>

// Reuse the pool across hot reloads in dev so we don't exhaust connections.
const globalForDb = globalThis as unknown as {
  pool?: Pool
  db?: Database
}

export function getDb(): Database {
  if (!globalForDb.db) {
    const { postgres } = parseEnv(neonConfig, ["DATABASE_URL"])
    const pool =
      globalForDb.pool ?? new Pool({ connectionString: postgres.databaseUrl })

    if (process.env.NODE_ENV !== "production") {
      globalForDb.pool = pool
    }

    globalForDb.db = drizzle(pool, { schema })
  }
  return globalForDb.db
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const instance = getDb()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === "function" ? value.bind(instance) : value
  },
})

export * from "./schema"
