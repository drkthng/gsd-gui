import { resolve } from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// On Windows the worktree directory may be a junction whose realpathSync
// resolves to a different drive letter (e.g. D: → C:). Vite's /@fs/ virtual
// file system handler uses realpathSync internally, so we must add the real
// path to server.fs.allow so setup files can be loaded from the symlink target.
const realRoot = realpathSync(resolve(__dirname));

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [resolve(__dirname), realRoot],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: true,
  },
});
