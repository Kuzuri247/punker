import type { UIMessage } from "ai"
import { sql } from "drizzle-orm"
import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Clerk organization id (`auth().orgId`), not a foreign key.
    orgId: text("org_id").notNull(),
    title: text("title").notNull(),
    // The game's chat thread, in the `useChat` UI message format. One game has
    // exactly one thread, so it is stored inline rather than in its own table.
    messages: jsonb("messages")
      .$type<UIMessage[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    // Trigger.dev chat session state for the thread above, written by the
    // agent's `onTurnComplete` in the same statement as the messages. The
    // cursor is what a reloading browser resumes an interrupted turn from, so
    // it must never be written ahead of the messages it points past.
    chatAccessToken: text("chat_access_token"),
    chatLastEventId: text("chat_last_event_id"),
    // The Daytona sandbox the game is built in, created on the thread's first
    // turn. Null until then, and for games created before sandboxes existed.
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Games are always read scoped to an org, usually newest first. The
    // leading org_id also serves plain `where org_id = ?` lookups.
    index("games_org_id_created_at_idx").on(
      table.orgId,
      table.createdAt.desc()
    ),
  ]
)

export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Clerk organization id (`auth().orgId`), not a foreign key.
    orgId: text("org_id").notNull(),
    // What the row is for, e.g. `step:<responseId>`. Unique per org, so a
    // retried write of the same entry collides rather than double-counting.
    entryKey: text("entry_key").notNull(),
    // Billionths of a dollar. Negative for spend, positive for top-ups.
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    unique("credit_ledger_org_id_entry_key_key").on(
      table.orgId,
      table.entryKey
    ),
  ]
)

export type CreditLedgerEntry = typeof creditLedger.$inferSelect
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(), // sub_xxx from Dodo
  userId: text("user_id").notNull().unique(), // Clerk user ID or org ID
  customerId: text("customer_id").notNull(),
  tier: text("tier").notNull().default("free"), // free | pro | studio
  status: text("status").notNull(), // active, on_hold, cancelled
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  sandboxMemoryMb: integer("sandbox_memory_mb").notNull().default(1024),
  sandboxVcpu: integer("sandbox_vcpu").notNull().default(1),
  maxConcurrentSandboxes: integer("max_concurrent_sandboxes").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new Date()),
})

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert

export const creditWallets = pgTable("credit_wallets", {
  userId: text("user_id").primaryKey(), // Clerk user ID or org ID
  balance: integer("balance").notNull().default(50),
  lifetimePurchased: integer("lifetime_purchased").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new Date()),
})

export type CreditWallet = typeof creditWallets.$inferSelect
export type NewCreditWallet = typeof creditWallets.$inferInsert
