import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => ({
  resolve: {
    // Mirror the tsconfig "@/*" path alias so tests can import app modules.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Load .env / .env.local into the test environment (prefix "" = all vars),
    // so `npm test` picks up Supabase creds without exporting them by hand.
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
