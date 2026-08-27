import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { audioWorklet } from "./scripts/vite-audio-worklet.mjs";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const productVersion = readFileSync(new URL("../../VERSION", import.meta.url), "utf8").trim();

// Build stamp: local calendar time as YYYYMMDD-HHMM. This identifies the build
// itself and is what must be quoted whenever a build is published or deployed.
// It does not replace VERSION, which remains the only SemVer source of truth.
function buildStamp(at = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    at.getFullYear(),
    pad(at.getMonth() + 1),
    pad(at.getDate()),
    "-",
    pad(at.getHours()),
    pad(at.getMinutes()),
  ].join("");
}

const productBuild = buildStamp();

// Short commit of the tree the build came from, so a rendered frame can be tied
// back to an exact revision. Falls back to "unknown" rather than failing the
// build when git is unavailable.
function commitRef() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const productCommit = commitRef();

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/client",
  },
  define: {
    __APP_VERSION__: JSON.stringify(productVersion),
    __APP_BUILD__: JSON.stringify(productBuild),
    __APP_COMMIT__: JSON.stringify(productCommit),
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
  plugins: [react(), audioWorklet()],
});
