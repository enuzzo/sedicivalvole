import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const indexSource = await read("../server/lab-index.php");
const bootstrapSource = await read("../server/lab-bootstrap.php");
const sendSource = await read("../server/lab-send.php");
const packageSource = await read("../scripts/package-lab.mjs");
const viteSource = await read("../vite.lab.config.mjs");
const deploySource = await read("../../../scripts/deploy_drive_lab_ftp.py");
const appSource = await read("../src/lab/main.jsx");
const stylesSource = await read("../src/lab/styles.css");

test("the canonical LAB gate keeps authentication and secrets on the PHP boundary", () => {
  assert.match(indexSource, /hash_pbkdf2\('sha256'/);
  assert.match(indexSource, /session_regenerate_id\(true\)/);
  assert.match(indexSource, /Content-Security-Policy/);
  assert.match(indexSource, /window\.__SEDICIVALVOLE_LAB_BOOT__/);
  assert.doesNotMatch(indexSource, /password_hash_hex.*[a-f0-9]{64}/);
  assert.match(bootstrapSource, /'secure' => true/);
  assert.match(bootstrapSource, /'httponly' => true/);
  assert.match(bootstrapSource, /'samesite' => 'Strict'/);
  assert.match(bootstrapSource, /labRequireSameOrigin/);
  assert.match(bootstrapSource, /labRequireCsrf/);
});

test("the LAB bundle is inlined behind the gate and leaves no directly fetchable client bundle", () => {
  assert.match(viteSource, /"process\.env\.NODE_ENV": JSON\.stringify\("production"\)/);
  assert.match(packageSource, /LAB browser bundle still contains an unresolved Node\.js environment reference/);
  assert.match(packageSource, /dist\/client\/lab/);
  assert.match(packageSource, /replace\("\/\*__LAB_CSS__\*\/", \(\) => safeCss\)/);
  assert.match(packageSource, /replace\("\/\*__LAB_JS__\*\/", \(\) => safeJavascript\)/);
  assert.match(indexSource, /\/\*__LAB_CSS__\*\//);
  assert.match(indexSource, /\/\*__LAB_JS__\*\//);
  assert.doesNotMatch(indexSource, /<script[^>]+src=/i);
  assert.doesNotMatch(indexSource, /<link[^>]+stylesheet/i);
  assert.match(viteSource, /audioWorklet\(\)/);
  assert.match(packageSource, /audio runtime assets/);
});

test("LAB audio is a disposable test source and never enters the visual preset", () => {
  assert.match(appSource, /import \{ createAudioEngine \} from "\.\.\/audio-engine\.js"/);
  assert.match(appSource, /id: "mute", label: "MUTE"/);
  assert.match(appSource, /GENERATIVE \/ FRACTURE/);
  assert.match(appSource, /visual preset unchanged/);
  assert.match(appSource, /START AUDIO/);
  assert.doesNotMatch(appSource, /setParam\("context\.music"/);
});

test("the live macro strip stays inside the preview column at the Tesla viewport", () => {
  assert.match(stylesSource, /\.lab-macro-strip\s*\{[\s\S]*grid-column:\s*2;/);
  assert.match(stylesSource, /width:\s*min\(calc\(100% - 24px\), 360px\)/);
  assert.doesNotMatch(stylesSource, /\.lab-macro-strip\s*\{[\s\S]*?left:\s*50%/);
});

test("the LAB keyboard drives the shared vehicle motion model without stealing control focus", () => {
  assert.match(appSource, /import \{ advanceDemoMotion \} from "\.\.\/signal-model\.js"/);
  assert.match(appSource, /event\.key === "ArrowUp"/);
  assert.match(appSource, /event\.key === "ArrowDown" \|\| event\.code === "Space"/);
  assert.match(appSource, /canUseDriveKeyboard\(event\.target\)/);
  assert.match(appSource, /"context\.inputSource": "demo"/);
  assert.match(appSource, /REGEN · accelerator released/);
  assert.match(appSource, /tabIndex=\{0\}/);
});

test("SEND JSON requires an authenticated session and preserves the preset privacy contract", () => {
  assert.match(sendSource, /labRequireAuthenticatedJson\(\$config\)/);
  assert.match(sendSource, /labRequireSameOrigin\(\)/);
  assert.match(sendSource, /labRequireCsrf\(\)/);
  assert.match(sendSource, /sedicivalvole\.lab-preset\.v1/);
  assert.match(sendSource, /coordinateFree/);
  assert.match(sendSource, /secretsIncluded/);
  assert.match(sendSource, /buildLabPresetMail/);
  assert.match(sendSource, /accepted_by_mail_transport/);
  assert.match(appSource, /preset retained for retry/);
});

test("deployment derives an upload-only PBKDF2 verifier without logging the access code", () => {
  assert.match(deploySource, /hashlib\.pbkdf2_hmac/);
  assert.match(deploySource, /secrets\.token_bytes\(24\)/);
  assert.match(deploySource, /LAB_ACCESS_PASSWORD/);
  assert.match(deploySource, /auth\.local\.php/);
  assert.doesNotMatch(deploySource, /print\([^\n]*LAB_ACCESS_PASSWORD/);

  const program = String.raw`
import importlib.util
import pathlib
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
payload = module.build_lab_auth_config("correct horse battery staple")
assert b"correct horse battery staple" not in payload
assert all(marker in payload for marker in module.LAB_AUTH_CONFIG_MARKERS)
assert b"'iterations' => 310000" in payload
try:
    module.build_lab_auth_config("short")
except ValueError:
    pass
else:
    raise AssertionError("short password accepted")
`;
  execFileSync("python3", ["-c", program, new URL("../../../scripts/deploy_drive_lab_ftp.py", import.meta.url).pathname], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});
