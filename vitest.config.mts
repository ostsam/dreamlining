import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: { "server-only": path.resolve("test/server-only.ts") },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.{ts,tsx}"],
    reporters: ["default"],
  },
});
