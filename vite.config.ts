import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vite dev server on port 1420 to match src-tauri/tauri.conf.json devUrl
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Exclude agent/tool working directories that write files continuously
      ignored: ["**/.bg-shell/**", "**/.gsd/**"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
