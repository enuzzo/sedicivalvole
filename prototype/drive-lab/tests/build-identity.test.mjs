import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const viteSource = readFileSync(new URL("../vite.config.mjs", import.meta.url), "utf8");

test("the diagnostic report carries version, build stamp, and commit identity", () => {
  assert.match(viteSource, /__APP_VERSION__:\s*JSON\.stringify\(productVersion\)/);
  assert.match(viteSource, /__APP_BUILD__:\s*JSON\.stringify\(productBuild\)/);
  assert.match(viteSource, /__APP_COMMIT__:\s*JSON\.stringify\(productCommit\)/);

  assert.match(appSource, /version:\s*APP_VERSION/);
  assert.match(appSource, /build:\s*APP_BUILD/);
  assert.match(appSource, /commit:\s*APP_COMMIT/);
});
