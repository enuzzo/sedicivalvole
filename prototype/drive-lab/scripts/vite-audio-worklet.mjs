// Vite plugin: bundle an AudioWorklet entry into one self-contained file.
//
// `AudioWorklet.addModule()` loads a module script, so static imports do resolve
// in the browser — but only against whatever the server actually serves. A
// production build copies a `?url` import verbatim and never follows its
// imports, so a worklet that is split across modules loads in development and
// breaks the moment it is deployed.
//
// Bundling the entry with esbuild — already a Vite dependency, so this adds
// nothing to the dependency tree — removes the difference entirely: the same
// single file is served in development and emitted into the build.
//
// Usage:  import processorUrl from "./path/to/processor.js?audio-worklet";

import { build } from "esbuild";
import { resolve } from "node:path";

const SUFFIX = "?audio-worklet";
const DEV_ROUTE = "/@audio-worklet/";

async function bundleWorklet(entry) {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "esm",
    target: "es2021",
    platform: "browser",
    // The worklet global scope has no `window`; nothing here should reach for
    // one, and failing loudly at build time is better than failing at runtime.
    legalComments: "inline",
  });
  return result.outputFiles[0].text;
}

export function audioWorklet() {
  /** Development-time route → absolute entry path. */
  const served = new Map();
  let serving = false;

  return {
    name: "sedicivalvole:audio-worklet",
    enforce: "pre",

    configResolved(config) {
      serving = config.command === "serve";
    },

    async load(id) {
      if (!id.endsWith(SUFFIX)) return null;
      const entry = id.slice(0, -SUFFIX.length);
      const absolute = resolve(entry);

      if (serving) {
        // Development: register the entry and hand back a stable route. The
        // middleware rebundles on every request, so editing any module the
        // worklet imports takes effect on the next reload.
        const name = absolute.split("/").pop().replace(/\.js$/, "");
        const route = `${DEV_ROUTE}${name}.js`;
        served.set(route, absolute);
        this.addWatchFile(absolute);
        return `export default ${JSON.stringify(route)};`;
      }

      const code = await bundleWorklet(absolute);
      const referenceId = this.emitFile({
        type: "asset",
        name: `${absolute.split("/").pop()}`,
        source: code,
      });
      return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
    },

    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = (request.url ?? "").split("?")[0];
        const entry = served.get(path);
        if (!entry) return next();
        try {
          const code = await bundleWorklet(entry);
          response.setHeader("Content-Type", "text/javascript");
          response.setHeader("Cache-Control", "no-cache");
          response.end(code);
        } catch (error) {
          response.statusCode = 500;
          response.end(`/* audio worklet bundle failed */\nconsole.error(${
            JSON.stringify(String(error))
          });`);
        }
        return undefined;
      });
    },
  };
}
