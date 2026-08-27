import { execFileSync } from "node:child_process";
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
