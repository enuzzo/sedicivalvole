import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockfile = JSON.parse(readFileSync(join(projectRoot, "package-lock.json"), "utf8"));
const esbuildVersion = lockfile.packages?.["node_modules/esbuild"]?.version;
const rollupVersion = lockfile.packages?.["node_modules/rollup"]?.version;

if (!esbuildVersion || !rollupVersion) {
  console.error("Native toolchain versions are missing from package-lock.json.");
  process.exit(1);
}

const platformPackage = (family) => {
  if (process.platform !== "darwin" || !["arm64", "x64"].includes(process.arch)) {
    throw new Error(`Unsupported native toolchain target: ${process.platform}-${process.arch}`);
  }
  return family === "esbuild"
    ? `@esbuild/darwin-${process.arch}`
    : `@rollup/rollup-darwin-${process.arch}`;
};

const cacheRoot = resolve(
  process.env.SEDICIVALVOLE_NATIVE_TOOLCHAIN_DIR
    || join(homedir(), ".cache", "sedicivalvole", "native-toolchain"),
  `${process.platform}-${process.arch}`,
  `esbuild-${esbuildVersion}_rollup-${rollupVersion}`,
);
const esbuildPackage = platformPackage("esbuild");
const rollupPackage = platformPackage("rollup");
const esbuildBinary = join(cacheRoot, "node_modules", ...esbuildPackage.split("/"), "bin", "esbuild");
const rollupBinary = join(
  cacheRoot,
  "node_modules",
  ...rollupPackage.split("/"),
  `rollup.darwin-${process.arch}.node`,
);

function ready() {
  return existsSync(esbuildBinary) && existsSync(rollupBinary);
}

function printStatus() {
  console.log(JSON.stringify({
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    cacheRoot,
    esbuild: { package: esbuildPackage, version: esbuildVersion, ready: existsSync(esbuildBinary) },
    rollup: { package: rollupPackage, version: rollupVersion, ready: existsSync(rollupBinary) },
  }, null, 2));
}

function prepare() {
  if (ready()) return;
  mkdirSync(cacheRoot, { recursive: true });
  writeFileSync(join(cacheRoot, "package.json"), `${JSON.stringify({ private: true }, null, 2)}\n`);
  const result = spawnSync(process.env.npm_execpath || "npm", [
    "install",
    "--no-audit",
    "--no-fund",
    "--ignore-scripts",
    "--no-save",
    `${esbuildPackage}@${esbuildVersion}`,
    `${rollupPackage}@${rollupVersion}`,
  ], {
    cwd: cacheRoot,
    stdio: "inherit",
  });
  if (result.status !== 0 || !ready()) {
    console.error("Could not prepare the architecture-specific native toolchain.");
    process.exit(result.status || 1);
  }
}

const args = process.argv.slice(2);
if (args[0] === "--check") {
  printStatus();
  process.exit(ready() ? 0 : 1);
}
if (args[0] === "--prepare") {
  prepare();
  printStatus();
  process.exit(0);
}
if (args[0] !== "--" || args.length < 2) {
  console.error("Usage: node scripts/native-toolchain.mjs --check | --prepare | -- <command> [args...]");
  process.exit(2);
}

prepare();
const [command, ...commandArgs] = args.slice(1);
const inheritedNodePath = process.env.NODE_PATH ? `:${process.env.NODE_PATH}` : "";
const result = spawnSync(command, commandArgs, {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    ESBUILD_BINARY_PATH: esbuildBinary,
    NODE_PATH: `${join(cacheRoot, "node_modules")}${inheritedNodePath}`,
  },
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
