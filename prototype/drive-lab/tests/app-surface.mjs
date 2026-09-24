// The running interface is App.jsx plus the presentational modules in
// src/app/. Source-contract tests read them together as one surface, App.jsx
// first, so a component can move between them without rewriting its contract.
import { readdirSync, readFileSync } from "node:fs";

const SOURCE_ROOT = new URL("../src/", import.meta.url);

export const APP_SURFACE_MODULES = readdirSync(new URL("app/", SOURCE_ROOT))
  .filter((name) => /\.jsx?$/.test(name))
  .sort();

export function readAppSurface() {
  return [
    readFileSync(new URL("App.jsx", SOURCE_ROOT), "utf8"),
    ...APP_SURFACE_MODULES.map((name) => readFileSync(new URL(`app/${name}`, SOURCE_ROOT), "utf8")),
  ].join("\n");
}
