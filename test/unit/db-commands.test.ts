import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const hermeticEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH ?? "",
  HOME: process.env.HOME ?? "/tmp",
  TMPDIR: process.env.TMPDIR ?? "/tmp",
  NODE_ENV: "test",
};

describe("database command boundaries", () => {
  it("generates schema offline without reading database or guard inputs", () => {
    const output = execFileSync("bun", ["scripts/db-generate.mjs"], {
      cwd: process.cwd(),
      env: hermeticEnv,
      encoding: "utf8",
    });
    expect(output).toContain("db:generate passed");
    expect(output).not.toContain("branch guard");
  });

  it("fails before starting migration when direct configuration is absent", () => {
    const result = spawnSync("bun", ["scripts/db-migrate.mjs"], {
      cwd: process.cwd(),
      env: hermeticEnv,
      encoding: "utf8",
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).not.toContain(
      "drizzle-kit migrate",
    );
  });
});
