import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseAppEnv } from "../src/server/env";

type Database = ReturnType<typeof drizzle>;
type DatabaseGlobals = {
  pool?: Pool;
  db?: Database;
};

const globalDatabase = globalThis as typeof globalThis & {
  __dreamliningDb?: DatabaseGlobals;
};

export function getDb(): Database {
  const state = (globalDatabase.__dreamliningDb ??= {});
  if (!state.db) {
    const { databaseUrl } = getDatabaseAppEnv();
    state.pool = new Pool({ connectionString: databaseUrl });
    state.db = drizzle(state.pool);
  }
  return state.db;
}

export async function closeDbForTests(): Promise<void> {
  const state = globalDatabase.__dreamliningDb;
  if (state?.pool) await state.pool.end();
  delete globalDatabase.__dreamliningDb;
}

export const getDatabase = getDb;
export const resetDbForTests = closeDbForTests;
