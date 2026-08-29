import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { audioWorklet } from "./scripts/vite-audio-worklet.mjs";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  assertStaticTreeSafe,
  readStaticTreeSafely,
} from "./scripts/static-package-safety.mjs";

const productVersion = readFileSync(new URL("../../VERSION", import.meta.url), "utf8").trim();
const projectDirectory = fileURLToPath(new URL("./", import.meta.url));
const publicDirectory = fileURLToPath(new URL("./public/", import.meta.url));
const distDirectory = fileURLToPath(new URL("./dist/", import.meta.url));

function verifyStaticBuildTrees() {
  assertStaticTreeSafe(publicDirectory, projectDirectory);
  if (existsSync(distDirectory)) assertStaticTreeSafe(distDirectory, projectDirectory);
}

function staticPackageSafety() {
  return {
    name: "sedicivalvole-static-package-safety",
    apply: "build",
    enforce: "pre",
    buildStart() {
      verifyStaticBuildTrees();
      for (const asset of readStaticTreeSafely(publicDirectory, projectDirectory)) {
        this.emitFile({ type: "asset", ...asset });
      }
    },
    writeBundle(outputOptions) {
      if (outputOptions.dir && existsSync(outputOptions.dir)) {
        assertStaticTreeSafe(outputOptions.dir, projectDirectory);
      }
    },
    closeBundle: verifyStaticBuildTrees,
  };
}

verifyStaticBuildTrees();

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
  base: "/",
  build: {
    outDir: "dist/client",
    copyPublicDir: false,
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
  plugins: [staticPackageSafety(), react(), audioWorklet()],
});
