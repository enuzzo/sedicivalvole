import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const productVersion = readFileSync(new URL("../../VERSION", import.meta.url), "utf8").trim();

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/client",
  },
  define: {
    __APP_VERSION__: JSON.stringify(productVersion),
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
