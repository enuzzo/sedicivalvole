import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { audioWorklet } from "./scripts/vite-audio-worklet.mjs";
import { jamendoCatalogDevServer } from "./scripts/vite-jamendo-catalog.mjs";
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

// Production exposes the authenticated owner surface at /lab/. Keep that same
// canonical route during local development so bookmarks and QA instructions do
// not need to know Vite's lab.html entry filename.
export function canonicalLabDevRoute() {
  return {
    name: "sedicivalvole-canonical-lab-dev-route",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const [pathname, query = ""] = (request.url || "").split("?", 2);
        if (pathname === "/lab" || pathname === "/lab/") {
          request.url = `/lab.html${query ? `?${query}` : ""}`;
        }
        next();
      });
    },
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

export default defineConfig(({ mode }) => {
  const repositoryDirectory = fileURLToPath(new URL("../../", import.meta.url));
  const repositoryEnv = loadEnv(mode, repositoryDirectory, "");
  const jamendoEnv = loadEnv("jamendo", repositoryDirectory, "");
  const prototypeEnv = loadEnv(mode, projectDirectory, "");
  const jamendoClientId = process.env.JAMENDO_CLIENT_ID
    || prototypeEnv.JAMENDO_CLIENT_ID
    || repositoryEnv.JAMENDO_CLIENT_ID
    || jamendoEnv.JAMENDO_CLIENT_ID
    || jamendoEnv.JAMENDO_API_KEY
    || "";

  return ({
  base: "/",
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    copyPublicDir: false,
  },
  define: {
    __APP_VERSION__: JSON.stringify(productVersion),
    __APP_BUILD__: JSON.stringify(productBuild),
    __APP_COMMIT__: JSON.stringify(productCommit),
  },
  optimizeDeps: {
    // Keep copied third-party HTML documents as static runtime assets. Vite's
    // default recursive HTML scan would otherwise parse historical upstream
    // modules as first-party dependency entries during local development.
    entries: ["index.html", "qa-field.html", "lab.html"],
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [
    canonicalLabDevRoute(),
    staticPackageSafety(),
    react(),
    audioWorklet(),
    jamendoCatalogDevServer({ clientId: jamendoClientId }),
  ],
  });
});
