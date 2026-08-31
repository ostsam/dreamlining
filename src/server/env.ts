import "server-only";

import {
  readDatabaseAppEnv,
  readFullAppEnv,
  readMigrationEnv,
  type DatabaseAppEnv,
  type FullAppEnv,
  type MigrationAppEnv,
} from "../config/env-schema";

export function getDatabaseAppEnv(): DatabaseAppEnv {
  return readDatabaseAppEnv();
}

export function getMigrationEnv(): MigrationAppEnv {
  return readMigrationEnv();
}

export function getFullAppEnv(): FullAppEnv {
  return readFullAppEnv();
}
