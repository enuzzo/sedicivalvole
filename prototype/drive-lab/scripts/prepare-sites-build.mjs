#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertStaticFileSafe,
  assertStaticTreeSafe,
  copyStaticFileSafely,
} from "./static-package-safety.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const hosting = path.join(root, ".openai", "hosting.json");
const serverOutput = path.join(dist, "server");
const hostingOutput = path.join(dist, ".openai");

for (const directory of [path.dirname(worker), path.dirname(hosting)]) {
  assertStaticTreeSafe(directory, root);
}
for (const file of [index, worker, hosting]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
  assertStaticFileSafe(file, root);
}

assertStaticTreeSafe(dist, root);
for (const directory of [serverOutput, hostingOutput]) {
  if (existsSync(directory)) assertStaticTreeSafe(directory, root);
  else mkdirSync(directory, { recursive: true });
}
copyStaticFileSafely(worker, path.join(serverOutput, "index.js"), root);
copyStaticFileSafely(hosting, path.join(hostingOutput, "hosting.json"), root);

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
