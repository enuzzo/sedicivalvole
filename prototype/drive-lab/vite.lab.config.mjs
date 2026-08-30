import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { audioWorklet } from "./scripts/vite-audio-worklet.mjs";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const productVersion = readFileSync(new URL("../../VERSION", import.meta.url), "utf8").trim();

function buildStamp(at = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}`;
}

function commitRef() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  publicDir: false,
  define: {
    __APP_VERSION__: JSON.stringify(productVersion),
    __APP_BUILD__: JSON.stringify(buildStamp()),
    __APP_COMMIT__: JSON.stringify(commitRef()),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist/lab-build",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: "src/lab/main.jsx",
      name: "SedicivalvoleLab",
      formats: ["iife"],
      fileName: () => "lab.js",
      cssFileName: "lab",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  plugins: [react(), audioWorklet()],
});
