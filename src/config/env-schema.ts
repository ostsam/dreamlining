import {
  assertNeonUrlPair,
  parseHttpOrigin,
  parseNeonConnectionUrl,
  type NeonConnectionIdentity,
} from "./neon-url";

export type Environment = Record<string, string | undefined>;

export type DatabaseAppEnv = {
  databaseUrl: string;
  databaseIdentity: NeonConnectionIdentity;
};

export type MigrationAppEnv = {
  databaseUrlUnpooled: string;
  databaseIdentity: NeonConnectionIdentity;
  neonBranch: string;
};

export type FullAppEnv = DatabaseAppEnv & {
  appOrigin: string;
  adminPasswordHash: string;
  adminSessionSecret: string;
  contactEncryptionKey: Buffer;
  maintenanceSecret: string;
  nodeEnv: "development" | "test" | "production";
};

function required(env: Environment, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function validateSecret(value: string, key: string, minLength = 32): string {
  if (value.length < minLength)
    throw new Error(`${key} must contain at least ${minLength} characters`);
  return value;
}

export function readDatabaseAppEnv(
  env: Environment = process.env,
): DatabaseAppEnv {
  const databaseUrl = required(env, "DATABASE_URL");
  return {
    databaseUrl,
    databaseIdentity: parseNeonConnectionUrl(databaseUrl, "pooled"),
  };
}

export function readMigrationEnv(
  env: Environment = process.env,
): MigrationAppEnv {
  const databaseUrlUnpooled = required(env, "DATABASE_URL_UNPOOLED");
  const neonBranch = required(env, "NEON_BRANCH");
  const databaseIdentity = parseNeonConnectionUrl(
    databaseUrlUnpooled,
    "direct",
  );
  return {
    databaseUrlUnpooled,
    databaseIdentity,
    neonBranch,
  };
}

export function readFullAppEnv(env: Environment = process.env): FullAppEnv {
  const database = readDatabaseAppEnv(env);
  const appOrigin = parseHttpOrigin(required(env, "APP_ORIGIN"));
  const adminPasswordHash = required(env, "ADMIN_PASSWORD_HASH");
  if (!adminPasswordHash.startsWith("scrypt$")) {
    throw new Error("ADMIN_PASSWORD_HASH must be a versioned scrypt hash");
  }
  const adminSessionSecret = validateSecret(
    required(env, "ADMIN_SESSION_SECRET"),
    "ADMIN_SESSION_SECRET",
  );
  const maintenanceSecret = validateSecret(
    required(env, "MAINTENANCE_SECRET"),
    "MAINTENANCE_SECRET",
  );
  const encodedKey = required(env, "CONTACT_ENCRYPTION_KEY");
  let contactEncryptionKey: Buffer;
  try {
    if (
      !/^[A-Za-z0-9+/]*={0,2}$/.test(encodedKey) ||
      encodedKey.length % 4 !== 0
    ) {
      throw new Error("invalid base64");
    }
    contactEncryptionKey = Buffer.from(encodedKey, "base64");
    if (contactEncryptionKey.toString("base64") !== encodedKey) {
      throw new Error("non-canonical base64");
    }
  } catch {
    throw new Error("CONTACT_ENCRYPTION_KEY must be base64 encoded");
  }
  if (contactEncryptionKey.length !== 32) {
    throw new Error("CONTACT_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  const nodeEnv = env.NODE_ENV ?? "development";
  if (
    nodeEnv !== "development" &&
    nodeEnv !== "test" &&
    nodeEnv !== "production"
  ) {
    throw new Error("NODE_ENV must be development, test, or production");
  }
  return {
    ...database,
    appOrigin,
    adminPasswordHash,
    adminSessionSecret,
    contactEncryptionKey,
    maintenanceSecret,
    nodeEnv,
  };
}

export function assertDatabaseUrlPair(env: Environment = process.env) {
  return assertNeonUrlPair(
    required(env, "DATABASE_URL"),
    required(env, "DATABASE_URL_UNPOOLED"),
  );
}
