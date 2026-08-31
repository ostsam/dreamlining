import { defineConfig } from "drizzle-kit";
import { readMigrationEnv } from "./src/config/env-schema";

const { databaseUrlUnpooled } = readMigrationEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url: databaseUrlUnpooled },
});
