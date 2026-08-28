import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const deployScript = new URL("../../../scripts/deploy_drive_lab_ftp.py", import.meta.url);
const junctionBank = new URL("../public/audio/junction.svb", import.meta.url);

test("the deploy gate recognizes an owned JUNCTION bank without accepting arbitrary audio", () => {
  const program = String.raw`
import importlib.util
import pathlib
import sys

spec = importlib.util.spec_from_file_location("sedicivalvole_deploy", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
bank = pathlib.Path(sys.argv[2]).read_bytes()
assert module.is_recognized_junction_bank(bank)
assert not module.is_recognized_junction_bank(b"not-a-junction-bank")
assert not module.is_recognized_junction_bank(b"BADMAGIC" + bank[8:])
assert module.LEGACY_UI_HASHES == {
    "launch-latch.png": "2a692ce1a7d3933495f1047be4449a7c168dbb1692a3724ec62a9c60b6b51c49",
    "launch-safety.png": "19533d8ce389d7342806f6090ca52b17c582adfac841bb3172ef175e29359d8c",
    "launch-vent.png": "e78d35a833b66dc5dd2cada78521db77b8e146ff820fd7366b98bc828bda0f1c",
}
`;
  execFileSync("python3", [
    "-c",
    program,
    deployScript.pathname,
    junctionBank.pathname,
  ], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
});

test("the deploy gate verifies the packaged font tree explicitly", () => {
  const source = readFileSync(deployScript, "utf8");

  assert.match(source, /"fonts",\n\s+"third-party"/);
  assert.match(source, /if "fonts" in root_names:/);
  assert.match(source, /BUILD \/ "fonts",\n\s+tree_name="fonts"/);
});
